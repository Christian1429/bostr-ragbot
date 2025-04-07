import axios from 'axios';

const BACKEND_URL = process.env.NEXT_BACKEND_URL;

//* 1. Load Documents
export async function loadDocuments(
  type: 'url' | 'pdf' | 'text',
  url?: string,
  content?: string,
  file?: File
): Promise<{ message: string; source: string }> {
  const formData = new FormData();
  formData.append('type', type);

  if (type === 'url' && url) {
    formData.append('url', url);
  } else if (type === 'text' && content) {
    formData.append('content', content);
  } else if (type === 'pdf' && file) {
    formData.append('file', file);
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

//* FILE Load Document function.
export async function handleFileUpload(file: File, type: 'pdf' | 'url' | 'text') {
  try {
    const result = await loadDocuments(type, undefined, undefined, file);
    console.log(result);
  } catch (error) {
    console.error('Error loading documents:', error);
  }
}

//* URL Load Document function.
export async function handleUrlLoad(url: string, type: 'pdf' | 'url' | 'text') {
  try {
    const result = await loadDocuments(type, url, undefined, undefined);
    console.log(result);
    console.log(url)
  } catch (error) {
    console.error('Error loading documents:', error);
  }
}

//* TEXT Load Document function.
export async function handleTextLoad(text: string, type: 'pdf' | 'url' | 'text') {
  try {
    const result = await loadDocuments(type, undefined, text, undefined);
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