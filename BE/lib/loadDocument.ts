import { Request, Response } from 'express';
import multer from 'multer';
import { extractTextFromPDF, fetchUrlContent } from '../utils/utils.js';
import { addToVectorStore } from './ChromaDBVectorStore.js';
import { LoadDocumentsRequestBody } from './interfaces.js';
import { ExtractTextFromJson } from '../utils/utils.js';

const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    // Correct PDF check
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    }
    // Correct JSON check (including alternative JSON mime types)
    if (
      file.mimetype === 'application/json' ||
      file.mimetype === 'text/json' ||
      file.originalname.endsWith('.json')
    ) {
      cb(null, true);
    } else {
      cb as any, (new Error('Endast PDF- och JSON-filer är tillåtna!'), false);
    }
  },
});

export const loadDocuments = (req: Request, res: Response): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      let documentContent: string;
      const body = req.body as LoadDocumentsRequestBody;
      const sourceType = body.type;

      if (sourceType === 'pdf' && req.file) {
        documentContent = await extractTextFromPDF(req.file.buffer);
      } else if (sourceType === 'json' && req.file) {
        // First parse the JSON file
        const jsonData = JSON.parse(req.file.buffer.toString());
        // Then extract text (handles both single object and array)
        documentContent = await ExtractTextFromJson(
          Array.isArray(jsonData) ? jsonData : [jsonData],
        );
      }
      else if (sourceType === 'url') {
        if (!body.url) {
          res.status(400).json({ error: 'URL is required for type "url"' });
          resolve();
          return;
        }
        documentContent = await fetchUrlContent(body.url);
      } else {
        if (!body.content) {
          res
            .status(400)
            .json({ error: 'Content is required for type "text"' });
          resolve();
          return;
        }
        documentContent = body.content;
      }

      await addToVectorStore(
        documentContent,
        sourceType,
        sourceType === 'url' ? body.url || '' : ''
      );

      res.json({
        message: 'Documents loaded successfully',
        source:
          sourceType === 'url'
            ? body.url
            : sourceType === 'pdf'
            ? 'PDF upload'
            : sourceType === 'json'
            ? 'JSON upload'
            : 'text input',
      });
      resolve();
    } catch (error) {
      console.error('Error in /api/load-documents:', error);
      res.status(500).json({ error: (error as Error).message });
      reject(error);
    }
  });
};
