import { Router } from 'express';
import { getPosts, getPostById, postNow } from '../controllers/posts.controller';

const router = Router();

router.get('/', getPosts);
router.get('/:id', getPostById);
router.post('/:draftId/post-now', postNow);

export default router;
