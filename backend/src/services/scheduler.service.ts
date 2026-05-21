import prisma from '../config/database';
import logger from '../utils/logger';

class SchedulerService {
  async getNextPostingTime(): Promise<Date | null> {
    try {
      const settings = await prisma.settings.findUnique({
        where: { key: 'singleton' },
      });

      if (!settings || !settings.postingTimes) {
        logger.warn('No posting times configured');
        return null;
      }

      const postingTimes: string[] = settings.postingTimes || [];
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Parse posting times and find the next one
      const times = postingTimes.map((time: string) => {
        const [hour, minute] = time.split(':').map(Number);
        return { hour, minute };
      });

      // Sort times
      times.sort((a: { hour: number; minute: number }, b: { hour: number; minute: number }) => {
        if (a.hour !== b.hour) return a.hour - b.hour;
        return a.minute - b.minute;
      });

      // Find next posting time today
      for (const time of times) {
        if (time.hour > currentHour || (time.hour === currentHour && time.minute > currentMinute)) {
          const nextTime = new Date(now);
          nextTime.setHours(time.hour, time.minute, 0, 0);
          return nextTime;
        }
      }

      // If no time today, use first time tomorrow
      const nextTime = new Date(now);
      nextTime.setDate(nextTime.getDate() + 1);
      nextTime.setHours(times[0].hour, times[0].minute, 0, 0);
      return nextTime;
    } catch (error) {
      logger.error('Error getting next posting time:', error);
      return null;
    }
  }

  async getApprovedDraftsForPosting(limit: number = 1): Promise<any[]> {
    try {
      const drafts = await prisma.draft.findMany({
        where: {
          status: 'APPROVED',
        },
        include: {
          article: true,
        },
        orderBy: {
          approvedAt: 'asc',
        },
        take: limit,
      });

      return drafts;
    } catch (error) {
      logger.error('Error getting approved drafts:', error);
      return [];
    }
  }

  async isSystemActive(): Promise<boolean> {
    try {
      const settings = await prisma.settings.findUnique({
        where: { key: 'singleton' },
      });

      return settings?.isActive ?? false;
    } catch (error) {
      logger.error('Error checking system status:', error);
      return false;
    }
  }

  parseCronExpression(times: string[]): string {
    // Convert times like ["09:00", "15:00"] to cron expression "0 9,15 * * *"
    const hours = times.map(time => time.split(':')[0]).join(',');
    return `0 ${hours} * * *`;
  }
}

export default new SchedulerService();
