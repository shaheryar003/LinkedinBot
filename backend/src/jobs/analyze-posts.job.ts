import { scheduleJob } from '../config/queue';
import postAnalysisService from '../services/post-analysis.service';
import prisma from '../config/database';
import logger from '../utils/logger';

const analyzePostsTask = async () => {
  logger.info('Starting post-analysis job');
  try {
    const synced = await postAnalysisService.syncMetricsFromLinkedIn();
    const insight = await postAnalysisService.computeInsights(30);

    await prisma.jobLog.create({
      data: {
        jobType: 'analyze_posts',
        status: 'success',
        message: insight
          ? `Synced ${synced} posts, generated insight ${insight.id}`
          : `Synced ${synced} posts, no insight generated (no metrics yet)`,
      },
    });
  } catch (error) {
    logger.error('Post-analysis job failed:', error);
    await prisma.jobLog.create({
      data: { jobType: 'analyze_posts', status: 'failed', message: String(error) },
    });
    throw error;
  }
};

// Run weekly: Monday 7:00 AM
const analyzeJob = scheduleJob('analyze-posts', '0 7 * * 1', analyzePostsTask);

export default analyzeJob;
