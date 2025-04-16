import express from 'express';
import { MigrateVectorStore } from '../lib/vectorStore.js';
import { Chat } from '../lib/chat.js';
import { loadDocuments } from '../lib/loadDocument.js';
import { upload } from '../lib/loadDocument.js';
import { deleteDocumentsByTag } from '../lib/queryDelete.js';
import { searchDocumentsByTag } from '../lib/querySearch.js';

const router = express.Router();

router.post('/chat', Chat);
router.post('/migrate-vectorstore', MigrateVectorStore);
router.post(
  '/load-documents',
  upload.single('file'),
  loadDocuments
);
router.post('/delete', deleteDocumentsByTag);
router.get('/search', searchDocumentsByTag);

export default router;
