import { scheduleJob } from '../config/queue';
import newsFetcherService from '../services/news-fetcher.service';
import prisma from '../config/database';
import logger from '../utils/logger';

const fetchNewsTask = async () => {
  logger.info('Starting news fetch job');

  try {
    const count = await newsFetcherService.fetchAndSave();

    await prisma.jobLog.create({
      data: {
        jobType: 'fetch_news',
        status: 'success',
        message: `Fetched and saved ${count} articles`,
      },
    });

    logger.info(`News fetch job completed: ${count} articles saved`);
  } catch (error) {
    logger.error('News fetch job failed:', error);

    await prisma.jobLog.create({
      data: {
        jobType: 'fetch_news',
        status: 'failed',
        message: String(error),
      },
    });

    throw error;
  }
};

// Schedule news fetch daily at 6:00 AM
const newsJob = scheduleJob('fetch-news', '0 6 * * *', fetchNewsTask);

export default newsJob;
