import axios from 'axios';
import { DeleteDocumentsParams, DeleteResponse, ApiError } from '../interface/interface';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

//* Delete Documents By Tags
export const deleteDocumentsByTag = async ({
  tag,
  collection = 'openai_document_embeddings',
  batchSize = 100,
}: DeleteDocumentsParams): Promise<DeleteResponse> => {
  try {
    const response = await axios.post<DeleteResponse>(
      `${BACKEND_URL}/api/delete`,
      { tag, collection, batchSize },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw {
        message: error.response?.data?.message || 'Failed to delete documents',
        status: error.response?.status,
        details: error.response?.data,
      } as ApiError;
    }
    throw {
      message: 'Network error or unexpected failure',
      details: error,
    } as ApiError;
  }
};

//* Load Documents with provider support
export async function loadDocuments(
  type: 'url' | 'pdf' | 'text' | 'json',
  url?: string,
  content?: string,
  file?: File,
  tag?: string,
  provider: 'openai' | 'ollama' = 'openai',
  maxPages?: number,
  userId?: string  // Lägg till userId parameter
): Promise<{
  message: string; 
  source: string; 
  tag?: string;
  provider?: string;
  alreadyProcessed?: boolean; 
}> {
  const formData = new FormData();
  formData.append('type', type);
  formData.append('provider', provider);
  
  if (type === 'url' && url) {
    formData.append('url', url);
    if (maxPages) {
      formData.append('maxPages', maxPages.toString());
    }
  } else if (type === 'text' && content) {
    formData.append('content', content);
  } else if (type === 'pdf' && file) {
    formData.append('file', file);
  } else if (type === 'json' && file) {
    formData.append('file', file);
  }
  
  if (tag) {
    formData.append('tag', tag);
  }
  
  // Skicka med användar-ID om det finns
  if (userId) {
    formData.append('userId', userId);
  }
  
  const response = await axios.post(
    `${BACKEND_URL}/api/load-documents`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

//* Chat with provider support
export async function chat(
  question: string,
  userName?: string,
  userId?: string,
  provider: 'openai' | 'ollama' = 'openai',
  modelName?: string
): Promise<{ answer: string }> {
  const response = await axios.post(`${BACKEND_URL}/api/chat`, {
    question,
    userName,
    userId,
    provider,
    modelName
  });
  return response.data;
}

//* FILE Load Document Function with provider
export async function handleFileUpload(
  file: File, 
  type: 'pdf' | 'url' | 'text' | 'json', 
  tag: string,
  provider: 'openai' | 'ollama' = 'openai',
  userId?: string  // Lägg till userId parameter
) {
  try {
    const result = await loadDocuments(type, undefined, undefined, file, tag, provider, undefined, userId);
    console.log(result);
    return result;
  } catch (error) {
    console.error('Error loading documents:', error);
    throw error;
  }
}

//* URL Load Document Function with provider
export async function handleUrlLoad(
  url: string, 
  type: 'pdf' | 'url' | 'text', 
  tag: string,
  provider: 'openai' | 'ollama' = 'openai',
  userId?: string,  // Flyttat upp userId för bättre läsbarhet
  maxPages?: number
): Promise<{ 
  message: string; 
  source: string; 
  tag?: string;
  provider?: string;
  alreadyProcessed?: boolean;
}> {
  try {
    // Skicka userId till loadDocuments
    const result = await loadDocuments(type, url, undefined, undefined, tag, provider, maxPages, userId);
    console.log(result);
    return result;
  } catch (error) {
    console.error('Error loading documents:', error);
    throw error;
  }
}

//* TEXT Load Document Function with provider
export async function handleTextLoad(
  text: string,
  type: 'pdf' | 'url' | 'text' | 'json',
  tag?: string,
  provider: 'openai' | 'ollama' = 'openai',
  userId?: string  // Lägg till userId parameter
) {
  try {
    const result = await loadDocuments(type, undefined, text, undefined, tag, provider, undefined, userId);
    console.log(result);
    return result;
  } catch (error) {
    console.error('Error loading documents:', error);
    throw error;
  }
}

//* Migrate Vectorstore with provider
export async function migrateVectorstore(provider: 'openai' | 'ollama' = 'openai'): Promise<{
  message: string;
  count: number;
  provider: string;
}> {
  const response = await axios.post(`${BACKEND_URL}/api/migrate-vectorstore`, {
    provider
  });
  return response.data;
}

export async function handleMigration(provider: 'openai' | 'ollama' = 'openai') {
  try {
    const result = await migrateVectorstore(provider);
    console.log(result);
  } catch (error) {
    console.error('Error migrating:', error);
  }
}