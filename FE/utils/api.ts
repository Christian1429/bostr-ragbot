import axios from 'axios';

const BACKEND_URL = 'http://localhost:3003'; // flytta sen

// 1. Load Documents
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

// 2. Chat
export async function chat(question: string): Promise<{ answer: string }> {
  const response = await axios.post(`${BACKEND_URL}/api/chat`, { question });
  return response.data;
}

// 3. Migrate Vectorstore
export async function migrateVectorstore(): Promise<{
  message: string;
  count: number;
}> {
  const response = await axios.post(`${BACKEND_URL}/api/migrate-vectorstore`);
  return response.data;
}

// Example Load Document function using file upload
export async function handleFileUpload(file: File, type: 'pdf' | 'url' | 'text') {
  try {
    const result = await loadDocuments(type, undefined, undefined, file);
    console.log(result);
  } catch (error) {
    console.error('Error loading documents:', error);
  }
}

// Example Load Document function using url
export async function handleUrlLoad(url: string, type: 'pdf' | 'url' | 'text') {
  try {
    const result = await loadDocuments(type, url, undefined, undefined);
    console.log(result);
    console.log(url)
  } catch (error) {
    console.error('Error loading documents:', error);
  }
}

//Example Load Document function using text.
export async function handleTextLoad(text: string, type: 'pdf' | 'url' | 'text') {
  try {
    const result = await loadDocuments(type, undefined, text, undefined);
    console.log(result);
  } catch (error) {
    console.error('Error loading documents:', error);
  }
}

// export async function handleChat(question: string) {
//   try {
//     const result = await chat(question);
//     console.log(result.answer);
//   } catch (error) {
//     console.error('Error chatting:', error);
//   }
// }

export async function handleMigration() {
  try {
    const result = await migrateVectorstore();
    console.log(result);
  } catch (error) {
    console.error('Error migrating:', error);
  }
}