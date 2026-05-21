import { Request, Response } from 'express';
import prisma from '../config/database';
import postAnalysisService from '../services/post-analysis.service';
import logger from '../utils/logger';

export const recordMetric = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const { impressions, reactions, comments, shares, clicks } = req.body || {};

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const metric = await postAnalysisService.recordMetric(postId, {
      impressions: Number(impressions) || 0,
      reactions: Number(reactions) || 0,
      comments: Number(comments) || 0,
      shares: Number(shares) || 0,
      clicks: Number(clicks) || 0,
    });
    res.status(201).json(metric);
  } catch (error) {
    logger.error('Error recording metric:', error);
    res.status(500).json({ error: 'Failed to record metric' });
  }
};

export const runAnalysis = async (_req: Request, res: Response) => {
  try {
    const synced = await postAnalysisService.syncMetricsFromLinkedIn();
    const insight = await postAnalysisService.computeInsights(30);
    res.json({ synced, insight });
  } catch (error) {
    logger.error('Error running analysis:', error);
    res.status(500).json({ error: 'Failed to run analysis' });
  }
};

export const getLatestInsight = async (_req: Request, res: Response) => {
  try {
    const insight = await prisma.promptInsight.findFirst({ orderBy: { generatedAt: 'desc' } });
    res.json(insight);
  } catch (error) {
    logger.error('Error fetching insight:', error);
    res.status(500).json({ error: 'Failed to fetch insight' });
  }
};
