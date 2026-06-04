import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from './database';
import { decrypt } from '../utils/encryption';
import logger from '../utils/logger';

let cachedClient: GoogleGenerativeAI | null = null;
let cachedKey: string | null = null;

const resolveApiKey = async (): Promise<string> => {
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey) return envKey;

  const settings = await prisma.settings.findUnique({ where: { key: 'singleton' } });
  if (settings?.geminiApiKey) {
    try {
      return decrypt(settings.geminiApiKey);
    } catch (err) {
      logger.error('Failed to decrypt geminiApiKey from settings', err);
    }
  }
  throw new Error('GEMINI_API_KEY not configured (env or settings)');
};

export const getGemini = async (): Promise<GoogleGenerativeAI> => {
  const key = await resolveApiKey();
  if (cachedClient && cachedKey === key) return cachedClient;
  cachedKey = key;
  cachedClient = new GoogleGenerativeAI(key);
  return cachedClient;
};

export default getGemini;
