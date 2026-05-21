import { ILinkedInPoster } from './linkedin-poster.interface';
import PuppeteerPoster from './linkedin-poster-puppeteer';
import LinkedInAPIPoster from './linkedin-poster-api';
import prisma from '../config/database';
import logger from '../utils/logger';
import { decrypt } from '../utils/encryption';

class LinkedInPosterFactory {
  private puppeteerPoster: PuppeteerPoster;
  private apiPoster: LinkedInAPIPoster;

  constructor() {
    this.puppeteerPoster = new PuppeteerPoster();
    this.apiPoster = new LinkedInAPIPoster();
  }

  async getPoster(): Promise<ILinkedInPoster> {
    try {
      const settings = await prisma.settings.findUnique({
        where: { key: 'singleton' },
      });

      if (!settings) {
        logger.warn('No settings found, defaulting to Puppeteer');
        return this.puppeteerPoster;
      }

      const method = settings.postingMethod || 'puppeteer';

      if (method === 'api' && settings.linkedinApiToken && settings.organizationId) {
        logger.info('Using LinkedIn API poster');
        const accessToken = decrypt(settings.linkedinApiToken);
        this.apiPoster.setCredentials(accessToken, settings.organizationId);
        return this.apiPoster;
      }

      logger.info('Using Puppeteer poster');
      return this.puppeteerPoster;
    } catch (error) {
      logger.error('Error getting poster, defaulting to Puppeteer:', error);
      return this.puppeteerPoster;
    }
  }

  async postWithFallback(content: string): Promise<{ success: boolean; url?: string; urn?: string; error?: string; method: string }> {
    try {
      const settings = await prisma.settings.findUnique({
        where: { key: 'singleton' },
      });

      const method = settings?.postingMethod || 'puppeteer';

      // Try primary method
      const primaryPoster = await this.getPoster();
      const primaryResult = await primaryPoster.post(content);

      if (primaryResult.success) {
        return { ...primaryResult, method };
      }

      logger.warn(`Primary method (${method}) failed, attempting fallback`);

      // Try fallback method
      const fallbackPoster = method === 'api' ? this.puppeteerPoster : this.apiPoster;
      const fallbackMethod = method === 'api' ? 'puppeteer' : 'api';

      // Check if fallback is configured
      if (fallbackMethod === 'api' && (!settings?.linkedinApiToken || !settings?.organizationId)) {
        logger.error('Fallback to API not possible - credentials not configured');
        return { ...primaryResult, method };
      }

      if (fallbackMethod === 'api') {
        const accessToken = decrypt(settings!.linkedinApiToken!);
        this.apiPoster.setCredentials(accessToken, settings!.organizationId!);
      }

      const fallbackResult = await fallbackPoster.post(content);

      if (fallbackResult.success) {
        logger.info(`Fallback method (${fallbackMethod}) succeeded`);
        return { ...fallbackResult, method: fallbackMethod };
      }

      logger.error('Both posting methods failed');
      return { ...fallbackResult, method: fallbackMethod };
    } catch (error) {
      logger.error('Error in postWithFallback:', error);
      return { success: false, error: String(error), method: 'unknown' };
    }
  }
}

export default new LinkedInPosterFactory();
