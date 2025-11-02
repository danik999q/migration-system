import React, { useEffect, useRef, useState } from 'react';
import { Document, api } from '../services/api';
import ImageViewer from './ImageViewer';

interface DocumentListProps {
  personId: string;
  documents: Document[];
  loading: boolean;
  onDelete: (documentId: string) => Promise<void> | void;
  onReload: () => void;
}

const formatFileSize = (bytes: number) => {
  if (!bytes) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, index);
  return `${Math.round(value * 100) / 100} ${units[index]}`;
};


const DocumentList: React.FC<DocumentListProps> = ({ personId, documents, loading, onDelete, onReload }) => {
  const [uploading, setUploading] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});

  const thumbnailUrlsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    Object.values(thumbnailUrlsRef.current).forEach((url) => api.documents.revokeObjectUrl(url));
    thumbnailUrlsRef.current = {};
    setThumbnailUrls({});

    const loadThumbnails = async () => {
      const urls: Record<string, string> = {};

      for (const document of documents) {
        if (!api.documents.isImage(document.mimeType)) {
          continue;
        }

        try {
          const previewUrl = await api.documents.getPreviewUrl(document.id);
          if (cancelled) {
            api.documents.revokeObjectUrl(previewUrl);
            return;
          }
          urls[document.id] = previewUrl;
        } catch (error) {
          console.error(`Failed to load preview for document ${document.id}:`, error);
        }
      }

      if (!cancelled) {
        thumbnailUrlsRef.current = urls;
        setThumbnailUrls(urls);
      } else {
        Object.values(urls).forEach((url) => api.documents.revokeObjectUrl(url));
      }
    };

    loadThumbnails();

    return () => {
      cancelled = true;
    };
  }, [documents]);

  useEffect(
    () => () => {
      Object.values(thumbnailUrlsRef.current).forEach((url) => api.documents.revokeObjectUrl(url));
      thumbnailUrlsRef.current = {};
    },
    [],
  );

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setUploading(true);
      await api.documents.upload(personId, file);
      onReload();
      event.target.value = '';
    } catch (error) {
      console.error('Failed to upload document:', error);
      alert('Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = async (document: Document) => {
    if (!api.documents.isImage(document.mimeType)) {
      return;
    }

    try {
      let url = thumbnailUrlsRef.current[document.id];
      if (!url) {
        url = await api.documents.getPreviewUrl(document.id);
        thumbnailUrlsRef.current[document.id] = url;
        setThumbnailUrls((prev) => ({ ...prev, [document.id]: url }));
      }
      setPreviewImageUrl(url);
    } catch (error) {
      console.error('Failed to open document preview:', error);
      alert('Ошибка открытия изображения');
    }
  };

  const handleClosePreview = () => {
    setPreviewImageUrl(null);
  };

  const handleDelete = async (documentId: string) => {
    if (!window.confirm('Delete this document?')) {
      return;
    }

    const previewUrl = thumbnailUrlsRef.current[documentId];
    if (previewUrl) {
      api.documents.revokeObjectUrl(previewUrl);
      delete thumbnailUrlsRef.current[documentId];
      setThumbnailUrls((prev) => {
        const { [documentId]: _removed, ...rest } = prev;
        return rest;
      });
    }

    if (previewImageUrl && previewImageUrl === previewUrl) {
      handleClosePreview();
    }

    try {
      await onDelete(documentId);
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '40px',
          color: '#6b7280',
          fontSize: '15px',
          fontWeight: 500,
        }}
      >
        Loading documents...
      </div>
    );
  }

  return (
    <div>
      <div className="file-upload">
        <label
          style={{
            display: 'block',
            marginBottom: '16px',
            fontWeight: 600,
            fontSize: '15px',
            color: '#374151',
          }}
        >
          Upload a document
        </label>
        <input
          type="file"
          onChange={handleFileUpload}
          disabled={uploading}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          style={{
            padding: '12px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        />
        {uploading && (
          <p
            style={{
              marginTop: '16px',
              color: '#6366f1',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Uploading...
          </p>
        )}
      </div>

      {documents.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            color: '#9ca3af',
            marginTop: '32px',
            padding: '32px',
            background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
            borderRadius: '16px',
            border: '2px dashed #d1d5db',
          }}
        >
          <p style={{ fontSize: '15px', fontWeight: 500 }}>No documents uploaded yet</p>
          <p style={{ fontSize: '13px', marginTop: '8px', color: '#6b7280' }}>
            Drag and drop files or use the button above.
          </p>
        </div>
      ) : (
        <div style={{ marginTop: '20px' }}>
          {documents.map((document) => {
            const showPreview = api.documents.isImage(document.mimeType);
            const previewUrl = thumbnailUrls[document.id];

            return (
              <div
                key={document.id}
                style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}
              >
                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                  {showPreview && previewUrl && (
                    <div style={{ flexShrink: 0 }}>
                      <img
                        src={previewUrl}
                        alt={document.originalName}
                        style={{
                          width: '150px',
                          height: '150px',
                          objectFit: 'cover',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          border: '2px solid #ddd',
                        }}
                        onClick={() => void handlePreview(document)}
                        onError={(event) => {
                          (event.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, marginBottom: '5px' }}>{document.originalName}</div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                      {formatFileSize(document.size)} · {new Date(document.uploadedAt).toLocaleDateString()}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {showPreview && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '5px 15px', fontSize: '12px' }}
                          onClick={() => void handlePreview(document)}
                        >
                          View
                        </button>
                      )}
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '5px 15px', fontSize: '12px' }}
                        onClick={async () => {
                          try {
                            await api.documents.download(document.id, document.originalName);
                          } catch (error) {
                            console.error('Failed to download document:', error);
                            alert('Failed to download document.');
                          }
                        }}
                      >
                        Download
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '5px 15px', fontSize: '12px' }}
                        onClick={() => void handleDelete(document.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewImageUrl && (
        <ImageViewer
          imageUrl={previewImageUrl}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
};

export default DocumentList;
