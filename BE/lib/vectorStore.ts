import { OpenAIFirebaseVectorStore } from '../OpenAIFirebaseVectorStore.js';
import { firebaseConfig } from '../firebaseConfig.js';
import { embeddings as defaultEmbeddings } from './openai.js';
import { createLLMProvider, createEmbeddings } from './llmProviders.js';
import { SourceType } from './interfaces.js';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { getFirestore, collection, getDocs } from '@firebase/firestore';
import { initializeApp } from 'firebase/app';
import { FirestoreDocument } from './interfaces.js';
import { Request, Response } from 'express';

let vectorStore: OpenAIFirebaseVectorStore | undefined;
let currentProvider: 'openai' | 'ollama' = 'openai';

//* Initialize or get vectorStore with optional provider
export async function getVectorStore(provider: 'openai' | 'ollama' = 'openai'): Promise<OpenAIFirebaseVectorStore> {
  // Om provider har ändrats eller vectorStore inte finns, skapa nytt
  if (!vectorStore || currentProvider !== provider) {
    console.log(`Initierar ny OpenAIFirebaseVectorStore med provider: ${provider}`);
    
    // Skapa embeddings baserat på provider
    let embeddings;
    if (provider === 'openai') {
      embeddings = defaultEmbeddings; // Använd befintliga OpenAI embeddings
    } else {
      const llmProvider = createLLMProvider(provider);
      embeddings = createEmbeddings(llmProvider);
    }
    
    vectorStore = new OpenAIFirebaseVectorStore(firebaseConfig, embeddings);
    currentProvider = provider;
  }
  return vectorStore;
}

//* Add document to vectorStore with optional provider
export async function addToVectorStore(
  content: string,
  sourceType: SourceType,
  sourceUrl: string = '',
  tag: string = '',
  provider: 'openai' | 'ollama' = 'openai'
): Promise<OpenAIFirebaseVectorStore> {
  try {
    // Split content into manageable chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 200,
    });
    
    const metadata = {
      source:
        sourceType === 'url'
          ? sourceUrl
          : sourceType === 'pdf'
          ? 'pdf-upload'
          : 'text-input',
      dateAdded: new Date().toISOString(),
      tags: tag ? [tag] : [],
      provider: provider, // Lägg till provider i metadata för spårbarhet
    };
    
    // Create documents from content
    const docs = await textSplitter.createDocuments([content], [metadata]);
    
    // Add to vectorStore with specified provider
    const store = await getVectorStore(provider);
    await store.addDocuments(docs);
    
    return store;
  } catch (error) {
    console.error('Error adding to vector store:', error);
    throw error;
  }
}

//* Migrate vectorstore route with provider support
export async function MigrateVectorStore(req: Request, res: Response) {
  try {
    console.log("Startar migrering av vectorstore...");
    
    // Get provider from request or use default
    const provider = (req.body.provider as 'openai' | 'ollama') || 'openai';
    console.log(`Använder provider: ${provider} för migrering`);
    
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
          metadata: {
            ...data.metadata,
            migratedFrom: 'document_embeddings',
            migrationDate: new Date().toISOString(),
            provider: provider
          }
        });
      }
    });
    
    console.log(`Hittade ${documents.length} dokument att migrera`);
    
    if (documents.length === 0) {
      res.json({ message: "Inga giltiga dokument att migrera", count: 0 });
      return;
    }
    
    // Create embeddings based on provider
    let embeddings;
    if (provider === 'openai') {
      embeddings = defaultEmbeddings;
    } else {
      const llmProvider = createLLMProvider(provider);
      embeddings = createEmbeddings(llmProvider);
    }
    
    // Create new embeddings and save in new collection
    const newVectorStore = new OpenAIFirebaseVectorStore(firebaseConfig, embeddings);
    await newVectorStore.addDocuments(documents);
    
    // Update the global vectorStore variable
    vectorStore = newVectorStore;
    currentProvider = provider;
    
    res.json({
      message: "Migration slutförd",
      count: documents.length,
      provider: provider
    });
  } catch (error) {
    console.error("Fel vid migrering:", error);
    res.status(500).json({ error: (error as Error).message });
  }
}

//* Function to switch provider for existing vectorStore
export async function switchProvider(provider: 'openai' | 'ollama'): Promise<void> {
  console.log(`Byter provider från ${currentProvider} till ${provider}`);
  vectorStore = undefined; // Force recreation with new provider
  await getVectorStore(provider);
}