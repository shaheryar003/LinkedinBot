import cron from 'node-cron';
import logger from '../utils/logger';

// Simple job scheduler using node-cron
export const scheduleJob = (name: string, cronExpression: string, task: () => Promise<void>) => {
  const job = cron.schedule(cronExpression, async () => {
    try {
      logger.info(`Starting scheduled job: ${name}`);
      await task();
      logger.info(`Completed scheduled job: ${name}`);
    } catch (error) {
      logger.error(`Failed scheduled job: ${name}`, error);
    }
  });

  logger.info(`Scheduled job: ${name} with cron: ${cronExpression}`);
  return job;
};
