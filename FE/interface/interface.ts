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
