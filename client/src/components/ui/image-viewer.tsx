import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';

interface ImageViewerProps {
  src: string;
  alt?: string;
  className?: string;
  onClose?: () => void;
}

interface ImageModalProps {
  src: string;
  alt?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ src, alt, open, onOpenChange }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = alt || 'imagem';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/90 border-none">
        {/* Controls */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <div className="flex gap-1 bg-black/50 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title="Diminuir zoom"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title="Aumentar zoom"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRotate}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title="Girar"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-white hover:bg-white/20 h-8 w-8 p-0 bg-black/50 rounded-lg"
            title="Fechar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom indicator */}
        <div className="absolute top-4 left-4 z-50 bg-black/50 text-white px-2 py-1 rounded text-sm">
          {Math.round(zoom * 100)}%
        </div>

        {/* Image container */}
        <div className="flex items-center justify-center w-full h-full overflow-hidden">
          <img
            src={src}
            alt={alt}
            className="max-w-none cursor-move transition-transform duration-200"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              maxHeight: zoom <= 1 ? '90vh' : 'none',
              maxWidth: zoom <= 1 ? '90vw' : 'none'
            }}
            onDoubleClick={handleReset}
            draggable={false}
          />
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-2 rounded text-sm text-center">
          Clique duas vezes para resetar • Use os controles para navegar
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ImageViewer: React.FC<ImageViewerProps> = ({ src, alt, className, onClose }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClose = () => {
    setIsModalOpen(false);
    onClose?.();
  };

  // Se onClose foi fornecido, significa que é um modal direto
  if (onClose) {
    return (
      <div className={className} onClick={onClose}>
        <ImageModal
          src={src}
          alt={alt}
          open={true}
          onOpenChange={handleClose}
        />
      </div>
    );
  }

  return (
    <>
      <div className={`relative group ${className || ''}`}>
        <img
          src={src}
          alt={alt}
          className="max-w-full h-auto rounded-lg shadow-md cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
          onClick={() => setIsModalOpen(true)}
          loading="lazy"
        />
        
        {/* Overlay com ícone de zoom */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
          <div className="bg-white/90 rounded-full p-2">
            <ZoomIn className="h-6 w-6 text-gray-800" />
          </div>
        </div>
      </div>

      <ImageModal
        src={src}
        alt={alt}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
};