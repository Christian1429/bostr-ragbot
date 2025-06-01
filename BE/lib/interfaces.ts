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
  tag?: string;
}

export interface ChatRequestBody {
  question: string;
}

export interface FirestoreDocument {
  content?: string;
  metadata?: Record<string, any>;
}

export interface JsonExtractResult { 
  [key: string]: any;
}

export interface FlattenedObject {
  [key: string]: string;
}

export interface ExtractTextOptions {
  keysToExtract?: string[];
}

// export interface ExtractPhotoKeys {
//   keysToExtract?: string[];
// }

export type SourceType = 'url' | 'pdf' | 'text' | 'json';

