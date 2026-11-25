export interface MediaUploadRequest {
  base64File: string;
  fileName: string;
  contentType: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'PDF' | 'DOC';
  containerName: string;
  mediaDetailDescription?: string;
  replaceFile?: boolean;
}

export interface MediaUpdateRequest {
  mediaDetailSno: number;
  base64File?: string;
  fileName?: string;
  contentType?: string;
  mediaDetailDescription?: string;
  replaceFile?: boolean;
}

export interface MediaDetailResponse {
  mediaDetailSno: number;
  mediaSno: number;
  azureId: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  mediaType: string;
  contentType: string;
  mediaSize: number;
  mediaDetailDescription?: string;
  isUploaded: boolean;
  createdAt: number;
  updatedAt: number;
  originalFileName: string;
}

export interface MediaResponse {
  mediaSno: number;
  containerName: string;
  mediaDetails: MediaDetailResponse[];
  createdAt: number;
  updatedAt: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  errorCode?: string;
}
