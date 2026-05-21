import { Router } from 'express';
import { getNews, fetchNews } from '../controllers/news.controller';

const router = Router();

router.get('/', getNews);
router.post('/fetch', fetchNews);

export default router;
