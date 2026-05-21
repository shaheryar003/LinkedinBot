import { scheduleJob } from '../config/queue';
import linkedInPosterFactory from '../services/linkedin-poster-factory';
import schedulerService from '../services/scheduler.service';
import prisma from '../config/database';
import logger from '../utils/logger';

const postToLinkedInTask = async () => {
  logger.info('Starting LinkedIn posting job');

  try {
    // Check if system is active
    const isActive = await schedulerService.isSystemActive();
    if (!isActive) {
      logger.info('System is not active, skipping posting');
      return;
    }

    // Get approved drafts
    const drafts = await schedulerService.getApprovedDraftsForPosting(1);

    if (drafts.length === 0) {
      logger.info('No approved drafts available for posting');
      await prisma.jobLog.create({
        data: {
          jobType: 'post_linkedin',
          status: 'success',
          message: 'No approved drafts available',
        },
      });
      return;
    }

    const draft = drafts[0];
    logger.info(`Posting draft ${draft.id}`);

    // Post to LinkedIn with fallback
    const result = await linkedInPosterFactory.postWithFallback(draft.content);

    if (result.success) {
      // Update draft status
      await prisma.draft.update({
        where: { id: draft.id },
        data: { status: 'POSTED' },
      });

      // Create post record
      await prisma.post.create({
        data: {
          draftId: draft.id,
          linkedinUrl: result.url,
          linkedinUrn: result.urn,
          status: 'SUCCESS',
        },
      });

      await prisma.jobLog.create({
        data: {
          jobType: 'post_linkedin',
          status: 'success',
          message: `Posted draft ${draft.id} using ${result.method}`,
        },
      });

      logger.info(`Successfully posted draft ${draft.id}`);
    } else {
      // Post failed
      await prisma.post.create({
        data: {
          draftId: draft.id,
          status: 'FAILED',
          error: result.error,
        },
      });

      await prisma.jobLog.create({
        data: {
          jobType: 'post_linkedin',
          status: 'failed',
          message: `Failed to post draft ${draft.id}: ${result.error}`,
        },
      });

      logger.error(`Failed to post draft ${draft.id}: ${result.error}`);
      throw new Error(result.error);
    }
  } catch (error) {
    logger.error('LinkedIn posting job failed:', error);

    await prisma.jobLog.create({
      data: {
        jobType: 'post_linkedin',
        status: 'failed',
        message: String(error),
      },
    });

    throw error;
  }
};

// Schedule posting at 9:00 AM and 3:00 PM daily
const postingJob = scheduleJob('post-to-linkedin', '0 9,15 * * *', postToLinkedInTask);

export default postingJob;
