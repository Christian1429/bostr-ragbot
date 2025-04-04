export interface PDFExtractResult {
  pages: Array<{
    content: Array<{
      str: string;
      [key: string]: any;
    }>;
    [key: string]: any;
  }>;
}

export interface LoadDocumentsRequestBody {
  type: SourceType;
  url?: string;
  content?: string;
}

export interface ChatRequestBody {
  question: string;
}

export interface FirestoreDocument {
  content?: string;
  metadata?: Record<string, any>;
}

export type SourceType = 'url' | 'pdf' | 'text';