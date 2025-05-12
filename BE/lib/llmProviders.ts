import { OpenAI } from 'openai';
import axios from 'axios';

export interface LLMProvider {
  generateResponse(prompt: string): Promise<string>;
  embedText(text: string): Promise<number[]>;
  embedTexts(texts: string[]): Promise<number[][]>;
  modelName: string;
}

// OpenAI Provider
export class OpenAIProvider implements LLMProvider {
  private openai: OpenAI;
  public modelName: string;
  private embeddingModel: string;

  constructor(apiKey: string, modelName = 'gpt-4o', embeddingModel = 'text-embedding-3-small') {
    this.openai = new OpenAI({ apiKey });
    this.modelName = modelName;
    this.embeddingModel = embeddingModel;
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      });
      return completion.choices[0].message.content || '';
    } catch (error) {
      console.error('Error generating response from OpenAI:', error);
      throw error;
    }
  }

  async embedText(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error embedding text with OpenAI:', error);
      throw error;
    }
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: texts,
      });
      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('Error embedding texts with OpenAI:', error);
      throw error;
    }
  }
}

// Ollama Provider
export class OllamaProvider implements LLMProvider {
  private baseUrl: string;
  public modelName: string;
  private embeddingModel: string;

  constructor(baseUrl = 'http://localhost:11434', modelName = 'mistral:latest', embeddingModel = 'mistral:latest') {
    this.baseUrl = baseUrl;
    this.modelName = modelName;
    this.embeddingModel = embeddingModel;
  }

  async generateResponse(prompt: string): Promise<string> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.modelName,
        prompt: prompt,
        stream: false,
      });
      return response.data.response;
    } catch (error) {
      console.error('Error generating response from Ollama:', error);
      throw error;
    }
  }

  async embedText(text: string): Promise<number[]> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/embeddings`, {
        model: this.embeddingModel,
        prompt: text,
      });
      return response.data.embedding;
    } catch (error) {
      console.error('Error embedding text with Ollama:', error);
      throw error;
    }
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    // Ollama doesn't support batch embeddings, so we'll process them one by one
    const embeddings: number[][] = [];
    for (const text of texts) {
      const embedding = await this.embedText(text);
      embeddings.push(embedding);
    }
    return embeddings;
  }
}

// Factory function to create the appropriate provider
export function createLLMProvider(
  provider: 'openai' | 'ollama' = 'openai',
  modelName?: string
): LLMProvider {
  switch (provider) {
    case 'openai':
      return new OpenAIProvider(
        process.env.OPENAI_API_KEY!,
        modelName || 'gpt-4o'
      );
    
    case 'ollama':
      return new OllamaProvider(
        process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        modelName || 'mistral:latest'
      );
    
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// Create embeddings adapter for compatibility with existing code
export function createEmbeddings(provider: LLMProvider) {
  return {
    embedDocuments: (texts: string[]) => provider.embedTexts(texts),
    embedQuery: (text: string) => provider.embedText(text),
    modelName: provider.modelName,
  };
}