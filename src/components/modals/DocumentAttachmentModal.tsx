import React, { useState, useEffect, useRef, useCallback } from 'react';
import mediaUploadService, {
  MediaDetailResponse,
  MediaUploadRequest,
} from '@/services/MediaUploadService';
import { toast } from 'react-toastify';
import {
  X,
  Upload,
  FileText,
  FileSpreadsheet,
  File,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Plus,
  RefreshCw
} from 'lucide-react';

interface DocumentAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  containerName: string;
  title?: string;
  onFilesUpdated?: (count: number) => void;
}

interface PendingFile {
  id: string;
  file: File;
  description: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

export const DocumentAttachmentModal: React.FC<DocumentAttachmentModalProps> = ({
  isOpen,
  onClose,
  containerName,
  title = 'Document Attachments',
  onFilesUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'view' | 'upload'>('view');
  const [uploadedFiles, setUploadedFiles] = useState<MediaDetailResponse[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Store onFilesUpdated in ref to avoid re-triggering fetchUploadedFiles on parent re-renders
  const onFilesUpdatedRef = useRef(onFilesUpdated);
  useEffect(() => {
    onFilesUpdatedRef.current = onFilesUpdated;
  }, [onFilesUpdated]);

  const fetchUploadedFiles = useCallback(async () => {
    if (!containerName) return;
    setLoadingFiles(true);
    try {
      const response = await mediaUploadService.getMediaByContainer(containerName);
      const details = response?.mediaDetails || [];
      setUploadedFiles(details);
      onFilesUpdatedRef.current?.(details.length);

      if (details.length === 0) {
        setActiveTab('upload');
      } else {
        setActiveTab('view');
      }
    } catch (error) {
      console.error('Error loading attachments:', error);
      setUploadedFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  }, [containerName]);

  useEffect(() => {
    if (isOpen && containerName) {
      setPendingFiles([]);
      fetchUploadedFiles();
    }
  }, [isOpen, containerName, fetchUploadedFiles]);

  if (!isOpen) return null;

  const addFilesToPending = (files: File[]) => {
    if (!files || files.length === 0) return;

    const validFiles: PendingFile[] = [];
    for (const file of files) {
      if (!mediaUploadService.validateFileSize(file, 100)) {
        toast.error(`File "${file.name}" exceeds 100MB size limit.`);
        continue;
      }
      validFiles.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        description: '',
        progress: 0,
        status: 'pending',
      });
    }

    if (validFiles.length > 0) {
      setPendingFiles((prev) => [...prev, ...validFiles]);
      setActiveTab('upload');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToPending(Array.from(e.target.files));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToPending(Array.from(e.dataTransfer.files));
    }
  };

  const handleRemovePending = (id: string) => {
    setPendingFiles((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDescriptionChange = (id: string, description: string) => {
    setPendingFiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, description } : p))
    );
  };

  const handleUploadAll = async () => {
    const toUpload = pendingFiles.filter((p) => p.status === 'pending' || p.status === 'error');
    if (toUpload.length === 0) {
      toast.warning('Please select files to upload');
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    const currentUploaded = [...uploadedFiles];

    for (const pendingItem of toUpload) {
      setPendingFiles((prev) =>
        prev.map((p) => (p.id === pendingItem.id ? { ...p, status: 'uploading', progress: 50 } : p))
      );

      try {
        const base64File = await mediaUploadService.fileToBase64(pendingItem.file);
        const mediaType = mediaUploadService.getMediaType(pendingItem.file);
        const contentType = mediaUploadService.getMimeType(pendingItem.file);

        const request: MediaUploadRequest = {
          base64File,
          fileName: pendingItem.file.name,
          contentType,
          mediaType,
          containerName,
          mediaDetailDescription: pendingItem.description,
        };

        const response = await mediaUploadService.uploadMedia(request);

        setPendingFiles((prev) =>
          prev.map((p) => (p.id === pendingItem.id ? { ...p, status: 'success', progress: 100 } : p))
        );

        currentUploaded.push(response);
        setUploadedFiles([...currentUploaded]);
        successCount++;
      } catch (error: any) {
        console.error(`Upload error for ${pendingItem.file.name}:`, error);
        setPendingFiles((prev) =>
          prev.map((p) =>
            p.id === pendingItem.id
              ? { ...p, status: 'error', errorMessage: error?.message || 'Upload failed' }
              : p
          )
        );
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} file(s)`);
      onFilesUpdatedRef.current?.(currentUploaded.length);
      setTimeout(() => {
        setPendingFiles((prev) => prev.filter((p) => p.status !== 'success'));
        setActiveTab('view');
      }, 800);
    }
  };

  const handleDeleteFile = async (mediaDetailSno: number, fileName: string) => {
    if (!window.confirm(`Are you sure you want to delete file "${fileName}"?`)) return;

    try {
      await mediaUploadService.softDeleteMedia(mediaDetailSno);
      toast.info(`Deleted "${fileName}"`);
      const remaining = uploadedFiles.filter((f) => f.mediaDetailSno !== mediaDetailSno);
      setUploadedFiles(remaining);
      onFilesUpdatedRef.current?.(remaining.length);
    } catch (error) {
      toast.error('Failed to delete file');
      console.error(error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileBadge = (filename: string = '', contentType: string = '') => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf' || contentType.includes('pdf')) {
      return {
        icon: <FileText className="w-6 h-6 text-red-500" />,
        bg: 'bg-red-50 text-red-700 border-red-200',
        label: 'PDF',
      };
    }
    if (['xls', 'xlsx', 'csv'].includes(ext) || contentType.includes('excel') || contentType.includes('csv') || contentType.includes('spreadsheet')) {
      return {
        icon: <FileSpreadsheet className="w-6 h-6 text-emerald-600" />,
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        label: ext.toUpperCase() || 'EXCEL',
      };
    }
    if (['doc', 'docx'].includes(ext) || contentType.includes('word')) {
      return {
        icon: <FileText className="w-6 h-6 text-blue-600" />,
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        label: 'WORD',
      };
    }
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext) || contentType.startsWith('image/')) {
      return {
        icon: <ImageIcon className="w-6 h-6 text-purple-600" />,
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        label: 'IMAGE',
      };
    }
    return {
      icon: <File className="w-6 h-6 text-gray-500" />,
      bg: 'bg-gray-50 text-gray-700 border-gray-200',
      label: ext.toUpperCase() || 'FILE',
    };
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-wide text-white">{title}</h2>
              <p className="text-xs text-slate-400 font-mono">Container: {containerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6 pt-3 space-x-4">
          <button
            onClick={() => setActiveTab('view')}
            className={`pb-3 text-sm font-medium border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'view'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>Uploaded Files</span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-200 text-slate-700">
              {uploadedFiles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 text-sm font-medium border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Files</span>
            {pendingFiles.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                {pendingFiles.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'view' && (
            <div>
              {loadingFiles ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
                  <p className="text-sm font-medium">Fetching attached files...</p>
                </div>
              ) : uploadedFiles.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-slate-50/50">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3">
                    <File className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800">No attached files yet</h3>
                  <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                    Upload documents, PDFs, spreadsheets, or images related to this order.
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition inline-flex items-center space-x-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add File Now</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {uploadedFiles.map((file) => {
                    const badge = getFileBadge(file.originalFileName, file.contentType);
                    return (
                      <div
                        key={file.mediaDetailSno}
                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition group"
                      >
                        <div className="flex items-center space-x-4 min-w-0 flex-1 pr-4">
                          <div className="p-2.5 rounded-lg border border-gray-100 bg-slate-50 flex-shrink-0">
                            {badge.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-semibold text-gray-800 truncate" title={file.originalFileName}>
                                {file.originalFileName}
                              </h4>
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${badge.bg}`}>
                                {badge.label}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                              <span>{formatBytes(file.mediaSize)}</span>
                              <span>•</span>
                              <span>{file.createdAt ? new Date(file.createdAt).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            {file.mediaDetailDescription && (
                              <p className="text-xs text-gray-600 mt-1 italic line-clamp-1">
                                "{file.mediaDetailDescription}"
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {file.mediaUrl && (
                            <a
                              href={file.mediaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>View / Download</span>
                            </a>
                          )}

                          <button
                            onClick={() => handleDeleteFile(file.mediaDetailSno, file.originalFileName)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-6">
              {/* Dropzone with full drag & drop support */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center group ${
                  isDragging
                    ? 'border-blue-600 bg-blue-100/80 scale-[1.01]'
                    : 'border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/*"
                />
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">
                  Click or drag & drop files here to attach
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Supports PDF, Word, Excel, CSV, Text, and Images (Max 100MB per file)
                </p>
              </div>

              {/* Pending Files List */}
              {pendingFiles.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Selected Files Ready for Upload ({pendingFiles.length})
                  </h4>

                  {pendingFiles.map((p) => {
                    const badge = getFileBadge(p.file.name, p.file.type);
                    return (
                      <div
                        key={p.id}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            {badge.icon}
                            <div className="min-w-0 flex-1">
                              <h5 className="text-sm font-semibold text-gray-800 truncate">
                                {p.file.name}
                              </h5>
                              <span className="text-xs text-gray-500">
                                {formatBytes(p.file.size)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {p.status === 'success' && (
                              <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Done
                              </span>
                            )}
                            {p.status === 'error' && (
                              <span className="flex items-center text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
                                <AlertCircle className="w-3.5 h-3.5 mr-1" /> Error
                              </span>
                            )}
                            {p.status === 'pending' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemovePending(p.id);
                                }}
                                disabled={isUploading}
                                className="p-1 text-gray-400 hover:text-red-500 transition"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {p.status === 'pending' && (
                          <input
                            type="text"
                            placeholder="Add optional description/notes for this document..."
                            value={p.description}
                            onChange={(e) => handleDescriptionChange(p.id, e.target.value)}
                            disabled={isUploading}
                            className="w-full text-xs px-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        )}

                        {p.status === 'uploading' && (
                          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-blue-600 h-1.5 rounded-full animate-pulse w-3/4" />
                          </div>
                        )}

                        {p.errorMessage && (
                          <p className="text-xs text-red-600 font-medium">{p.errorMessage}</p>
                        )}
                      </div>
                    );
                  })}

                  <div className="pt-2 flex justify-end space-x-3">
                    <button
                      onClick={() => setPendingFiles([])}
                      disabled={isUploading}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition"
                    >
                      Clear Selected
                    </button>
                    <button
                      onClick={handleUploadAll}
                      disabled={isUploading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition flex items-center space-x-2 shadow-sm disabled:opacity-50"
                    >
                      {isUploading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Start Upload ({pendingFiles.length})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
