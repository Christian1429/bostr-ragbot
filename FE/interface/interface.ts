export interface DeleteDocumentsParams {
  tag: string;
  collection?: string;
  batchSize?: number;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
  deletedCount?: number;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}

export interface SearchResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  results: SearchResultItem[];
}

export interface SearchResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  results: SearchResultItem[];
}

export interface SearchResultItem {
  id: string;
  data: {
    content: string;
    embedding: number[];
    metadata: {
      source: string;
      dateAdded: string;
      tags: string[];
      loc: {
        lines: {
          from: number;
          to: number;
        };
      };
    };
    model: string;
    created: string;
  };
  metadata: {
    source: string;
    dateAdded: string;
    tags: string[];
    loc: {
      lines: {
        from: number;
        to: number;
      };
    };
  };
}
