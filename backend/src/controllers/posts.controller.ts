import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../utils/logger';

export const getPosts = async (req: Request, res: Response) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        draft: {
          include: {
            article: true,
          },
        },
      },
      orderBy: {
        postedAt: 'desc',
      },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.post.count({ where });

    res.json({
      posts,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    logger.error('Error getting posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

export const getPostById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        draft: {
          include: {
            article: true,
          },
        },
      },
    });

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    res.json(post);
  } catch (error) {
    logger.error('Error getting post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
};

export const postNow = async (req: Request, res: Response): Promise<void> => {
  try {
    const { draftId } = req.params;

    const draft = await prisma.draft.findUnique({
      where: { id: draftId },
    });

    if (!draft) {
      res.status(404).json({ error: 'Draft not found' });
      return;
    }

    if (draft.status !== 'APPROVED') {
      res.status(400).json({ error: 'Draft must be approved before posting' });
      return;
    }

    const linkedInPosterFactory = (await import('../services/linkedin-poster-factory')).default;
    const result = await linkedInPosterFactory.postWithFallback(draft.content);

    if (result.success) {
      await prisma.draft.update({
        where: { id: draftId },
        data: { status: 'POSTED' },
      });

      const post = await prisma.post.create({
        data: {
          draftId: draftId,
          linkedinUrl: result.url,
          linkedinUrn: result.urn,
          status: 'SUCCESS',
        },
      });

      logger.info(`Draft ${draftId} posted immediately`);
      res.json({ message: 'Posted successfully', post });
    } else {
      const post = await prisma.post.create({
        data: {
          draftId: draftId,
          status: 'FAILED',
          error: result.error,
        },
      });

      logger.error(`Failed to post draft ${draftId}: ${result.error}`);
      res.status(500).json({ error: 'Failed to post', details: result.error, post });
    }
  } catch (error) {
    logger.error('Error posting now:', error);
    res.status(500).json({ error: 'Failed to post' });
  }
};
