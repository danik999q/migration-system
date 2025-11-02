import React, { useEffect, useRef, useState } from 'react';
import { Document, api } from '../services/api';
import ImageViewer from './ImageViewer';
import { useToast } from './ToastProvider';
import { useTranslation } from './LanguageProvider';

interface DocumentListProps {
  personId: string;
  documents: Document[];
  loading: boolean;
  onDelete: (documentId: string) => Promise<void> | void;
  onReload: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const DocumentList: React.FC<DocumentListProps> = ({ personId, documents, loading, onDelete, onReload }) => {
  const { showToast } = useToast();
  const { t, language } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);

  const thumbnailUrlsRef = useRef<Record<string, string>>({});

  const formatFileSize = (bytes: number) => {
    if (!bytes) {
      return language === 'ru' ? '0 Б' : '0 B';
    }
    const units = language === 'ru' ? ['Б', 'КБ', 'МБ', 'ГБ'] : ['B', 'KB', 'MB', 'GB'];
    const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const value = bytes / 1024 ** exponent;
    return `${Math.round(value * 100) / 100} ${units[exponent]}`;
  };

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

    void loadThumbnails();

    return () => {
      cancelled = true;
    };
  }, [documents]);

  useEffect(
    () => () => {
      Object.values(thumbnailUrlsRef.current).forEach((url) => api.documents.revokeObjectUrl(url));
      thumbnailUrlsRef.current = {};
    },
    []
  );

  const uploadFile = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      showToast({ type: 'error', message: t('documents.fileTooLarge') });
      return;
    }

    try {
      setUploading(true);
      await api.documents.upload(personId, file);
      showToast({ type: 'success', message: t('toast.documentUploaded') });
      onReload();
    } catch (error) {
      console.error('Failed to upload document:', error);
      showToast({ type: 'error', message: t('toast.documentUploadFailed') });
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    await uploadFile(file);
    event.target.value = '';
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }
    await uploadFile(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node)) {
      return;
    }
    setDragActive(false);
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
      console.error('Failed to open preview:', error);
      showToast({ type: 'error', message: t('toast.documentPreviewFailed') });
    }
  };

  const handleClosePreview = () => {
    setPreviewImageUrl(null);
  };

  const handleDelete = async (documentId: string) => {
    try {
      await onDelete(documentId);
    } catch (error) {
      console.error('Failed to delete document:', error);
      showToast({ type: 'error', message: t('toast.documentDeleteFailed') });
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      await api.documents.download(document.id, document.originalName);
      showToast({ type: 'success', message: t('toast.documentDownloadStart') });
    } catch (error) {
      console.error('Failed to download document:', error);
      showToast({ type: 'error', message: t('toast.documentDownloadFailed') });
    }
  };

  if (loading) {
    return (
      <div className="empty-state" style={{ padding: '48px 32px' }}>
        <div className="spinner" />
        <h3>{t('documents.loadingTitle')}</h3>
        <p>{t('documents.loadingMessage')}</p>
      </div>
    );
  }

  return (
    <div className="documents-section">
      <section
        className={`document-upload${dragActive ? ' document-upload--drag' : ''}`}
        aria-label={t('documents.sectionTitle')}
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div>
          <p className="document-upload__title">{t('documents.sectionTitle')}</p>
          <p className="document-upload__subtitle">{t('documents.sectionSubtitle')}</p>
        </div>
        <label className="document-upload__control">
          <span className="btn btn-secondary">{t('documents.button')}</span>
          <input
            type="file"
            onChange={handleFileInputChange}
            disabled={uploading}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
        </label>
        <p className="document-upload__hint">
          {t('documents.hint')}
          {uploading ? t('documents.uploading') : ''}
        </p>
      </section>

      {documents.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '3.3rem', marginBottom: '16px' }}>📂</div>
          <h3>{t('documents.emptyTitle')}</h3>
          <p>{t('documents.emptyMessage')}</p>
        </div>
      ) : (
        <div className="documents-list">
          {documents.map((document) => {
            const showPreview = api.documents.isImage(document.mimeType);
            const previewUrl = thumbnailUrls[document.id];

            return (
              <article className="document-card" key={document.id}>
                {showPreview && previewUrl && (
                  <button
                    type="button"
                    className="document-card__thumbnail"
                    onClick={() => void handlePreview(document)}
                  >
                    <img src={previewUrl} alt={document.originalName} loading="lazy" />
                  </button>
                )}

                <div className="document-card__content">
                  <h4 className="document-card__title">{document.originalName}</h4>
                  <p className="document-card__meta">
                    {formatFileSize(document.size)} ·{' '}
                    {new Date(document.uploadedAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-GB')}
                  </p>

                  <div className="document-card__actions">
                    {showPreview && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => void handlePreview(document)}
                      >
                        {t('documents.open')}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => void handleDownload(document)}
                    >
                      {t('documents.download')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => void handleDelete(document.id)}
                    >
                      {t('documents.delete')}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {previewImageUrl && <ImageViewer imageUrl={previewImageUrl} onClose={handleClosePreview} />}
    </div>
  );
};

export default DocumentList;

