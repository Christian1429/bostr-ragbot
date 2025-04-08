import { ChromaClient, Collection } from 'chromadb';
// Importera även default embedding function från chromadb-default-embed
import { DefaultEmbeddingFunction } from "chromadb";
const defaultEF = new DefaultEmbeddingFunction();

// Define interfaces for document structure
export interface Document {
  pageContent: string;
  metadata: Record<string, any>;
}

// Define interface for embeddings
interface Embeddings {
  embedDocuments(texts: string[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
  modelName?: string;
}

// Define interface for retriever
export interface Retriever {
  getRelevantDocuments(query: string): Promise<Document[]>;
}

export class OpenAIChromaVectorStore {
  private client: ChromaClient;
  private embeddings: Embeddings;
  private collection!: Collection; // Using definite assignment assertion
  private collectionName: string;
  private defaultEmbeddingFunction: any; // För att uppfylla ChromaDB:s typkrav

  /**
   * Create a new OpenAIChromaVectorStore
   * @param {Embeddings} embeddings The embeddings instance to use for embedding documents
   * @param {string} collectionName The name of the ChromaDB collection (default: 'openai_document_embeddings')
   * @param {string} chromaUrl The URL of the ChromaDB server (default: 'http://localhost:8000')
   */
  constructor(
    embeddings: Embeddings,
    collectionName: string = 'openai_document_embeddings',
    chromaUrl: string = 'http://localhost:8000'
  ) {
    this.client = new ChromaClient({ path: chromaUrl });
    this.embeddings = embeddings;
    this.collectionName = collectionName;
    // Skapa en default embedding function för att uppfylla typkrav
    this.defaultEmbeddingFunction = new DefaultEmbeddingFunction();
  }

  /**
   * Initialize the ChromaDB collection
   * @returns {Promise<void>}
   */
  async initialize(): Promise<void> {
    try {
      console.log(`Initializing ChromaDB collection: ${this.collectionName}`);
      
      // Try to get the existing collection, or create a new one if it doesn't exist
      try {
        this.collection = await this.client.getCollection({
          name: this.collectionName,
          embeddingFunction: this.defaultEmbeddingFunction // Skicka med embedding function för att uppfylla typkraven
        });
        console.log(`Using existing collection: ${this.collectionName}`);
      } catch (error) {
        // Collection doesn't exist, create a new one
        console.log(`Creating new collection: ${this.collectionName}`);
        this.collection = await this.client.createCollection({
          name: this.collectionName,
          metadata: { 
            description: 'OpenAI document embeddings collection',
            model: this.embeddings.modelName || 'openai'
          },
          embeddingFunction: this.defaultEmbeddingFunction // Skicka med embedding function för att uppfylla typkraven
        });
      }
      
      console.log('ChromaDB collection initialized successfully');
    } catch (error) {
      console.error('Error initializing ChromaDB collection:', error);
      throw error;
    }
  }

  /**
   * Add documents to the vector store
   * @param {Document[]} documents Array of documents with pageContent and metadata
   * @returns {Promise<string[]>} Array of document IDs
   */
  async addDocuments(documents: Document[]): Promise<string[]> {
    try {
      // Make sure collection is initialized
      if (!this.collection) {
        await this.initialize();
      }

      console.log(`Adding ${documents.length} documents to vector store...`);
      
      // Generate unique IDs for documents
      const ids = documents.map((_, i) => 
        `doc_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 10)}`
      );

      // Extract text content and metadata from documents
      const texts = documents.map(doc => doc.pageContent);
      const metadatas = documents.map(doc => ({
        ...doc.metadata,
        model: this.embeddings.modelName || 'openai',
        created: new Date().toISOString()
      }));

      // Manually create embeddings using our embeddings provider
      const embeddings = await this.embeddings.embedDocuments(texts);

      // Add documents to ChromaDB
      await this.collection.add({
        ids: ids,
        embeddings: embeddings,
        documents: texts,
        metadatas: metadatas
      });

      console.log(`Successfully added ${documents.length} documents to vector store.`);
      return ids;
    } catch (error) {
      console.error('Error adding documents to vector store:', error);
      throw error;
    }
  }

  /**
   * Search for similar documents
   * @param {string} query The query text
   * @param {number} k Number of results to return
   * @returns {Promise<Document[]>} Array of documents with pageContent and metadata
   */
  async similaritySearch(query: string, k: number = 4): Promise<Document[]> {
    try {
      // Make sure collection is initialized
      if (!this.collection) {
        await this.initialize();
      }

      console.log(`Performing similarity search for query: "${query}"`);
      
      // Generate embedding for the query
      console.log('Generating embedding for query...');
      const queryEmbedding = await this.embeddings.embedQuery(query);
      console.log(`Generated query embedding with ${queryEmbedding.length} dimensions`);
      
      // Query ChromaDB for similar documents
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: k
      });

      console.log(`Found ${results.ids[0]?.length || 0} relevant documents.`);
      
      // Format and return results
      const documents: Document[] = [];
      
      if (results.ids[0] && results.documents && results.documents[0] && results.metadatas && results.metadatas[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          const metadata = { ...results.metadatas[0][i] } as Record<string, any>;
          
          // Remove ChromaDB-specific metadata fields if they exist
          delete metadata.model;
          delete metadata.created;
          
          documents.push({
            pageContent: results.documents[0][i] as string,
            metadata: metadata
          });
        }
      }
      
      return documents;
    } catch (error) {
      console.error('Error in similarity search:', error);
      throw error;
    }
  }

  /**
   * Delete all documents from the vector store
   * @returns {Promise<void>}
   */
  async clearAll(): Promise<void> {
    try {
      // Make sure collection is initialized
      if (!this.collection) {
        await this.initialize();
      }

      console.log(`Clearing all documents from ${this.collectionName}...`);
      
      // Delete the collection
      try {
        await this.client.deleteCollection({
          name: this.collectionName
        });
        
        // Reinitialize the collection
        await this.initialize();
        
        console.log(`Cleared all documents from vector store.`);
      } catch (error) {
        console.error('Error deleting collection:', error);
        
        // Alternative: try to delete all documents if deleting collection fails
        try {
          // Get all document IDs
          const getAllResult = await this.collection.get();
          if (getAllResult.ids.length > 0) {
            // Delete all documents
            await this.collection.delete({
              ids: getAllResult.ids
            });
            console.log(`Deleted ${getAllResult.ids.length} documents from collection.`);
          } else {
            console.log('No documents to delete.');
          }
        } catch (innerError) {
          console.error('Error deleting documents:', innerError);
          throw innerError;
        }
      }
    } catch (error) {
      console.error('Error clearing vector store:', error);
      throw error;
    }
  }

  /**
   * Create a retriever interface for this vector store
   * @param {number} k Number of documents to retrieve
   * @returns {Retriever} Retriever object with getRelevantDocuments method
   */
  asRetriever(k: number = 4): Retriever {
    return {
      getRelevantDocuments: async (query: string): Promise<Document[]> => 
        this.similaritySearch(query, k)
    };
  }
}