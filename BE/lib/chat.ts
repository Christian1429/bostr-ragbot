
import { Request, Response } from 'express';
import { ChatRequestBody } from './interfaces.js';
import { generateResponse } from './openai.js';
import { getVectorStore } from './vectorStore.js';
import { createLLMProvider } from './llmProviders.js'

import { db } from '../utils/admin.js';

let lastQuestionType: string | null = null;


export const Chat = async (req: Request, res: Response): Promise<void> => {
  try {
    
    const { question, provider ,modelName } = req.body as ChatRequestBody & { 
      provider?: 'openai' | 'ollama',
      modelName?: string 
    };
    
    const userId = req.headers['user-id'] as string || req.body.userId;

    console.log('Received userId:', userId, typeof userId);
    console.log('Using provider:', provider, 'with model:', modelName);
    
    let userName = req.body.userName || "användare";
    let income: number | null = null;
    
    if (userId) {
     
      try {
        const userProfileRef = db.collection('userProfiles').doc(userId);
        const userProfile = await userProfileRef.get();
        
        if (userProfile.exists) {
          const userData = userProfile.data();
          console.log('Användardata från Firestore:', userData);
          
          // Behåll namndelen oförändrad
          if (userData && userData.name) {
            userName = userData.name;
           
          }

          if (userData && userData.monthlyIncome) {
            income = Number(userData.monthlyIncome);
            console.log(`Inkomst från 'monthlyIncome': ${income}`);
          }
       
        }
      } catch (profileError) {
        console.error('Error fetching user profile:', profileError);
      }
    }

    if (!question) {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('hej') || 
        lowerQuestion.includes('hallå') || 
        lowerQuestion.includes('tjena') ||
        lowerQuestion === "hej" ||
        lowerQuestion === "hello" ||
        lowerQuestion === "hi") {
      res.json({ 
        answer: `Hej ${userName}! Din inkomst: ${income}. Välkommen till BOSTR-chatboten.` 
      });
      return;
    }

    if (lastQuestionType === 'waiting-for-income') {
      const income = parseInt(question.replace(/\D/g, ''), 10);
      if (!isNaN(income)) {
        const fribelopp = income * 6;
        lastQuestionType = null; 
        res.json({
          answer: `Ditt fribelopp blir cirka ${fribelopp.toLocaleString()} kronor, ${userName}.`,
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

    if (lowerQuestion.includes('student')) {
      lastQuestionType = 'waiting-for-income';
      res.json({ answer: `Hur mycket tror du att du kommer att tjäna i år, ${userName}?` });
      return;
    }

    console.log(`Processar fråga från ${userName}: "${question}"`);

    const broadSearchKeywords: string[] = [
      'förklara',
      'beskriv',
      'jämför',
      'hur fungerar',
    ];
    const isBroadSearch: boolean = broadSearchKeywords.some((word) =>
      question.toLowerCase().includes(word)
    );

    const store = await getVectorStore();
    
    console.log('Söker efter relevanta dokument...');
    const retriever = store.asRetriever(isBroadSearch ? 20 : 6);
    const relevantDocs = await retriever.getRelevantDocuments(question);
    console.log(`Hittade ${relevantDocs.length} relevanta dokument`);

    const context = relevantDocs.map((doc) => doc.pageContent).join('\n\n');
    
   
    if (!context.trim()) {
      console.log('Ingen relevant kontext hittades');
      res.json({
        answer:
          `Jag hittar ingen information om det i de tillgängliga dokumenten, ${userName}.`,
      });
      return;
    }



    console.log('Skapar LLM provider och genererar svar...');
    const llmProvider = createLLMProvider(provider, modelName);
    const formattedPrompt = await createPromptTemplate(context, question, userName, income);
    const response = await llmProvider.generateResponse(formattedPrompt);
    console.log('Svar genererat');
    
    res.json({ answer: response });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: (error as Error).message });
  }
};

export async function createPromptTemplate(
  context: string,
  query: string,
  userName: string = "användare",
  income: number | null = null
): Promise<string> {
  return `
Du är en hjälpsam AI-assistent som svarar på svenska. Använd informationen nedan för att svara på frågan.
Ditt namn är BOSTR-bot och du pratar med användaren ${userName}.Du berättar också vilken inkomst användaren har ${income}

Om användaren frågar efter fribeloppet kommer du kunna svara att fribeloppet är för den här användaren är 10 gånger ${income}
Här är information som du kan använda:
${context}

Fråga från ${userName}: ${query}

Om frågan gäller "fribelopp" men inget årtal anges, fråga användaren vilket år (t.ex. 2024 eller 2025) det gäller.
Svara annars koncist och direkt på svenska. Var vänlig och personlig i ditt svar genom att använda användarens namn (${userName}) ibland.

Om informationen för att besvara frågan inte finns i texten ovan,
säg bara "Jag hittar ingen information om det i de tillgängliga dokumenten, ${userName}."

Avsluta gärna ditt svar på ett personligt sätt, t.ex. "Hoppas det hjälper dig, ${userName}!" om det passar i sammanhanget.
`;
}