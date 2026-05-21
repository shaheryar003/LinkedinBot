import { Router } from 'express';
import { recordMetric, runAnalysis, getLatestInsight } from '../controllers/analytics.controller';

const router = Router();

router.post('/posts/:postId/metrics', recordMetric);
router.post('/run', runAnalysis);
router.get('/insight', getLatestInsight);

export default router;
