import getOpenAI from '../config/openai';
import prisma from '../config/database';
import logger from '../utils/logger';

interface GeneratedDraft {
  variation: number;
  angle: string;
  tone: string;
  content: string;
}

const ANGLES = [
  {
    name: 'observation',
    brief:
      'A story or specific scene. Open with a concrete moment (a client meeting, a campaign that flopped, a thing you noticed in someone\'s feed). 90-130 words. Do NOT name the agency anywhere in this post. Voice: a smart practitioner thinking out loud.',
  },
  {
    name: 'lesson',
    brief:
      'A tactical takeaway. Open with a flat assertion (no story). Give one concrete play the agency runs for clients with the rough mechanic in 2-3 sentences. Name the agency exactly once, naturally. 110-170 words. Voice: senior strategist briefing a client.',
  },
  {
    name: 'contrarian',
    brief:
      'Pushback. Open by stating the popular take, then disagree in the next line. Back it with reasoning, not stats you invented. 100-150 words. Mention the agency only if it earns the placement; otherwise leave it out. Voice: confident dissent, not snark.',
  },
];

class AIGeneratorService {
  private model: string;

  constructor() {
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  async generateDrafts(articleId: string): Promise<number> {
    const article = await prisma.newsArticle.findUnique({ where: { id: articleId } });
    if (!article) throw new Error(`Article ${articleId} not found`);

    logger.info(`Generating drafts for article: ${article.title}`);

    const [settings, insight] = await Promise.all([
      prisma.settings.findUnique({ where: { key: 'singleton' } }),
      prisma.promptInsight.findFirst({ orderBy: { generatedAt: 'desc' } }),
    ]);

    const agency = settings?.agencyName || 'DigitalKarvan';
    const services = settings?.agencyServices && settings.agencyServices.length > 0
      ? settings.agencyServices
      : ['digital marketing', 'branding', 'content strategy', 'performance marketing', 'SEO'];

    const systemPrompt = this.buildSystemPrompt(agency, services, insight?.summary, insight?.notes);
    const userPrompt = this.buildUserPrompt(article, insight, agency);

    const openai = await getOpenAI();
    const response = await openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.85,
      response_format: { type: 'json_object' },
      max_tokens: 2200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content generated from OpenAI');

    const drafts = this.parseDrafts(content);
    const savedCount = await this.saveDrafts(drafts, articleId);

    logger.info(`Generated and saved ${savedCount} drafts for article ${articleId}`);
    return savedCount;
  }

  private buildSystemPrompt(
    agency: string,
    services: string[],
    insightSummary?: string,
    insightNotes?: string | null,
  ): string {
    const insightBlock = insightSummary
      ? `\nWhat has worked recently for our page (from real engagement data):\n${insightSummary}${insightNotes ? `\nFurther notes: ${insightNotes}` : ''}\n`
      : '';

    return `You write LinkedIn posts for ${agency}, a digital marketing agency.
Services we sell: ${services.join(', ')}.
Audience: founders, marketing managers, and brand leads — people who hire agencies.
Goal: build trust and pipeline. Every post should make the reader think "these people actually know how to grow my brand."

Voice rules — non-negotiable:
- Sound like a senior strategist talking, not a content bot.
- No emojis. None. Not even one.
- No hashtag spam. 0 to 2 hashtags max, only if they genuinely fit.
- No "Read more:" links, no "What do you think?", no "Comment below", no "Drop a 🚀".
- No buzzwords: avoid "game-changer", "revolutionize", "unlock", "synergy", "leverage", "in today's fast-paced world", "the future of X is here".
- No fake numbers or stats you can't back up. If the article has a number, you can quote it; otherwise don't invent one.
- Vary sentence length. Short lines are fine. Fragments are fine. Don't write like a press release.
- Open with a real point, not a question. Hooks must feel like something a human would actually say at a meeting.
- It is OK — encouraged — to share a small piece of agency POV: "We do X for clients because…", "Last month a client of ours…" (kept generic, no names).
- Always relevant to ${agency}'s services. If the article is unrelated to marketing, refuse and return an empty drafts array.

Length: 90–180 words per post. Tight beats long.${insightBlock}`;
  }

  private buildUserPrompt(
    article: { title: string; summary: string; url: string; topics: string[] },
    insight: { topAngles: string[]; topTones: string[] } | null,
    agency: string,
  ): string {
    const angles = ANGLES.map((a, i) => `${i + 1}. ${a.name}: ${a.brief}`).join('\n');
    const insightHint = insight && (insight.topAngles.length || insight.topTones.length)
      ? `\nIf you have to choose, lean toward angles like [${insight.topAngles.join(', ') || '—'}] and tones like [${insight.topTones.join(', ') || '—'}] — those have outperformed for us.\n`
      : '';

    const isManual = article.url.startsWith('manual://');
    const sourceLabel = isManual ? 'Topic / brief from the user' : 'Source article';

    return `${sourceLabel}:
Title: ${article.title}
Summary: ${article.summary}
Topics it covers: ${article.topics.join(', ') || 'general marketing'}

Write 3 distinct LinkedIn post drafts. The angles are intentionally different — the reader should NOT feel like they read the same post three times.

${angles}
${insightHint}
Differentiation rules — every draft must obey these vs. the other two in the batch:
- Opening sentence: each draft's first 8 words must be structurally distinct (one starts with a scene/anecdote, one with an assertion, one with the popular-take-then-disagree pattern). No two drafts may open with the same phrasing pattern.
- Agency mention: ${agency} appears AT MOST ONCE in the batch's "lesson" draft. The "observation" draft must not mention ${agency} at all. The "contrarian" draft may mention it only if it adds weight, not as a signature.
- Closing line: must not all end with the same kind of payoff. Vary between "implication", "tactical instruction", "single-line punchline".
- Avoid recurring phrases: do not reuse "At ${agency}, we…", "The result?", "This not only…but also…", "ensures", "leverage", or any other phrase across drafts.
- Word counts within the angle's stated range, and the three drafts must not all land within 10 words of each other.

Return JSON exactly:
{
  "drafts": [
    { "variation": 1, "angle": "observation", "tone": "<one or two word tone>", "content": "<post text>" },
    { "variation": 2, "angle": "lesson",      "tone": "<one or two word tone>", "content": "<post text>" },
    { "variation": 3, "angle": "contrarian",  "tone": "<one or two word tone>", "content": "<post text>" }
  ]
}

Per-draft hard rules:
- No emojis. Max 2 hashtags total, and only on drafts where they truly fit (it's fine to have zero).
- No "Read more" / external link at the end.
- No closing question prompting comments.
- No invented stats. If you give a number, it must come from the source article.`;
  }

  private parseDrafts(content: string): GeneratedDraft[] {
    try {
      const parsed = JSON.parse(content);
      const drafts = Array.isArray(parsed) ? parsed : parsed.drafts;
      if (!Array.isArray(drafts)) throw new Error('drafts not an array');
      return drafts
        .filter((d: any) => typeof d?.content === 'string' && d.content.trim().length > 0)
        .map((d: any, i: number) => ({
          variation: Number(d.variation) || i + 1,
          angle: String(d.angle || ANGLES[i % ANGLES.length].name),
          tone: String(d.tone || 'neutral'),
          content: this.sanitizeContent(String(d.content)),
        }));
    } catch (error) {
      logger.error('Error parsing drafts JSON:', error);
      return [];
    }
  }

  private sanitizeContent(text: string): string {
    return text
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '') // strip emojis
      .replace(/Read more:\s*https?:\/\/\S+/gi, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private wordCount(text: string): number {
    return text.split(/\s+/).filter(Boolean).length;
  }

  private async saveDrafts(drafts: GeneratedDraft[], articleId: string): Promise<number> {
    let savedCount = 0;
    for (const draft of drafts) {
      try {
        await prisma.draft.create({
          data: {
            content: draft.content,
            articleId,
            angle: draft.angle,
            tone: draft.tone,
            wordCount: this.wordCount(draft.content),
            status: 'PENDING',
          },
        });
        savedCount++;
      } catch (error) {
        logger.error(`Error saving draft variation ${draft.variation}:`, error);
      }
    }

    await prisma.newsArticle.update({
      where: { id: articleId },
      data: { used: true },
    });

    return savedCount;
  }

  async generateDraftsFromTopic(topic: string, context?: string): Promise<number> {
    const cleanTopic = topic.trim();
    if (!cleanTopic) throw new Error('Topic is required');

    const cleanContext = (context || '').trim();
    const summary = cleanContext.length > 0
      ? cleanContext
      : `User-supplied topic for a LinkedIn post: ${cleanTopic}. No source article — generate from general knowledge and the agency's POV.`;

    // Use a unique URL so the @unique constraint on NewsArticle.url doesn't collide
    // across repeat topic submissions.
    const syntheticUrl = `manual://topic/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const article = await prisma.newsArticle.create({
      data: {
        title: cleanTopic.slice(0, 200),
        url: syntheticUrl,
        source: 'Manual Topic',
        summary,
        topics: [],
        publishedAt: new Date(),
        used: false,
      },
    });

    logger.info(`Created synthetic article ${article.id} for manual topic generation`);
    return this.generateDrafts(article.id);
  }

  async generateDraftsForUnusedArticles(limit: number = 1): Promise<number> {
    const unusedArticles = await prisma.newsArticle.findMany({
      where: { used: false },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    logger.info(`Found ${unusedArticles.length} unused articles`);

    let totalDrafts = 0;
    for (const article of unusedArticles) {
      try {
        totalDrafts += await this.generateDrafts(article.id);
      } catch (err) {
        logger.error(`Failed generating drafts for ${article.id}:`, err);
      }
    }
    return totalDrafts;
  }
}

export default new AIGeneratorService();
