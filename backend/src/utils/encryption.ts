import crypto from 'crypto';
import logger from './logger';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

const resolveKey = (): Buffer => {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      'ENCRYPTION_KEY is not set. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))" and put it in .env. Without a persistent key, previously-encrypted credentials cannot be decrypted across restarts.'
    );
  }
  if (raw.length !== 64) {
    logger.warn('ENCRYPTION_KEY is not 32 bytes (64 hex chars). Encrypted secrets may fail to decrypt.');
  }
  return Buffer.from(raw, 'hex');
};

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, resolveKey(), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decrypt = (text: string): string => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, resolveKey(), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};
