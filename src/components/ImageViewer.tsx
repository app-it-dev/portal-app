'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import type { ImageItem } from '@/types';

interface ImageViewerProps {
  images: ImageItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onImageUpdate: (index: number, updates: Partial<ImageItem>) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

export function ImageViewer({ images, currentIndex, isOpen, onClose, onImageUpdate, onReorder }: ImageViewerProps) {
  const [currentIdx, setCurrentIdx] = useState(currentIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    setCurrentIdx(currentIndex);
  }, [currentIndex]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        goToPrevious();
        break;
      case 'ArrowRight':
        e.preventDefault();
        goToNext();
        break;
      case '+':
      case '=':
        e.preventDefault();
        setZoom(prev => Math.min(prev + 0.25, 3));
        break;
      case '-':
        e.preventDefault();
        setZoom(prev => Math.max(prev - 0.25, 0.25));
        break;
      case 'r':
        e.preventDefault();
        setRotation(prev => (prev + 90) % 360);
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const goToPrevious = () => {
    if (images.length === 0) return;
    setCurrentIdx(prev => (prev - 1 + images.length) % images.length);
    setZoom(1);
    setRotation(0);
  };

  const goToNext = () => {
    if (images.length === 0) return;
    setCurrentIdx(prev => (prev + 1) % images.length);
    setZoom(1);
    setRotation(0);
  };

  const handleKeepToggle = () => {
    if (currentImage && images[currentIdx]) {
      onImageUpdate(currentIdx, { keep: !images[currentIdx].keep });
    }
  };

  const handleMainToggle = () => {
    if (currentImage && images[currentIdx]) {
      onImageUpdate(currentIdx, { isMain: !images[currentIdx].isMain });
    }
  };

  // Drag and drop handlers for reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (index < 0 || index >= images.length || !images[index]) return;
    
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/html'));
    
    if (dragIndex === dropIndex || !onReorder || 
        dragIndex < 0 || dragIndex >= images.length || 
        dropIndex < 0 || dropIndex >= images.length) {
      setDraggedIndex(null);
      return;
    }
    
    onReorder(dragIndex, dropIndex);
    setDraggedIndex(null);
  };

  if (!isOpen || images.length === 0) return null;

  // Ensure currentIdx is within bounds
  const validCurrentIdx = Math.max(0, Math.min(currentIdx, images.length - 1));
  const currentImage = images[validCurrentIdx];

  // If currentImage is still undefined, return null
  if (!currentImage) return null;

  // Update currentIdx if it was out of bounds
  if (validCurrentIdx !== currentIdx) {
    setCurrentIdx(validCurrentIdx);
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4 text-white">
            <span className="text-sm font-medium">
              {currentIdx + 1} of {images.length}
            </span>
            {currentImage.caption && (
              <span className="text-sm text-gray-300 truncate max-w-md">
                {currentImage.caption}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleKeepToggle}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                currentImage.keep
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-600 text-white hover:bg-gray-500'
              }`}
            >
              {currentImage.keep ? 'Keep' : 'Keep'}
            </button>
            
            <button
              onClick={handleMainToggle}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                currentImage.isMain
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-white hover:bg-gray-500'
              }`}
            >
              {currentImage.isMain ? 'Main' : 'Set Main'}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Image Container */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="relative max-w-full max-h-full">
          <img
            src={currentImage.url}
            alt={currentImage.caption || `Image ${currentIdx + 1}`}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = '<div class="flex items-center justify-center h-64 w-64 text-white text-lg">Failed to load image</div>';
              }
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/50 to-transparent">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.25))}
              className="p-2 text-white hover:bg-white/20 rounded transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            
            <span className="text-white text-sm min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            
            <button
              onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
              className="p-2 text-white hover:bg-white/20 rounded transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="p-2 text-white hover:bg-white/20 rounded transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Thumbnail Strip */}
          <div className="flex items-center gap-2 max-w-md overflow-x-auto">
            {images.map((img, index) => (
              <button
                key={index}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onClick={() => {
                  if (index >= 0 && index < images.length && images[index]) {
                    setCurrentIdx(index);
                    setZoom(1);
                    setRotation(0);
                  }
                }}
                className={`flex-shrink-0 w-12 h-12 rounded border-2 transition-all cursor-move ${
                  index === currentIdx
                    ? 'border-blue-500'
                    : draggedIndex === index
                    ? 'border-yellow-400 opacity-50'
                    : 'border-gray-600 hover:border-gray-400'
                }`}
                title="Drag to reorder images"
              >
                <img
                  src={img.url}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover rounded"
                />
                {/* Drag indicator */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div className="bg-black/50 text-white text-xs px-1 py-0.5 rounded">
                    ⋮⋮
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
