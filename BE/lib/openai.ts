import { OpenAI } from 'openai';
import { OpenAIEmbeddings } from '@langchain/openai';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize OpenAI Embeddings
export const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'text-embedding-3-small',
});


// Generate response from OpenAI
export async function generateResponse(prompt: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Can be adjusted to another model
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    });

    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating response from OpenAI:', error);
    throw error;
  }
}
