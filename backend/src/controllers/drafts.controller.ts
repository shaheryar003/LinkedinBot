import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../utils/logger';

export const getDrafts = async (req: Request, res: Response) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const drafts = await prisma.draft.findMany({
      where,
      include: {
        article: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.draft.count({ where });

    res.json({
      drafts,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    logger.error('Error getting drafts:', error);
    res.status(500).json({ error: 'Failed to fetch drafts' });
  }
};

export const getDraftById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const draft = await prisma.draft.findUnique({
      where: { id },
      include: {
        article: true,
        post: true,
      },
    });

    if (!draft) {
      res.status(404).json({ error: 'Draft not found' });
      return;
    }

    res.json(draft);
  } catch (error) {
    logger.error('Error getting draft:', error);
    res.status(500).json({ error: 'Failed to fetch draft' });
  }
};

export const approveDraft = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const draft = await prisma.draft.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });

    logger.info(`Draft ${id} approved`);
    res.json(draft);
  } catch (error) {
    logger.error('Error approving draft:', error);
    res.status(500).json({ error: 'Failed to approve draft' });
  }
};

export const rejectDraft = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const draft = await prisma.draft.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
      },
    });

    logger.info(`Draft ${id} rejected`);
    res.json(draft);
  } catch (error) {
    logger.error('Error rejecting draft:', error);
    res.status(500).json({ error: 'Failed to reject draft' });
  }
};

export const editDraft = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    const draft = await prisma.draft.update({
      where: { id },
      data: { content },
    });

    logger.info(`Draft ${id} edited`);
    res.json(draft);
  } catch (error) {
    logger.error('Error editing draft:', error);
    res.status(500).json({ error: 'Failed to edit draft' });
  }
};

export const deleteDraft = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.draft.delete({
      where: { id },
    });

    logger.info(`Draft ${id} deleted`);
    res.json({ message: 'Draft deleted successfully' });
  } catch (error) {
    logger.error('Error deleting draft:', error);
    res.status(500).json({ error: 'Failed to delete draft' });
  }
};

export const generateDrafts = async (_req: Request, res: Response) => {
  try {
    const aiGeneratorService = (await import('../services/ai-generator.service')).default;
    const count = await aiGeneratorService.generateDraftsForUnusedArticles(1);

    logger.info(`Manually generated ${count} drafts`);
    res.json({ message: `Generated ${count} drafts`, count });
  } catch (error) {
    logger.error('Error generating drafts:', error);
    res.status(500).json({ error: 'Failed to generate drafts' });
  }
};

export const generateDraftsFromTopic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic, context } = req.body ?? {};

    if (typeof topic !== 'string' || topic.trim().length === 0) {
      res.status(400).json({ error: 'Topic is required' });
      return;
    }

    const aiGeneratorService = (await import('../services/ai-generator.service')).default;
    const count = await aiGeneratorService.generateDraftsFromTopic(topic, context);

    logger.info(`Generated ${count} drafts from manual topic`);
    res.json({ message: `Generated ${count} drafts`, count });
  } catch (error) {
    logger.error('Error generating drafts from topic:', error);
    res.status(500).json({ error: 'Failed to generate drafts from topic' });
  }
};
