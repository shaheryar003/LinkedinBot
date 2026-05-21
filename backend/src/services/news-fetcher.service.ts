import Parser from 'rss-parser';
import prisma from '../config/database';
import logger from '../utils/logger';

interface NewsArticle {
  title: string;
  url: string;
  source: string;
  summary: string;
  topics: string[];
  publishedAt: Date;
}

const DEFAULT_RSS_URL = 'https://blog.hubspot.com/marketing/rss.xml';
const DEFAULT_SOURCE_NAME = 'HubSpot Marketing';

const AGENCY_TOPICS: Record<string, string[]> = {
  branding: ['brand', 'identity', 'positioning', 'rebrand', 'logo'],
  content: ['content', 'blog', 'storytelling', 'copy', 'copywriting', 'thought leadership', 'writing'],
  seo: ['seo', 'search engine', 'serp', 'organic', 'keyword', 'generative engine', 'geo', 'aeo'],
  paid: ['ads', 'ad ', 'paid media', 'ppc', 'meta ads', 'google ads', 'roas', 'campaign'],
  social: ['social', 'instagram', 'linkedin', 'tiktok', 'facebook', 'youtube', 'community', 'creator'],
  growth: ['growth', 'acquisition', 'conversion', 'funnel', 'retention', 'lead', 'pipeline', 'revenue'],
  analytics: ['analytics', 'attribution', 'measurement', 'kpi', 'reporting', 'data'],
  email: ['email', 'newsletter', 'crm', 'lifecycle', 'automation'],
  ai: ['ai', 'gpt', 'llm', 'generative', 'chatgpt', 'claude', 'agent'],
  strategy: ['marketing', 'marketer', 'strategy', 'agency', 'b2b', 'b2c', 'customer'],
};

class NewsFetcherService {
  private rssParser: Parser;

  constructor() {
    this.rssParser = new Parser({ timeout: 15_000 });
  }

  private async resolveFeed(): Promise<{ url: string; source: string }> {
    const settings = await prisma.settings.findUnique({ where: { key: 'singleton' } });
    const url = settings?.newsRssUrl || process.env.NEWS_RSS_URL || DEFAULT_RSS_URL;
    let source = DEFAULT_SOURCE_NAME;
    try {
      source = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      /* keep default */
    }
    return { url, source };
  }

  async fetchAllNews(): Promise<NewsArticle[]> {
    const { url, source } = await this.resolveFeed();
    logger.info(`Fetching news from single source: ${source} (${url})`);

    const feed = await this.rssParser.parseURL(url);
    const articles: NewsArticle[] = [];

    for (const item of feed.items.slice(0, 25)) {
      const title = (item.title || '').trim();
      const summary = (item.contentSnippet || item.summary || item.content || '').toString().trim().slice(0, 800);
      const link = (item.link || '').trim();
      if (!title || !link) continue;

      const haystack = `${title} ${summary}`.toLowerCase();
      const topics = this.classifyTopics(haystack);

      if (!this.isRecent(item.isoDate || item.pubDate)) continue;
      // Feed is already curated for marketing; don't gate on topic match,
      // just tag with `general` when no specific topic is detected.
      const finalTopics = topics.length > 0 ? topics : ['general'];

      articles.push({
        title,
        url: link,
        source,
        summary,
        topics: finalTopics,
        publishedAt: new Date(item.isoDate || item.pubDate || Date.now()),
      });
    }

    logger.info(`Filtered ${articles.length} marketing-relevant articles from ${source}`);
    return articles;
  }

  private isRecent(date: string | undefined): boolean {
    if (!date) return false;
    const articleDate = new Date(date);
    if (Number.isNaN(articleDate.getTime())) return false;
    const cutoff = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
    return articleDate > cutoff;
  }

  private classifyTopics(text: string): string[] {
    const matched: string[] = [];
    for (const [topic, keywords] of Object.entries(AGENCY_TOPICS)) {
      if (keywords.some((kw) => text.includes(kw))) matched.push(topic);
    }
    return matched;
  }

  async saveArticles(articles: NewsArticle[]): Promise<number> {
    let savedCount = 0;
    for (const article of articles) {
      try {
        const existing = await prisma.newsArticle.findUnique({ where: { url: article.url } });
        if (existing) {
          await prisma.newsArticle.update({
            where: { url: article.url },
            data: { summary: article.summary, topics: article.topics },
          });
        } else {
          await prisma.newsArticle.create({
            data: {
              title: article.title,
              url: article.url,
              source: article.source,
              summary: article.summary,
              topics: article.topics,
              publishedAt: article.publishedAt,
              used: false,
              fetchedAt: new Date(),
            },
          });
        }
        savedCount++;
      } catch (error) {
        logger.error(`Error saving article ${article.url}:`, error);
      }
    }
    logger.info(`Saved ${savedCount} articles to database`);
    return savedCount;
  }

  async fetchAndSave(): Promise<number> {
    const articles = await this.fetchAllNews();
    return this.saveArticles(articles);
  }
}

export default new NewsFetcherService();
