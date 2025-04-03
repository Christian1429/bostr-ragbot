import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAI } from 'openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import * as cheerio from 'cheerio';
import axios from 'axios';
import dotenv from 'dotenv';
import multer from 'multer';
import { PDFExtract } from 'pdf.js-extract'
import { OpenAIFirebaseVectorStore } from './OpenAIFirebaseVectorStore.js';
import { firebaseConfig } from './firebaseConfig.js';
import { getFirestore, collection, getDocs, DocumentData } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Define interfaces for document structure and requests
interface PDFExtractResult {
  pages: Array<{
    content: Array<{
      str: string;
      [key: string]: any;
    }>;
    [key: string]: any;
  }>;
}

interface LoadDocumentsRequestBody {
  type: SourceType;
  url?: string;
  content?: string;
}

interface ChatRequestBody {
  question: string;
}

interface FirestoreDocument {
  content?: string;
  metadata?: Record<string, any>;
}

// Define source types
type SourceType = 'url' | 'pdf' | 'text';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const pdfExtract = new PDFExtract();

// Configure CORS
app.use(
  cors({
    origin: [
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.options('*', cors());
app.use(express.json());

// Configure file upload with Multer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      (cb as any)(new Error('Endast PDF-filer är tillåtna!'), false);
    }
  }
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize OpenAI Embeddings
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "text-embedding-3-small"
});

// Global variable for vectorStore
let vectorStore: OpenAIFirebaseVectorStore | undefined;

/**
 * Generate response from OpenAI
 */
async function generateResponse(prompt: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Can be adjusted to another model
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    });
    
    return completion.choices[0].message.content || "";
  } catch (error) {
    console.error('Error generating response from OpenAI:', error);
    throw error;
  }
}

/**
 * Create prompt template for question-answering
 */
async function createPromptTemplate(context: string, query: string): Promise<string> {
  return `
Du är en hjälpsam AI-assistent som svarar på svenska. Använd informationen nedan för att svara på frågan.

Här är information som du kan använda:
${context}

Fråga: ${query}

Svara koncist och direkt på svenska. Om informationen för att besvara frågan inte finns i texten ovan, 
säg bara "Jag hittar ingen information om det i de tillgängliga dokumenten."
`;
}

/**
 * Fetch content from URL
 */
async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Remove irrelevant content
    $('script').remove();
    $('style').remove();
    $('nav').remove();
    
    const text = $('body').text()
      .replace(/\s+/g, ' ')
      .trim();
    
    return text;
  } catch (error) {
    console.error('Error fetching URL:', error);
    throw new Error(`Failed to fetch content from URL: ${(error as Error).message}`);
  }
}

/**
 * Extract text from PDF
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const options = {};
    const data = await pdfExtract.extractBuffer(buffer, options) as PDFExtractResult;
    
    const text = data.pages
      .map(page => page.content.map(item => item.str).join(' '))
      .join('\n');
    
    return text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Kunde inte läsa PDF-filen. Kontrollera att filen är giltig.');
  }
}

/**
 * Initialize or get vectorStore
 */
async function getVectorStore(): Promise<OpenAIFirebaseVectorStore> {
  if (!vectorStore) {
    console.log("Initierar ny OpenAIFirebaseVectorStore");
    vectorStore = new OpenAIFirebaseVectorStore(firebaseConfig, embeddings);
  }
  return vectorStore;
}

/**
 * Add document to vectorStore
 */
async function addToVectorStore(content: string, sourceType: SourceType, sourceUrl: string = ''): Promise<OpenAIFirebaseVectorStore> {
  try {
    // Split content into manageable chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 200,
    });

    const metadata = {
      source: sourceType === 'url' ? sourceUrl : 
             sourceType === 'pdf' ? 'pdf-upload' : 
             'text-input',
      dateAdded: new Date().toISOString()
    };

    // Create documents from content
    const docs = await textSplitter.createDocuments([content], [metadata]);
    
    // Add to vectorStore
    const store = await getVectorStore();
    await store.addDocuments(docs);
    return store;
  } catch (error) {
    console.error('Error adding to vector store:', error);
    throw error;
  }
}

/**
 * ROUTES
 */

// 1. Load documents route
app.post('/api/load-documents', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    let documentContent: string;
    const body = req.body as LoadDocumentsRequestBody;
    const sourceType = body.type;

    if (sourceType === 'pdf' && req.file) {
      documentContent = await extractTextFromPDF(req.file.buffer);
    } else if (sourceType === 'url') {
      if (!body.url) {
        res.status(400).json({ error: 'URL is required for type "url"' });
        return;
      }
      documentContent = await fetchUrlContent(body.url);
    } else {
      if (!body.content) {
        res.status(400).json({ error: 'Content is required for type "text"' });
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
      source: sourceType === 'url' ? body.url : 
             sourceType === 'pdf' ? 'PDF upload' : 
             'text input'
    });
  } catch (error) {
    console.error('Error in /api/load-documents:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// 2. Chat route
app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { question } = req.body as ChatRequestBody;
    
    if (!question) {
      res.status(400).json({ error: 'Question is required' });
      return;
    }
    
    console.log(`Processar fråga: "${question}"`);
    
    // Get vectorStore
    const store = await getVectorStore();
    
    // Get relevant documents
    console.log('Söker efter relevanta dokument...');
    const retriever = store.asRetriever(6);
    const relevantDocs = await retriever.getRelevantDocuments(question);
    
    console.log(`Hittade ${relevantDocs.length} relevanta dokument`);
    
    // Create context from relevant documents
    const context = relevantDocs
      .map(doc => doc.pageContent)
      .join('\n\n');

    // If no context was found
    if (!context.trim()) {
      console.log('Ingen relevant kontext hittades');
      res.json({ 
        answer: "Jag hittar ingen information om det i de tillgängliga dokumenten." 
      });
      return;
    }

    // Create prompt and generate response
    console.log('Skapar prompt och genererar svar...');
    const formattedPrompt = await createPromptTemplate(context, question);
    const response = await generateResponse(formattedPrompt);

    console.log('Svar genererat');
    res.json({ answer: response });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// 3. Migrate vectorstore route
app.post('/api/migrate-vectorstore', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Startar migrering av vectorstore...");
    
    // Get old documents
    const db = getFirestore(initializeApp(firebaseConfig, 'migration-app'));
    const oldDocs = await getDocs(collection(db, 'document_embeddings'));
    
    if (oldDocs.empty) {
      res.json({ message: "Inga dokument att migrera", count: 0 });
      return;
    }
    
    // Create array of documents with only text content
    const documents: Array<{ pageContent: string; metadata: Record<string, any> }> = [];
    oldDocs.forEach(doc => {
      const data = doc.data() as FirestoreDocument;
      if (data.content) {
        documents.push({
          pageContent: data.content,
          metadata: data.metadata || {}
        });
      }
    });
    
    console.log(`Hittade ${documents.length} dokument att migrera`);
    
    if (documents.length === 0) {
      res.json({ message: "Inga giltiga dokument att migrera", count: 0 });
      return;
    }
    
    // Create new embeddings and save in new collection
    const newVectorStore = new OpenAIFirebaseVectorStore(firebaseConfig, embeddings);
    await newVectorStore.addDocuments(documents);
    
    // Update the global vectorStore variable
    vectorStore = newVectorStore;
    
    res.json({ 
      message: "Migration slutförd", 
      count: documents.length 
    });
  } catch (error) {
    console.error("Fel vid migrering:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Start the server
const PORT = Number(process.env.PORT) || 3003;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server körs på port ${PORT}`);
  console.log(`OpenAI API key status: ${process.env.OPENAI_API_KEY ? 'Konfigurerad' : 'SAKNAS'}`);
});