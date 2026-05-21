import { Router } from 'express';
import {
  getDrafts,
  getDraftById,
  approveDraft,
  rejectDraft,
  editDraft,
  deleteDraft,
  generateDrafts,
  generateDraftsFromTopic,
} from '../controllers/drafts.controller';

const router = Router();

router.get('/', getDrafts);
router.get('/:id', getDraftById);
router.post('/generate', generateDrafts);
router.post('/generate-from-topic', generateDraftsFromTopic);
router.put('/:id/approve', approveDraft);
router.put('/:id/reject', rejectDraft);
router.put('/:id/edit', editDraft);
router.delete('/:id', deleteDraft);

export default router;
