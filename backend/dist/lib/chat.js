import { generateResponse } from './openai.js';
import { getVectorStore } from './vectorStore.js';
export const Chat = (async (req, res) => {
    try {
        const { question } = req.body;
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
        const context = relevantDocs.map((doc) => doc.pageContent).join('\n\n');
        // If no context was found
        if (!context.trim()) {
            console.log('Ingen relevant kontext hittades');
            res.json({
                answer: 'Jag hittar ingen information om det i de tillgängliga dokumenten.',
            });
            return;
        }
        // Create prompt and generate response
        console.log('Skapar prompt och genererar svar...');
        const formattedPrompt = await createPromptTemplate(context, question);
        const response = await generateResponse(formattedPrompt);
        console.log('Svar genererat');
        res.json({ answer: response });
    }
    catch (error) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({ error: error.message });
    }
});
//* Create prompt template for question-answering
export async function createPromptTemplate(context, query) {
    return `
Du är en hjälpsam AI-assistent som svarar på svenska. Använd informationen nedan för att svara på frågan.

Här är information som du kan använda:
${context}

Fråga: ${query}

Om frågan gäller "fribelopp" men inget årtal anges, fråga användaren vilket år (t.ex. 2024 eller 2025) det gäller. 
Svara annars koncist och direkt på svenska. Om informationen för att besvara frågan inte finns i texten ovan, 
säg bara "Jag hittar ingen information om det i de tillgängliga dokumenten."
`;
}
