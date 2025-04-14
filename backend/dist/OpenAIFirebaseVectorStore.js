// OpenAIFirebaseVectorStore.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
export class OpenAIFirebaseVectorStore {
    db;
    embeddings;
    collectionName;
    constructor(firebaseConfig, embeddings) {
        const app = initializeApp(firebaseConfig);
        this.db = getFirestore(app);
        this.embeddings = embeddings;
        this.collectionName = 'openai_document_embeddings';
    }
    /**
     * Add documents to the vector store
     * @param {Document[]} documents Array of documents with pageContent and metadata
     * @returns {Promise<string[]>} Array of document IDs
     */
    async addDocuments(documents) {
        try {
            console.log(`Adding ${documents.length} documents to vector store...`);
            // Generate embeddings for all documents
            const texts = documents.map(doc => doc.pageContent);
            console.log(`Generating embeddings for ${texts.length} documents...`);
            const documentEmbeddings = await this.embeddings.embedDocuments(texts);
            console.log(`Generated ${documentEmbeddings.length} embeddings.`);
            // Prepare batch of documents with embeddings
            const batch = documents.map((doc, i) => ({
                content: doc.pageContent,
                embedding: documentEmbeddings[i],
                metadata: doc.metadata,
                model: this.embeddings.modelName || 'openai', // Track which model created the embedding
                created: new Date().toISOString()
            }));
            // Add documents to Firestore
            const addedDocs = [];
            for (const item of batch) {
                const docRef = await addDoc(collection(this.db, this.collectionName), item);
                addedDocs.push(docRef.id);
            }
            console.log(`Successfully added ${addedDocs.length} documents to vector store.`);
            return addedDocs;
        }
        catch (error) {
            console.error('Error adding documents to vector store:', error);
            throw error;
        }
    }
    /**
     * Search for similar documents using cosine similarity
     * @param {string} query The query text
     * @param {number} k Number of results to return
     * @returns {Promise<Document[]>} Array of documents with pageContent and metadata
     */
    async similaritySearch(query, k = 4) {
        try {
            console.log(`Performing similarity search for query: "${query}"`);
            // Generate embedding for the query
            console.log('Generating embedding for query...');
            const queryEmbedding = await this.embeddings.embedQuery(query);
            console.log(`Generated query embedding with ${queryEmbedding.length} dimensions`);
            // Get all documents from Firestore
            console.log(`Retrieving documents from ${this.collectionName}...`);
            const querySnapshot = await getDocs(collection(this.db, this.collectionName));
            console.log(`Retrieved ${querySnapshot.size} documents from Firestore.`);
            if (querySnapshot.empty) {
                console.log('No documents found in the collection.');
                return [];
            }
            // Calculate cosine similarity for each document
            const results = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Skip documents without embeddings
                if (!data.embedding || !Array.isArray(data.embedding)) {
                    console.warn(`Skipping document ${doc.id} - invalid embedding`);
                    return;
                }
                try {
                    const similarity = this.cosineSimilarity(queryEmbedding, data.embedding);
                    results.push({
                        id: doc.id,
                        pageContent: data.content,
                        metadata: data.metadata || {},
                        similarity
                    });
                }
                catch (error) {
                    console.error(`Error calculating similarity for document ${doc.id}:`, error);
                }
            });
            console.log(`Calculated similarity for ${results.length} documents.`);
            // Sort by similarity and take top k results
            const topResults = results
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, k);
            console.log(`Top ${topResults.length} results have similarities: ${topResults.map(r => r.similarity.toFixed(4)).join(', ')}`);
            return topResults.map(({ pageContent, metadata }) => ({
                pageContent,
                metadata
            }));
        }
        catch (error) {
            console.error('Error in similarity search:', error);
            throw error;
        }
    }
    /**
     * Calculate cosine similarity between two vectors
     * @param {number[]} vectorA First vector
     * @param {number[]} vectorB Second vector
     * @returns {number} Cosine similarity (between -1 and 1)
     */
    cosineSimilarity(vectorA, vectorB) {
        try {
            // Check if vectors have the same dimensions
            if (vectorA.length !== vectorB.length) {
                console.warn(`Vector dimension mismatch: ${vectorA.length} vs ${vectorB.length}. Using minimum length.`);
            }
            // Use the minimum length to ensure compatibility
            const minLength = Math.min(vectorA.length, vectorB.length);
            const a = vectorA.slice(0, minLength);
            const b = vectorB.slice(0, minLength);
            // Calculate dot product
            const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
            // Calculate magnitudes
            const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
            const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
            // Check for zero magnitudes to avoid division by zero
            if (magnitudeA === 0 || magnitudeB === 0) {
                console.warn('Vector with zero magnitude found during similarity calculation');
                return 0;
            }
            // Calculate and return cosine similarity
            return dotProduct / (magnitudeA * magnitudeB);
        }
        catch (error) {
            console.error('Error calculating cosine similarity:', error);
            throw error;
        }
    }
    /**
     * Delete all documents from the vector store
     * @returns {Promise<number>} Number of documents deleted
     */
    async clearAll() {
        try {
            console.log(`Clearing all documents from ${this.collectionName}...`);
            const querySnapshot = await getDocs(collection(this.db, this.collectionName));
            let count = 0;
            for (const document of querySnapshot.docs) {
                await deleteDoc(doc(this.db, this.collectionName, document.id));
                count++;
            }
            console.log(`Cleared ${count} documents from vector store.`);
            return count;
        }
        catch (error) {
            console.error('Error clearing vector store:', error);
            throw error;
        }
    }
    /**
     * Create a retriever interface for this vector store
     * @param {number} k Number of documents to retrieve
     * @returns {Retriever} Retriever object with getRelevantDocuments method
     */
    asRetriever(k = 4) {
        return {
            getRelevantDocuments: async (query) => this.similaritySearch(query, k)
        };
    }
}
