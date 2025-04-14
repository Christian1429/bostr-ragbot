import { OpenAIFirebaseVectorStore } from '../OpenAIFirebaseVectorStore.js';
import { firebaseConfig } from '../firebaseConfig.js';
import { embeddings } from './openai.js';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { getFirestore, collection, getDocs } from '@firebase/firestore';
import { initializeApp } from 'firebase/app';
let vectorStore;
//* Initialize or get vectorStore
export async function getVectorStore() {
    if (!vectorStore) {
        console.log('Initierar ny OpenAIFirebaseVectorStore');
        vectorStore = new OpenAIFirebaseVectorStore(firebaseConfig, embeddings);
    }
    return vectorStore;
}
//* Add document to vectorStore
export async function addToVectorStore(content, sourceType, sourceUrl = '') {
    try {
        // Split content into manageable chunks
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 500,
            chunkOverlap: 200,
        });
        const metadata = {
            source: sourceType === 'url'
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
    }
    catch (error) {
        console.error('Error adding to vector store:', error);
        throw error;
    }
}
//* Migrate vectorstore route
export async function MigrateVectorStore(req, res) {
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
        const documents = [];
        oldDocs.forEach(doc => {
            const data = doc.data();
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
    }
    catch (error) {
        console.error("Fel vid migrering:", error);
        res.status(500).json({ error: error.message });
    }
}
;
