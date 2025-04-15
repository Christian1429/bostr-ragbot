import express from 'express';
import { MigrateVectorStore } from '../lib/vectorStore.js';
import { Chat } from '../lib/chat.js';
import { loadDocuments } from '../lib/loadDocument.js';
import { upload } from '../lib/loadDocument.js';
// import { upsertVector } from '../lib/UpsertVector.js';

const router = express.Router();

router.post('/chat', Chat);
router.post('/migrate-vectorstore', MigrateVectorStore);
router.post(
  '/load-documents',
  upload.single('file'),
  loadDocuments
);
// router.post('/upsert-vector', upsertVector);

export default router;
