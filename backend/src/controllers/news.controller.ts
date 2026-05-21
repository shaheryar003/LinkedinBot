import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../utils/logger';

export const getNews = async (req: Request, res: Response) => {
  try {
    const { used, limit = 20, offset = 0 } = req.query;

    const where: any = {};
    if (used !== undefined) {
      where.used = used === 'true';
    }

    const articles = await prisma.newsArticle.findMany({
      where,
      orderBy: {
        fetchedAt: 'desc',
      },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.newsArticle.count({ where });

    res.json({
      articles,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    logger.error('Error getting news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
};

export const fetchNews = async (_req: Request, res: Response) => {
  try {
    const newsFetcherService = (await import('../services/news-fetcher.service')).default;
    const count = await newsFetcherService.fetchAndSave();

    logger.info(`Manually fetched ${count} news articles`);
    res.json({ message: `Fetched ${count} articles`, count });
  } catch (error) {
    logger.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
};
