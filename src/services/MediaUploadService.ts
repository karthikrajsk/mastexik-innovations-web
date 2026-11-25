import apiService from './ApiService';
import CompressionService, { CompressionStats } from './CompressionService';

export interface MediaUploadRequest {
  base64File: string;
  fileName: string;
  contentType: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'PDF' | 'DOC';
  containerName: string;
  mediaDetailDescription?: string;
  replaceFile?: boolean;
  isCompressed?: boolean;
  originalFileSize?: number;
  compressedFileSize?: number;
  isPublic?: boolean;
  folderPath?: string;
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

class MediaService {
  async uploadMedia(request: MediaUploadRequest): Promise<MediaDetailResponse> {
    try {
      console.log('Uploading media:', request.fileName);
      const response = await apiService.post('/media/upload', request);
      console.log('Media uploaded successfully:', response);
      
      let mediaData: any;
      if (response?.body?.data) {
        mediaData = response.body.data;
      } else if (response?.data?.data) {
        mediaData = response.data.data;
      } else if (response?.data) {
        mediaData = response.data;
      } else {
        mediaData = response;
      }
      
      console.log('Extracted media data:', mediaData);
      return mediaData;
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  }

  async getMediaDetailByMediaDetailSno(mediaDetailSno: number): Promise<MediaDetailResponse> {
    try {
      console.log('Fetching media detail for mediaDetailSno:', mediaDetailSno);
      const response = await apiService.get(`/media/detail/${mediaDetailSno}`);
      console.log('Media detail response:', response);

      let mediaData: any;
      if (response?.body?.data) {
        mediaData = response.body.data;
      } else if (response?.data?.data) {
        mediaData = response.data.data;
      } else if (response?.data) {
        mediaData = response.data;
      } else {
        mediaData = response;
      }

      console.log('Extracted media detail:', mediaData);
      return mediaData;
    } catch (error) {
      console.error('Error fetching media detail:', error);
      throw error;
    }
  }

  async updateMedia(request: MediaUpdateRequest): Promise<MediaDetailResponse> {
    try {
      console.log('Updating media:', request.mediaDetailSno);
      const response = await apiService.put('/media/update', request);
      console.log('Media updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating media:', error);
      throw error;
    }
  }

  async getMediaByContainer(containerName: string): Promise<MediaResponse> {
    try {
      console.log('Fetching media for container:', containerName);
      const response = await apiService.get(`/media/container/${containerName}`);
      let mediaData: any;
      if (response?.body?.data) {
        mediaData = response.body.data;
      } else if (response?.data?.data) {
        mediaData = response.data.data;
      } else if (response?.data) {
        mediaData = response.data;
      } else {
        mediaData = response;
      }
      if (!mediaData || !mediaData.mediaDetails) {
        return {
          mediaSno: 0,
          containerName,
          mediaDetails: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      }
      return mediaData;
    } catch (error) {
      console.error('Error fetching media:', error);
      return {
        mediaSno: 0,
        containerName,
        mediaDetails: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    }
  }

  async getBatchFileCounts(containerNames: string[]): Promise<Record<string, number>> {
    if (!containerNames || containerNames.length === 0) return {};
    try {
      const response = await apiService.post('/media/counts', containerNames);
      let countMap: Record<string, number> = {};
      if (response?.body?.data) {
        countMap = response.body.data;
      } else if (response?.data?.data) {
        countMap = response.data.data;
      } else if (response?.data) {
        countMap = response.data;
      } else if (typeof response === 'object') {
        countMap = response;
      }
      return countMap || {};
    } catch (error) {
      console.error('Error fetching batch file counts:', error);
      return {};
    }
  }

  async getMediaByMediaSno(mediaSno: number): Promise<MediaResponse> {
    try {
      console.log('Fetching media for mediaSno:', mediaSno);
      const response = await apiService.get(`/media/${mediaSno}`);
      console.log('Media fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching media:', error);
      throw error;
    }
  }

  async softDeleteMedia(mediaDetailSno: number): Promise<void> {
    try {
      console.log('Soft deleting media:', mediaDetailSno);
      await apiService.delete(`/media/${mediaDetailSno}/soft`);
      console.log('Media soft deleted successfully');
    } catch (error) {
      console.error('Error soft deleting media:', error);
      throw error;
    }
  }

  async hardDeleteMedia(mediaDetailSno: number): Promise<void> {
    try {
      console.log('Hard deleting media:', mediaDetailSno);
      await apiService.delete(`/media/${mediaDetailSno}/hard`);
      console.log('Media hard deleted successfully');
    } catch (error) {
      console.error('Error hard deleting media:', error);
      throw error;
    }
  }

  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  getMimeType(file: File): string {
    if (file.type && file.type !== 'application/octet-stream') {
      return file.type;
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'doc': return 'application/msword';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xls': return 'application/vnd.ms-excel';
      case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'csv': return 'text/csv';
      case 'txt': return 'text/plain';
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'webp': return 'image/webp';
      case 'gif': return 'image/gif';
      case 'svg': return 'image/svg+xml';
      default: return file.type || 'application/octet-stream';
    }
  }

  getMediaType(file: File): 'IMAGE' | 'VIDEO' | 'PDF' | 'DOC' {
    const mimeType = this.getMimeType(file).toLowerCase();
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    
    if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) return 'IMAGE';
    if (mimeType.startsWith('video/') || ['mp4', 'mov', 'avi'].includes(ext)) return 'VIDEO';
    if (mimeType.includes('pdf') || ext === 'pdf') return 'PDF';
    return 'DOC';
  }

  validateFileSize(file: File, maxSizeMB: number = 100): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  async compressAndUploadMedia(
    request: MediaUploadRequest,
    file: File,
    onCompressionProgress?: (stats: CompressionStats) => void
  ): Promise<{ response: MediaDetailResponse; stats: CompressionStats }> {
    try {
      console.log('🔗 Starting compression and upload for:', file.name);

      const { compressed, stats } = await CompressionService.compressFile(file);

      onCompressionProgress?.(stats);

      const compressedBase64 = CompressionService.compressedToBase64(compressed);

      const uploadRequest: MediaUploadRequest = {
        ...request,
        base64File: compressedBase64,
        isCompressed: true,
        originalFileSize: stats.originalSize,
        compressedFileSize: stats.compressedSize,
      };

      const response = await this.uploadMedia(uploadRequest);

      console.log('✅ Compressed upload successful:', {
        originalSize: CompressionService.formatFileSize(stats.originalSize),
        compressedSize: CompressionService.formatFileSize(stats.compressedSize),
        saved: CompressionService.formatFileSize(stats.savedBytes),
        ratio: `${stats.savedPercentage.toFixed(2)}%`,
      });

      return { response, stats };
    } catch (error) {
      console.error('Error in compressed upload:', error);
      throw error;
    }
  }

  getCompressionStats(file: File): Promise<CompressionStats | null> {
    return CompressionService.compressFile(file).then(({ stats }) => stats).catch(() => null);
  }

  formatFileSize(bytes: number): string {
    return CompressionService.formatFileSize(bytes);
  }
}

export default new MediaService();
