import axios from 'axios';
import prisma from '../config/database';
import logger from '../utils/logger';
import { decrypt } from '../utils/encryption';

interface EngagementSnapshot {
  impressions: number;
  reactions: number;
  comments: number;
  shares: number;
  clicks: number;
}

class PostAnalysisService {
  async recordMetric(postId: string, snapshot: EngagementSnapshot) {
    return prisma.postMetric.create({
      data: { postId, ...snapshot },
    });
  }

  async syncMetricsFromLinkedIn(): Promise<number> {
    const settings = await prisma.settings.findUnique({ where: { key: 'singleton' } });
    if (!settings?.linkedinApiToken) {
      logger.info('No LinkedIn API token configured; skipping metrics sync.');
      return 0;
    }

    let accessToken: string;
    try {
      accessToken = decrypt(settings.linkedinApiToken);
    } catch (err) {
      logger.error('Failed to decrypt LinkedIn API token:', err);
      return 0;
    }

    const recentPosts = await prisma.post.findMany({
      where: {
        status: 'SUCCESS',
        linkedinUrn: { not: null },
        postedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    let synced = 0;
    for (const post of recentPosts) {
      try {
        const snapshot = await this.fetchEngagement(accessToken, post.linkedinUrn!);
        if (snapshot) {
          await this.recordMetric(post.id, snapshot);
          synced++;
        }
      } catch (err) {
        logger.warn(`Failed to fetch metrics for post ${post.id}:`, err);
      }
    }
    return synced;
  }

  private async fetchEngagement(accessToken: string, urn: string): Promise<EngagementSnapshot | null> {
    try {
      const encodedUrn = encodeURIComponent(urn);
      const url = `https://api.linkedin.com/v2/socialActions/${encodedUrn}`;
      const resp = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}`, 'X-Restli-Protocol-Version': '2.0.0' },
        timeout: 10_000,
      });
      const data = resp.data || {};
      return {
        impressions: 0,
        reactions: Number(data.likesSummary?.totalLikes ?? 0),
        comments: Number(data.commentsSummary?.aggregatedTotalComments ?? 0),
        shares: 0,
        clicks: 0,
      };
    } catch (err: any) {
      logger.debug(`socialActions fetch failed for ${urn}: ${err?.response?.status || err?.message}`);
      return null;
    }
  }

  async computeInsights(windowDays: number = 30): Promise<{ id: string; summary: string } | null> {
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    const posts = await prisma.post.findMany({
      where: { status: 'SUCCESS', postedAt: { gte: since } },
      include: { draft: true },
    });

    const scored: Array<{ score: number; angle: string; tone: string; wordCount: number }> = [];
    for (const p of posts as any[]) {
      const metric = await prisma.postMetric.findFirst({
        where: { postId: p.id },
        orderBy: { recordedAt: 'desc' },
      });
      if (!metric) continue;
      const score = metric.reactions * 1 + metric.comments * 3 + metric.shares * 5;
      scored.push({
        score,
        angle: p.draft?.angle || 'unknown',
        tone: p.draft?.tone || 'unknown',
        wordCount: p.draft?.wordCount || 0,
      });
    }

    if (scored.length === 0) {
      logger.info('No scored posts available for insight computation.');
      return null;
    }

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, Math.max(3, Math.ceil(scored.length * 0.3)));
    const topAngles = this.topCounts(top.map((x) => x.angle));
    const topTones = this.topCounts(top.map((x) => x.tone));
    const avgWordCount = Math.round(top.reduce((sum, x) => sum + x.wordCount, 0) / top.length);

    const summary =
      `Across the last ${windowDays} days (${scored.length} measured posts), the top performers leaned on ` +
      `${topAngles.join(', ') || 'mixed angles'} with a ${topTones.join('/') || 'neutral'} tone, ` +
      `averaging ~${avgWordCount} words. Lower performers were typically longer and more generic.`;

    const insight = await prisma.promptInsight.create({
      data: {
        sampleSize: scored.length,
        summary,
        topAngles,
        topTones,
        avgWordCount,
        notes: this.draftHumanNotes(top),
      },
    });

    logger.info(`Computed prompt insight ${insight.id} from ${scored.length} posts.`);
    return { id: insight.id, summary };
  }

  private topCounts(items: string[]): string[] {
    const counts = items.reduce<Record<string, number>>((acc, k) => {
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([k]) => k);
  }

  private draftHumanNotes(top: Array<{ angle: string; tone: string; wordCount: number }>): string {
    const shortPct = Math.round((top.filter((x) => x.wordCount <= 130).length / top.length) * 100);
    return `${shortPct}% of top posts were under 130 words. Keep openings concrete and avoid closing questions.`;
  }
}

export default new PostAnalysisService();
