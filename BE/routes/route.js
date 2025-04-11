import express from 'express';
import { MigrateVectorStore } from '../lib/vectorStore.js';
import { Chat } from '../lib/chat.js';
import { loadDocuments } from '../lib/loadDocument.js';
import { upload } from '../lib/loadDocument.js';

const router = express.Router();

router.post('/chat', Chat);
router.post('/migrate-vectorstore', MigrateVectorStore);
router.post(
  '/load-documents',
  upload.single('file'),
  loadDocuments
);

export default router;
