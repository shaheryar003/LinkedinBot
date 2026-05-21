import OpenAI from 'openai';
import prisma from './database';
import { decrypt } from '../utils/encryption';
import logger from '../utils/logger';

let cachedClient: OpenAI | null = null;
let cachedKey: string | null = null;

const resolveApiKey = async (): Promise<string> => {
  const envKey = process.env.OPENAI_API_KEY;
  if (envKey) return envKey;

  const settings = await prisma.settings.findUnique({ where: { key: 'singleton' } });
  if (settings?.openaiApiKey) {
    try {
      return decrypt(settings.openaiApiKey);
    } catch (err) {
      logger.error('Failed to decrypt openaiApiKey from settings', err);
    }
  }
  throw new Error('OPENAI_API_KEY not configured (env or settings)');
};

export const getOpenAI = async (): Promise<OpenAI> => {
  const key = await resolveApiKey();
  if (cachedClient && cachedKey === key) return cachedClient;
  cachedKey = key;
  cachedClient = new OpenAI({ apiKey: key });
  return cachedClient;
};

export default getOpenAI;
