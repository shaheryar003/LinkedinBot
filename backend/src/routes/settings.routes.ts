import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  testLinkedInConnection,
  testOpenAI,
} from '../controllers/settings.controller';

const router = Router();

router.get('/', getSettings);
router.put('/', updateSettings);
router.post('/test-linkedin', testLinkedInConnection);
router.post('/test-openai', testOpenAI);

export default router;
