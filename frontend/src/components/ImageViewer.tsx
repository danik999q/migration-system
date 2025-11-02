import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from './ToastProvider';
import { useTranslation } from './LanguageProvider';

interface ImageViewerProps {
  imageUrl: string;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl, onClose }) => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const preloadImage = () => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = window.innerWidth * 0.95;
        const maxHeight = window.innerHeight * 0.95;

        let width = img.naturalWidth;
        let height = img.naturalHeight;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        setDimensions({ width, height });
        setImageLoaded(true);
      };
      img.onerror = () => {
        showToast({ type: 'error', message: t('toast.imagePreviewFailed') });
        onClose();
      };
      img.src = imageUrl;
    };

    preloadImage();
  }, [imageUrl, onClose, showToast, t]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    const handleResize = () => {
      if (dimensions && imageRef.current) {
        const img = imageRef.current;
        const maxWidth = window.innerWidth * 0.95;
        const maxHeight = window.innerHeight * 0.95;

        let width = img.naturalWidth;
        let height = img.naturalHeight;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        setDimensions({ width, height });
      }
    };

    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleResize);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = previousOverflow;
    };
  }, [dimensions]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === overlayRef.current || event.target === containerRef.current) {
      handleClose();
    }
  };

  const preventDefault = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  if (!imageLoaded || !dimensions) {
    return createPortal(
      <div
        ref={overlayRef}
        className="image-viewer image-viewer--loading"
        onClick={preventDefault}
        onMouseDown={preventDefault}
        onMouseMove={preventDefault}
        onMouseUp={preventDefault}
        onMouseEnter={preventDefault}
        onMouseLeave={preventDefault}
        onWheel={preventDefault}
      >
        <div className="image-viewer__spinner-text">{t('documents.imageLoading')}</div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div
      ref={overlayRef}
      className={`image-viewer${isClosing ? ' image-viewer--closing' : ''}`}
      onClick={handleOverlayClick}
      onMouseDown={(event) => {
        if (event.target !== imageRef.current && event.target !== containerRef.current) {
          event.stopPropagation();
        }
      }}
      onMouseMove={(event) => {
        if (event.target !== imageRef.current && event.target !== containerRef.current) {
          event.stopPropagation();
        }
      }}
    >
      <div
        ref={containerRef}
        className="image-viewer__container"
        onClick={(event) => {
          event.stopPropagation();
          handleClose();
        }}
      >
        <button
          type="button"
          className="image-viewer__close"
          onClick={(event) => {
            event.stopPropagation();
            handleClose();
          }}
          aria-label={t('forms.cancel')}
        >
          ×
        </button>
        <img
          ref={imageRef}
          src={imageUrl}
          alt={t('documents.previewAlt')}
          className="image-viewer__image"
          style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
          draggable={false}
          onDragStart={(event) => event.preventDefault()}
          onContextMenu={(event) => event.preventDefault()}
        />
      </div>
    </div>,
    document.body,
  );
};

export default ImageViewer;

