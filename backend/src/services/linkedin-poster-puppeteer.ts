import puppeteer, { Browser, Page } from 'puppeteer';
import { addExtra } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { ILinkedInPoster, PostResult } from './linkedin-poster.interface';
import logger from '../utils/logger';
import path from 'path';
import fs from 'fs';

const puppeteerExtra = addExtra(puppeteer as any);
puppeteerExtra.use(StealthPlugin());

class PuppeteerPoster implements ILinkedInPoster {
  private browser: Browser | null = null;
  private cookiesPath = path.join(__dirname, '../../cookies.json');

  private async initBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    logger.info('Initializing Puppeteer browser');
    this.browser = await puppeteerExtra.launch({
      headless: process.env.NODE_ENV === 'production',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

    return this.browser;
  }

  private async loadCookies(page: Page): Promise<boolean> {
    try {
      if (fs.existsSync(this.cookiesPath)) {
        const cookies = JSON.parse(fs.readFileSync(this.cookiesPath, 'utf-8'));
        await page.setCookie(...cookies);
        logger.info('Loaded saved cookies');
        return true;
      }
    } catch (error) {
      logger.error('Error loading cookies:', error);
    }
    return false;
  }

  private async saveCookies(page: Page): Promise<void> {
    try {
      const cookies = await page.cookies();
      fs.writeFileSync(this.cookiesPath, JSON.stringify(cookies, null, 2));
      logger.info('Saved cookies');
    } catch (error) {
      logger.error('Error saving cookies:', error);
    }
  }

  private async login(page: Page, email: string, password: string): Promise<boolean> {
    try {
      logger.info('Attempting LinkedIn login');
      await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });

      await page.type('#username', email, { delay: 100 });
      await this.randomDelay(500, 1000);
      await page.type('#password', password, { delay: 100 });
      await this.randomDelay(500, 1000);

      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      ]);

      // Check if login was successful
      const currentUrl = page.url();
      if (currentUrl.includes('/feed') || currentUrl.includes('/in/')) {
        logger.info('Login successful');
        await this.saveCookies(page);
        return true;
      }

      // Check for CAPTCHA or verification
      if (currentUrl.includes('checkpoint') || currentUrl.includes('challenge')) {
        logger.error('LinkedIn requires verification (CAPTCHA or 2FA)');
        return false;
      }

      logger.error('Login failed - unexpected redirect');
      return false;
    } catch (error) {
      logger.error('Error during login:', error);
      return false;
    }
  }

  private async navigateToCompanyPage(page: Page, pageUrl: string): Promise<boolean> {
    try {
      logger.info(`Navigating to company page: ${pageUrl}`);
      await page.goto(`https://www.linkedin.com/company/${pageUrl}/`, {
        waitUntil: 'networkidle2',
      });

      await this.randomDelay(2000, 3000);
      return true;
    } catch (error) {
      logger.error('Error navigating to company page:', error);
      return false;
    }
  }

  private async createPost(page: Page, content: string): Promise<PostResult> {
    try {
      logger.info('Creating LinkedIn post');

      // Click on "Start a post" button
      const startPostSelector = 'button[aria-label*="Start a post"]';
      await page.waitForSelector(startPostSelector, { timeout: 10000 });
      await page.click(startPostSelector);
      await this.randomDelay(1000, 2000);

      // Wait for the post editor to appear
      const editorSelector = '.ql-editor, [contenteditable="true"]';
      await page.waitForSelector(editorSelector, { timeout: 10000 });
      await this.randomDelay(500, 1000);

      // Type the content
      await page.type(editorSelector, content, { delay: 50 });
      await this.randomDelay(1000, 2000);

      // Take screenshot before posting
      const screenshotPath = path.join(__dirname, '../../screenshots', `post-${Date.now()}.png`);
      fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: true });
      logger.info(`Screenshot saved: ${screenshotPath}`);

      // Click the Post button
      const postButtonSelector = 'button[aria-label*="Post"]';
      await page.waitForSelector(postButtonSelector, { timeout: 10000 });
      await page.click(postButtonSelector);
      await this.randomDelay(3000, 5000);

      logger.info('Post created successfully');
      return { success: true, url: page.url() };
    } catch (error) {
      logger.error('Error creating post:', error);
      return { success: false, error: String(error) };
    }
  }

  private randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  async post(content: string): Promise<PostResult> {
    let page: Page | null = null;

    try {
      const email = process.env.LINKEDIN_EMAIL;
      const password = process.env.LINKEDIN_PASSWORD;
      const pageUrl = process.env.PAGE_URL || 'DigitalKarvan';

      if (!email || !password) {
        throw new Error('LinkedIn credentials not configured');
      }

      const browser = await this.initBrowser();
      page = await browser.newPage();

      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });

      // Try to load saved cookies
      const cookiesLoaded = await this.loadCookies(page);

      if (cookiesLoaded) {
        // Verify if cookies are still valid
        await page.goto('https://www.linkedin.com/feed', { waitUntil: 'networkidle2' });
        const currentUrl = page.url();

        if (!currentUrl.includes('/login')) {
          logger.info('Using saved session');
        } else {
          // Cookies expired, need to login
          const loginSuccess = await this.login(page, email, password);
          if (!loginSuccess) {
            throw new Error('Login failed');
          }
        }
      } else {
        // No saved cookies, login required
        const loginSuccess = await this.login(page, email, password);
        if (!loginSuccess) {
          throw new Error('Login failed');
        }
      }

      // Navigate to company page
      const navSuccess = await this.navigateToCompanyPage(page, pageUrl);
      if (!navSuccess) {
        throw new Error('Failed to navigate to company page');
      }

      // Create the post
      const result = await this.createPost(page, content);

      await page.close();
      return result;
    } catch (error) {
      logger.error('Error in post method:', error);
      if (page) await page.close();
      return { success: false, error: String(error) };
    }
  }

  async testConnection(): Promise<boolean> {
    let page: Page | null = null;

    try {
      const email = process.env.LINKEDIN_EMAIL;
      const password = process.env.LINKEDIN_PASSWORD;

      if (!email || !password) {
        logger.error('LinkedIn credentials not configured');
        return false;
      }

      const browser = await this.initBrowser();
      page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });

      const loginSuccess = await this.login(page, email, password);
      await page.close();

      return loginSuccess;
    } catch (error) {
      logger.error('Error testing connection:', error);
      if (page) await page.close();
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Browser closed');
    }
  }
}

export default PuppeteerPoster;
