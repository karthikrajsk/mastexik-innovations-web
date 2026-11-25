import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { FileText, FileJson, Image as ImageIcon, X } from 'lucide-react';
import mediaService from '@/services/MediaUploadService';

interface FileUploadFieldProps {
  label?: string;
  containerName: string;
  onUploadSuccess?: (mediaSno: number, fileName: string) => void;
  onUploadError?: (error: string) => void;
  onFileRemove?: () => void;
  onClear?: () => void;
  mediaSno?: number | null;
  fileName?: string;
  initialFileName?: string;
  previewUrl?: string;
  isUploading?: boolean;
  uploadError?: string | null;
  required?: boolean;
}

export interface FileUploadFieldRef {
  uploadFile: () => Promise<number | null>;
  hasFile: () => boolean;
}

const FileUploadField = forwardRef<FileUploadFieldRef, FileUploadFieldProps>(
  ({
    label,
    containerName,
    onUploadSuccess,
    onUploadError,
    onFileRemove,
    onClear,
    mediaSno,
    fileName,
    initialFileName,
    previewUrl,
    isUploading = false,
    uploadError,
    required = false,
  }, ref) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(previewUrl || null);
    const [previewType, setPreviewType] = useState<'image' | 'document' | 'none'>('none');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(uploadError || null);

    useImperativeHandle(ref, () => ({
      uploadFile: async () => {
        if (!selectedFile) {
          return null;
        }
        try {
          setUploading(true);
          setError(null);

          const base64File = await mediaService.fileToBase64(selectedFile);
          const mediaType = mediaService.getMediaType(selectedFile);

          const response = await mediaService.uploadMedia({
            fileName: selectedFile.name,
            contentType: selectedFile.type,
            mediaType,
            containerName,
            mediaDetailDescription: `${label} - ${selectedFile.name}`,
            base64File,
            isPublic: false,
            folderPath: 'ERP'
          });

          onUploadSuccess?.(response.mediaSno, selectedFile.name);
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return response.mediaSno || null;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Upload failed';
          setError(errorMessage);
          onUploadError?.(errorMessage);
          return null;
        } finally {
          setUploading(false);
        }
      },
      hasFile: () => {
        return selectedFile !== null && !mediaSno;
      }
    }));

  const getFileIcon = (file: File | null, previewUrl?: string) => {
    if (!file && !previewUrl) return null;

    const type = file?.type || '';
    
    if (type.startsWith('image/')) {
      return 'image';
    } else if (type === 'application/pdf') {
      return 'pdf';
    } else if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
               type === 'application/msword') {
      return 'word';
    } else if (type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
               type === 'application/vnd.ms-excel') {
      return 'excel';
    }
    return 'document';
  };

  React.useEffect(() => {
    if (mediaSno && fileName) {
      setSelectedFile(null);
      setPreview(null);
      setPreviewType('document');
    }
  }, [mediaSno, fileName]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!mediaSno) {
      setSelectedFile(file);
      setError(null);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
          setPreviewType('image');
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
        setPreviewType('document');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('No file selected');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const base64File = await mediaService.fileToBase64(selectedFile);
      const mediaType = mediaService.getMediaType(selectedFile);

      const response = await mediaService.uploadMedia({
        fileName: selectedFile.name,
        contentType: selectedFile.type,
        mediaType,
        containerName,
        mediaDetailDescription: `${label} - ${selectedFile.name}`,
        base64File,
        isPublic: false,
        folderPath: 'ERP'
      });

      onUploadSuccess?.(response.mediaSno, selectedFile.name);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
    setPreviewType('none');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (mediaSno) {
      onClear?.();
    } else {
      onFileRemove?.();
    }
  };

  const renderDocumentIcon = () => {
    const fileType = getFileIcon(selectedFile);
    
    const iconClass = 'w-12 h-12 text-gray-400';
    
    if (fileType === 'pdf') {
      return <FileText className={iconClass} style={{ color: '#dc2626' }} />;
    } else if (fileType === 'word') {
      return <FileJson className={iconClass} style={{ color: '#2563eb' }} />;
    } else if (fileType === 'excel') {
      return <FileJson className={iconClass} style={{ color: '#16a34a' }} />;
    }
    return <FileText className={iconClass} />;
  };

  const displayFileName = fileName || initialFileName || selectedFile?.name || 'No file selected';

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {mediaSno || (selectedFile && previewType !== 'none') ? (
        <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
          {previewType === 'image' && preview ? (
            <div className="relative">
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-40 object-contain rounded"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {renderDocumentIcon()}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 truncate">{displayFileName}</p>
                {mediaSno && <p className="text-xs text-gray-500">Media ID: {mediaSno}</p>}
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="text-red-500 hover:text-red-700"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition bg-gray-50 ${
            mediaSno ? 'border-gray-300 cursor-not-allowed' : 'border-gray-300 hover:border-blue-400 cursor-pointer'
          }`}
          onClick={() => !mediaSno && fileInputRef.current?.click()}
        >
          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            disabled={uploading || !!mediaSno}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          />
          <p className="text-sm text-gray-600">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PNG, JPG, PDF, DOC, DOCX, XLS, XLSX
          </p>
        </div>
      )}

      {selectedFile && !mediaSno && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="w-full px-4 py-2 bg-primary text-white rounded hover:bg-blue-600 disabled:bg-gray-400 text-sm font-medium"
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}

      {uploading && (
        <p className="text-blue-500 text-sm mt-1">Uploading file...</p>
      )}
    </div>
  );
}
);

FileUploadField.displayName = 'FileUploadField';

export default FileUploadField;
