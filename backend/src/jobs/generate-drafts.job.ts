import { scheduleJob } from '../config/queue';
import aiGeneratorService from '../services/ai-generator.service';
import prisma from '../config/database';
import logger from '../utils/logger';

const generateDraftsTask = async () => {
  logger.info('Starting drafts generation job');

  try {
    const count = await aiGeneratorService.generateDraftsForUnusedArticles(1);

    await prisma.jobLog.create({
      data: {
        jobType: 'generate_drafts',
        status: 'success',
        message: `Generated ${count} drafts`,
      },
    });

    logger.info(`Drafts generation job completed: ${count} drafts created`);
  } catch (error) {
    logger.error('Drafts generation job failed:', error);

    await prisma.jobLog.create({
      data: {
        jobType: 'generate_drafts',
        status: 'failed',
        message: String(error),
      },
    });

    throw error;
  }
};

// Schedule drafts generation daily at 6:30 AM (after news fetch)
const draftsJob = scheduleJob('generate-drafts', '30 6 * * *', generateDraftsTask);

export default draftsJob;
