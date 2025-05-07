// 2. Chat route
import { Request, Response } from 'express';
import { ChatRequestBody } from './interfaces.js';
import { generateResponse } from './openai.js';
import { getVectorStore } from './vectorStore.js';

let lastQuestionType: string | null = null;

export const Chat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { question } = req.body as ChatRequestBody;

    if (!question) {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    const lowerQuestion = question.toLowerCase();

    if (lastQuestionType === 'waiting-for-income') {
      const income = parseInt(question.replace(/\D/g, ''), 10);
      if (!isNaN(income)) {
        const fribelopp = income * 6;
        lastQuestionType = null; // Rensa state
        res.json({
          answer: `Ditt fribelopp blir cirka ${fribelopp.toLocaleString()} kronor.`,
        });
        return;
      } else {
        res.json({
          answer:
            'Jag förstod inte summan, kan du skriva hur mycket du kommer tjäna i kronor?',
        });
        return;
      }
    }

    if (lowerQuestion.includes('fribelopp')) {
      lastQuestionType = 'waiting-for-income';
      res.json({ answer: 'Hur mycket tror du att du kommer att tjäna i år?' });
      return;
    }

    console.log(`Processar fråga: "${question}"`);
    const broadSearchKeywords: string[] = [
      'förklara',
      'beskriv',
      'jämför',
      'hur fungerar',
    ];

    const isBroadSearch: boolean = broadSearchKeywords.some((word) =>
      question.toLowerCase().includes(word)
    );
    // Get vectorStore
    const store = await getVectorStore();

    // Get relevant documents
    console.log('Söker efter relevanta dokument...');
    const retriever = store.asRetriever(isBroadSearch ? 20 : 6);
    const relevantDocs = await retriever.getRelevantDocuments(question);

    console.log(`Hittade ${relevantDocs.length} relevanta dokument`);

    // Create context from relevant documents
    const context = relevantDocs.map((doc) => doc.pageContent).join('\n\n');

    // If no context was found
    if (!context.trim()) {
      console.log('Ingen relevant kontext hittades');
      res.json({
        answer:
          'Jag hittar ingen information om det i de tillgängliga dokumenten.',
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
};

//* Create prompt template for question-answering
export async function createPromptTemplate(
  context: string,
  query: string
): Promise<string> {
  return `
Du är en hjälpsam AI-assistent som svarar på svenska. Använd informationen nedan för att svara på frågan 

Här är information som du kan använda:
${context}

Fråga: ${query}

Om frågan gäller "fribelopp" men inget årtal anges, fråga användaren vilket år (t.ex. 2024 eller 2025) det gäller. 
Svara annars koncist och direkt på svenska. Om informationen för att besvara frågan inte finns i texten ovan, 
säg bara "Jag hittar ingen information om det i de tillgängliga dokumenten."

`;
}
