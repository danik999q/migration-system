import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ImageViewerProps {
  imageUrl: string;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl, onClose }) => {
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
          width = width * ratio;
          height = height * ratio;
        }
        
        setDimensions({ width, height });
        setImageLoaded(true);
      };
      img.onerror = () => {
        alert('Ошибка загрузки изображения');
        onClose();
      };
      img.src = imageUrl;
    };

    preloadImage();
  }, [imageUrl, onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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
          width = width * ratio;
          height = height * ratio;
        }
        
        setDimensions({ width, height });
      }
    };

    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleResize);

    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = '';
    };
  }, [dimensions]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current || e.target === containerRef.current) {
      handleClose();
    }
  };

  const preventDefault = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  if (!imageLoaded || !dimensions) {
    return createPortal(
      <div
        ref={overlayRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          cursor: 'wait',
        }}
        onClick={preventDefault}
        onMouseDown={preventDefault}
        onMouseMove={preventDefault}
        onMouseUp={preventDefault}
        onMouseEnter={preventDefault}
        onMouseLeave={preventDefault}
        onWheel={preventDefault}
      >
        <div
          style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: 500,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              border: '4px solid rgba(255,255,255,0.3)',
              borderTopColor: 'white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <div>Загрузка изображения...</div>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        overflow: 'hidden',
        cursor: 'zoom-out',
        opacity: isClosing ? 0 : 1,
        transition: 'opacity 0.2s ease-out',
      }}
      onMouseDown={(e) => {
        if (e.target !== imageRef.current && e.target !== containerRef.current) {
          e.stopPropagation();
        }
      }}
      onMouseMove={(e) => {
        if (e.target !== imageRef.current && e.target !== containerRef.current) {
          e.stopPropagation();
        }
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          maxWidth: '100%',
          maxHeight: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: 'none',
            fontSize: '28px',
            zIndex: 10001,
            color: '#333',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.transform = 'scale(1.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ×
        </button>
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Просмотр"
          style={{
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            maxWidth: '95vw',
            maxHeight: '95vh',
            objectFit: 'contain',
            borderRadius: '12px',
            boxShadow: '0 25px 80px rgba(0,0,0,0.7)',
            cursor: 'zoom-out',
            userSelect: 'none',
            pointerEvents: 'auto',
            opacity: isClosing ? 0 : 1,
            transform: isClosing ? 'scale(0.95)' : 'scale(1)',
            transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
          }}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default ImageViewer;

