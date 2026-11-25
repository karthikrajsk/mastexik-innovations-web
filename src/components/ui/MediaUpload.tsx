import React, { useState, useRef } from 'react';
import mediaService, { 
  MediaUploadRequest, 
  MediaDetailResponse, 
  MediaResponse 
} from '../../services/MediaUploadService';

interface MediaUploadProps {
  containerName: string;
  onUploadSuccess?: (response: MediaDetailResponse) => void;
  onUploadError?: (error: Error) => void;
  onMediaLoaded?: (response: MediaResponse) => void;
  maxFileSizeMB?: number;
  allowedMediaTypes?: Array<'IMAGE' | 'VIDEO' | 'PDF' | 'DOC'>;
  showPreview?: boolean;
  folderPath?: string;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  isUploading: boolean;
  error?: string;
  success?: boolean;
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  containerName,
  onUploadSuccess,
  onUploadError,
  onMediaLoaded,
  maxFileSizeMB = 100,
  allowedMediaTypes = ['IMAGE', 'VIDEO', 'PDF', 'DOC'],
  showPreview = true,
  folderPath,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(
    new Map()
  );
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewType, setPreviewType] = useState<'image' | 'video' | 'none'>('none');
  const [mediaList, setMediaList] = useState<MediaDetailResponse[]>([]);
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!mediaService.validateFileSize(file, maxFileSizeMB)) {
      const error = new Error(
        `File size exceeds ${maxFileSizeMB}MB limit. Selected file: ${file.size / (1024 * 1024)}MB`
      );
      onUploadError?.(error);
      return;
    }

    const mediaType = mediaService.getMediaType(file);
    if (!allowedMediaTypes.includes(mediaType)) {
      const error = new Error(
        `File type not allowed. Allowed types: ${allowedMediaTypes.join(', ')}`
      );
      onUploadError?.(error);
      return;
    }

    setSelectedFile(file);

    if (showPreview && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
        setPreviewType('image');
      };
      reader.readAsDataURL(file);
    } else if (showPreview && file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
        setPreviewType('video');
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewType('none');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      const error = new Error('No file selected');
      onUploadError?.(error);
      return;
    }

    try {
      setUploading(true);
      const progress = new Map(uploadProgress);
      progress.set(selectedFile.name, {
        fileName: selectedFile.name,
        progress: 0,
        isUploading: true,
      });
      setUploadProgress(progress);

      const base64File = await mediaService.fileToBase64(selectedFile);
      const mediaType = mediaService.getMediaType(selectedFile);

      const request: MediaUploadRequest = {
        base64File,
        fileName: selectedFile.name,
        contentType: selectedFile.type,
        mediaType,
        containerName,
        mediaDetailDescription: description,
        ...(folderPath && { folderPath }),
      };

      const response = await mediaService.uploadMedia(request);

      const updatedProgress = new Map(uploadProgress);
      updatedProgress.set(selectedFile.name, {
        fileName: selectedFile.name,
        progress: 100,
        isUploading: false,
        success: true,
      });
      setUploadProgress(updatedProgress);

      onUploadSuccess?.(response);

      setSelectedFile(null);
      setPreviewUrl('');
      setPreviewType('none');
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setMediaList([...mediaList, response]);

      setTimeout(() => {
        const cleaned = new Map(uploadProgress);
        cleaned.delete(selectedFile.name);
        setUploadProgress(cleaned);
      }, 2000);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Upload failed');
      onUploadError?.(err);

      const updatedProgress = new Map(uploadProgress);
      updatedProgress.set(selectedFile.name, {
        fileName: selectedFile.name,
        progress: 0,
        isUploading: false,
        error: err.message,
      });
      setUploadProgress(updatedProgress);
    } finally {
      setUploading(false);
    }
  };

  const loadMediaFromContainer = async () => {
    try {
      const response = await mediaService.getMediaByContainer(containerName);
      setMediaList(response.mediaDetails);
      onMediaLoaded?.(response);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to load media');
      onUploadError?.(err);
    }
  };

  const handleDeleteMedia = async (mediaDetailSno: number) => {
    if (!window.confirm('Are you sure you want to delete this media?')) return;

    try {
      await mediaService.softDeleteMedia(mediaDetailSno);
      setMediaList(
        mediaList.filter((item) => item.mediaDetailSno !== mediaDetailSno)
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Delete failed');
      onUploadError?.(err);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="space-y-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            Choose File
          </button>
          <p className="mt-2 text-gray-600 text-sm">
            {selectedFile
              ? `Selected: ${selectedFile.name}`
              : 'or drag and drop a file'}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Max size: {maxFileSizeMB}MB
          </p>
        </div>

        {showPreview && previewUrl && (
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2">Preview</h3>
            {previewType === 'image' && (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-auto max-h-64 object-contain"
              />
            )}
            {previewType === 'video' && (
              <video
                src={previewUrl}
                controls
                className="w-full h-auto max-h-64"
              />
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description for this media"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={uploading}
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold"
        >
          {uploading ? 'Uploading...' : 'Upload Media'}
        </button>

        {Array.from(uploadProgress.values()).map((prog) => (
          <div key={prog.fileName} className="border rounded p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{prog.fileName}</span>
              {prog.success && <span className="text-green-600 text-sm">✓ Success</span>}
              {prog.error && <span className="text-red-600 text-sm">✗ {prog.error}</span>}
            </div>
            {prog.isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${prog.progress}%` }}
                />
              </div>
            )}
          </div>
        ))}

        <div>
          <button
            onClick={loadMediaFromContainer}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 font-semibold"
          >
            Load Media from Container
          </button>

          {mediaList.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-semibold">Uploaded Files</h3>
              {mediaList.map((media) => (
                <div
                  key={media.mediaDetailSno}
                  className="flex justify-between items-center p-3 border rounded-lg bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium">{media.originalFileName}</p>
                    <p className="text-xs text-gray-500">
                      {(media.mediaSize / (1024 * 1024)).toFixed(2)}MB
                    </p>
                    {media.mediaDetailDescription && (
                      <p className="text-xs text-gray-600 mt-1">
                        {media.mediaDetailDescription}
                      </p>
                    )}
                  </div>
                  <div className="space-x-2">
                    <a
                      href={media.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleDeleteMedia(media.mediaDetailSno)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaUpload;
