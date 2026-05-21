import { Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../utils/logger';
import { encrypt } from '../utils/encryption';

export const getSettings = async (_req: Request, res: Response) => {
  try {
    let settings = await prisma.settings.findUnique({
      where: { key: 'singleton' },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          key: 'singleton',
          postingTimes: ['09:00', '15:00'],
          isActive: true,
          pageUrl: 'DigitalKarvan',
          postingMethod: 'puppeteer',
        },
      });
    }

    // Don't send encrypted credentials to frontend
    const safeSettings = {
      ...settings,
      linkedinEmail: settings.linkedinEmail ? '***' : null,
      linkedinPassword: settings.linkedinPassword ? '***' : null,
      linkedinApiToken: settings.linkedinApiToken ? '***' : null,
      linkedinApiSecret: settings.linkedinApiSecret ? '***' : null,
      openaiApiKey: settings.openaiApiKey ? '***' : null,
    };

    res.json(safeSettings);
  } catch (error) {
    logger.error('Error getting settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const {
      linkedinEmail,
      linkedinPassword,
      linkedinApiToken,
      linkedinApiSecret,
      postingMethod,
      postingTimes,
      openaiApiKey,
      isActive,
      pageUrl,
      organizationId,
    } = req.body;

    const updateData: any = {};

    if (linkedinEmail !== undefined) updateData.linkedinEmail = linkedinEmail;
    if (linkedinPassword !== undefined && linkedinPassword !== '***') {
      updateData.linkedinPassword = encrypt(linkedinPassword);
    }
    if (linkedinApiToken !== undefined && linkedinApiToken !== '***') {
      updateData.linkedinApiToken = encrypt(linkedinApiToken);
    }
    if (linkedinApiSecret !== undefined && linkedinApiSecret !== '***') {
      updateData.linkedinApiSecret = encrypt(linkedinApiSecret);
    }
    if (postingMethod !== undefined) updateData.postingMethod = postingMethod;
    if (postingTimes !== undefined) updateData.postingTimes = postingTimes;
    if (openaiApiKey !== undefined && openaiApiKey !== '***') {
      updateData.openaiApiKey = encrypt(openaiApiKey);
    }
    if (isActive !== undefined) updateData.isActive = isActive;
    if (pageUrl !== undefined) updateData.pageUrl = pageUrl;
    if (organizationId !== undefined) updateData.organizationId = organizationId;

    const existing = await prisma.settings.findUnique({ where: { key: 'singleton' } });
    const settings = existing
      ? await prisma.settings.update({ where: { key: 'singleton' }, data: updateData })
      : await prisma.settings.create({
          data: {
            key: 'singleton',
            ...updateData,
            postingTimes: postingTimes || ['09:00', '15:00'],
          },
        });

    logger.info('Settings updated');

    // Return safe settings
    const safeSettings = {
      ...settings,
      linkedinEmail: settings.linkedinEmail ? '***' : null,
      linkedinPassword: settings.linkedinPassword ? '***' : null,
      linkedinApiToken: settings.linkedinApiToken ? '***' : null,
      linkedinApiSecret: settings.linkedinApiSecret ? '***' : null,
      openaiApiKey: settings.openaiApiKey ? '***' : null,
    };

    res.json(safeSettings);
  } catch (error) {
    logger.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

export const testLinkedInConnection = async (req: Request, res: Response) => {
  try {
    const { method } = req.query;

    if (method === 'api') {
      const LinkedInAPIPoster = (await import('../services/linkedin-poster-api')).default;
      const poster = new LinkedInAPIPoster();
      const result = await poster.testConnection();
      res.json({ success: result, method: 'api' });
    } else {
      const PuppeteerPoster = (await import('../services/linkedin-poster-puppeteer')).default;
      const poster = new PuppeteerPoster();
      const result = await poster.testConnection();
      res.json({ success: result, method: 'puppeteer' });
    }
  } catch (error) {
    logger.error('Error testing LinkedIn connection:', error);
    res.status(500).json({ error: 'Failed to test connection' });
  }
};

export const testOpenAI = async (_req: Request, res: Response) => {
  try {
    const getOpenAI = (await import('../config/openai')).default;
    const openai = await getOpenAI();

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'user', content: 'Say "OpenAI connection successful"' },
      ],
      max_tokens: 20,
    });

    const content = response.choices[0]?.message?.content;
    res.json({ success: true, message: content });
  } catch (error) {
    logger.error('Error testing OpenAI:', error);
    res.status(500).json({ error: 'Failed to test OpenAI connection' });
  }
};
