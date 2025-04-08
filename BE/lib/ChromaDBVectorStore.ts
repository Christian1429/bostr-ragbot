// Skapa en egen embedding function-klass som wrapper för OpenAI embeddings
class OpenAIEmbeddingWrapper implements IEmbeddingFunction {
    private openAIEmbeddings: any;
  
    constructor(openAIEmbeddings: any) {
      this.openAIEmbeddings = openAIEmbeddings;
    }
  
    async generate(texts: string[]): Promise<number[][]> {
      try {
        return await this.openAIEmbeddings.embedDocuments(texts);
      } catch (error) {
        console.error('Error generating embeddings:', error);
        // Fallback till tom embedding om något går fel
        return texts.map(() => []);
      }
    }
  }

  interface ChromaCollection {
    name: string;
    [key: string]: any; // For any other properties
  }
  
  import { OpenAIChromaVectorStore } from '../OpenAIChromaVectorStore.js';
  import { embeddings } from './openai.js';
  import { SourceType } from './interfaces.js';
  import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
  import { Request, Response } from 'express';
  import { ChromaClient, IEmbeddingFunction } from 'chromadb';
  
  // Adapter class to make OpenAI embeddings work with ChromaDB
  class OpenAIEmbeddingFunctionAdapter implements IEmbeddingFunction {
    private embeddings: any;
  
    constructor(embeddings: any) {
      this.embeddings = embeddings;
    }
  
    async generate(texts: string[]): Promise<number[][]> {
      return await this.embeddings.embedDocuments(texts);
    }
  }
  
  // Configuration for ChromaDB
  const chromaConfig = {
    path: process.env.CHROMA_URL || 'http://localhost:8000',
    collectionName: 'openai_document_embeddings'
  };
  
  let vectorStore: OpenAIChromaVectorStore | undefined;
  
  /**
   * Initialize or get vectorStore
   */
  export async function getVectorStore(): Promise<OpenAIChromaVectorStore> {
    if (!vectorStore) {
      console.log('Initierar ny OpenAIChromaVectorStore');
      vectorStore = new OpenAIChromaVectorStore(
        embeddings,
        chromaConfig.collectionName,
        chromaConfig.path
      );
      await vectorStore.initialize();
    }
    return vectorStore;
  }
  
  /**
   * Add document to vectorStore
   */
  export async function addToVectorStore(
    content: string,
    sourceType: SourceType,
    sourceUrl: string = ''
  ): Promise<OpenAIChromaVectorStore> {
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
   * Migrate from Firebase to ChromaDB
   */
  export async function MigrateVectorStore(req: Request, res: Response) {
    try {
      console.log("Startar migrering från Firebase till ChromaDB...");
      
      // Get Firebase data (using import if needed)
      let firebaseData: Array<{ pageContent: string; metadata: Record<string, any> }> = [];
      
      try {
        // This section imports data from Firebase
        // If you need to use Firebase temporarily to get the data:
        const { initializeApp } = await import('firebase/app');
        const { getFirestore, collection, getDocs } = await import('firebase/firestore');
        const { firebaseConfig } = await import('../firebaseConfig.js');
        
        const db = getFirestore(initializeApp(firebaseConfig, 'migration-app'));
        const oldDocs = await getDocs(collection(db, 'document_embeddings'));
        
        if (oldDocs.empty) {
          res.json({ message: "Inga dokument att migrera", count: 0 });
          return;
        }
        
        oldDocs.forEach(doc => {
          const data = doc.data() as { content: string; metadata?: Record<string, any> };
          if (data.content) {
            firebaseData.push({
              pageContent: data.content,
              metadata: data.metadata || {}
            });
          }
        });
        
      } catch (error) {
        console.error("Fel vid hämtning av data från Firebase:", error);
        res.status(500).json({ 
          error: "Kunde inte hämta data från Firebase. Kontrollera om Firebase-modulerna är tillgängliga.",
          details: (error as Error).message 
        });
        return;
      }
      
      console.log(`Hittade ${firebaseData.length} dokument att migrera`);
      
      if (firebaseData.length === 0) {
        res.json({ message: "Inga giltiga dokument att migrera", count: 0 });
        return;
      }
      
      // Create new ChromaDB store and add documents
      const newVectorStore = new OpenAIChromaVectorStore(
        embeddings,
        chromaConfig.collectionName,
        chromaConfig.path
      );
      
      await newVectorStore.initialize();
      
      // Clear any existing data in the collection (optional)
      await newVectorStore.clearAll();
      
      // Add the documents to ChromaDB
      await newVectorStore.addDocuments(firebaseData);
      
      // Update the global vectorStore variable
      vectorStore = newVectorStore;
      
      res.json({
        message: "Migration till ChromaDB slutförd",
        count: firebaseData.length
      });
      
    } catch (error) {
      console.error("Fel vid migrering:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
  
  /**
   * Check ChromaDB status
   */
  export async function checkChromaStatus(req: Request, res: Response) {
    try {
      const client = new ChromaClient({ path: chromaConfig.path });
      const heartbeat = await client.heartbeat();
      
      // Get collection stats if exists
      let collectionStats = null;
      try {
        const collectionNames = await client.listCollections();
        console.log("Alla samlingar:", JSON.stringify(collectionNames, null, 2));
        
        // Kontrollera om collections är en array och har element
        if (!Array.isArray(collectionNames) || collectionNames.length === 0) {
          console.log("Inga samlingar hittades");
          res.json({
            status: "online",
            heartbeat,
            collection: "no collections found"
          });
          return;
        }
        
        // Debugga strukturen på den första samlingen
        if (collectionNames.length > 0) {
          console.log("Första samlingens struktur:", typeof collectionNames[0]);
          console.log("Första samlingens värde:", collectionNames[0]);
        }
        
        // Check if our target collection exists in the list of names
        const targetCollectionExists = collectionNames.includes(chromaConfig.collectionName);
        console.log("Hittad målsamling:", targetCollectionExists ? chromaConfig.collectionName : "not found");
        
        if (targetCollectionExists) {
          // Skapa en embedding function som använder dina OpenAI embeddings
          const embeddingFunction = new OpenAIEmbeddingWrapper(embeddings);
          
          const collection = await client.getCollection({
            name: chromaConfig.collectionName,
            embeddingFunction: embeddingFunction
          });
          
          const count = await collection.count();
          collectionStats = {
            name: chromaConfig.collectionName,
            count
          };
        }
      } catch (e) {
        console.warn("Kunde inte hämta samlingsinformation:", e);
      }
      
      res.json({
        status: "online",
        heartbeat,
        collection: collectionStats || "not found"
      });
    } catch (error) {
      console.error("ChromaDB-anslutningsfel:", error);
      res.status(503).json({
        status: "offline",
        error: (error as Error).message
      });
    }
  }