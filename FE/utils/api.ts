import axios from 'axios';
import { DeleteDocumentsParams, DeleteResponse, ApiError } from '../interface/interface';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

//* Delete Documents By Tags
export const deleteDocumentsByTag = async ({
  tag,
  collection = 'openai_document_embeddings', //! Add your collection
  batchSize = 100,
}: DeleteDocumentsParams): Promise<DeleteResponse> => {
  try {
    const response = await axios.post<DeleteResponse>(
      `${BACKEND_URL}/api/delete`,
      { tag, collection, batchSize },
      {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers if needed
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`
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

//* Load Documents
export async function loadDocuments(
  type: 'url' | 'pdf' | 'text' | 'json',
  url?: string,
  content?: string,
  file?: File,
  tag?: string

): Promise<{ message: string; source: string }> {
  const formData = new FormData();
  formData.append('type', type);

  if (type === 'url' && url) {
    formData.append('url', url);
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

//* Chat
export async function chat(question: string): Promise<{ answer: string }> {
  const response = await axios.post(`${BACKEND_URL}/api/chat`, { question });
  return response.data;
}

//* FILE Load Document Function.
export async function handleFileUpload(file: File, type: 'pdf' | 'url' | 'text' | 'json', tag: string) {
  try {
    const result = await loadDocuments(type, undefined, undefined, file, tag);
    console.log(result);
  } catch (error) {
    console.error('Error loading documents:', error);
  }
}

//* URL Load Document Function.
export async function handleUrlLoad(url: string, type: 'pdf' | 'url' | 'text', tag: string) {
  try {
    const result = await loadDocuments(type, url, undefined, undefined, tag);
    console.log(result);
    console.log(url)
  } catch (error) {
    console.error('Error loading documents:', error);
  }
}

//* TEXT Load Document Function.
export async function handleTextLoad(
  text: string,
  type: 'pdf' | 'url' | 'text' | 'json',
  tag?: string
) {
  try {
    const result = await loadDocuments(type, undefined, text, undefined, tag);
    console.log(result);
  } catch (error) {
    console.error('Error loading documents:', error);
  }
}
//* Migrate Vectorstore
export async function migrateVectorstore(): Promise<{
  message: string;
  count: number;
}> {
  const response = await axios.post(`${BACKEND_URL}/api/migrate-vectorstore`);
  return response.data;
}

//* MIGRATE Vectorstore function.
export async function handleMigration() {
  try {
    const result = await migrateVectorstore();
    console.log(result);
  } catch (error) {
    console.error('Error migrating:', error);
  }
}