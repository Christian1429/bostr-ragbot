import express from 'express';
import { addToVectorStore, MigrateVectorStore } from '../lib/vectorStore.js';
import { Chat } from '../lib/chat.js';
import { loadDocuments } from '../routes/loadDocument.js';
import { upload } from '../routes/loadDocument.js';
const router = express.Router();

router.post('/chat', Chat)
router.post('/migrate-vectorstore', MigrateVectorStore)
router.post(
  '/load-documents',
  upload.single('file'),
  loadDocuments,
  addToVectorStore
);

export default router;