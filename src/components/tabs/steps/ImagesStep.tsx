'use client';

import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { CheckCircle, Image as ImageIcon, Plus, ArrowLeft, Upload, X, Wifi, WifiOff } from 'lucide-react';
import type { PostRow, ImageItem } from '@/types';
import { PasteImagesModal } from '../../PasteImagesModal';
import { LocalImageUpload } from '../../LocalImageUpload';
import { ImageViewer } from '../../ImageViewer';
import { useSupabaseStore as useStore } from '@/store/supabase-store';

// Memoized image component for better performance
const ImageCard = memo(({ 
  image, 
  index, 
  totalImages, 
  onUpdate, 
  onRemove, 
  onSetMain, 
  onView,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
  draggedIndex
}: {
  image: ImageItem;
  index: number;
  totalImages: number;
  onUpdate: (index: number, updates: Partial<ImageItem>) => void;
  onRemove: (index: number) => void;
  onSetMain: (index: number) => void;
  onView: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  draggedIndex: number | null;
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  
  return (
    <div 
      className={`relative group transition-all duration-200 ${
        draggedIndex === index ? 'opacity-50 scale-95' : ''
      } ${isDragOver ? 'ring-4 ring-blue-400 rounded-2xl' : ''}`}
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        onDragStart(e, index);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
        onDragOver(e);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        onDrop(e, index);
      }}
      onDragEnd={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
      }}
    >
      {/* Image Container */}
      <div 
        className="aspect-[4/3] bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-all duration-300 relative shadow-lg hover:shadow-xl"
        onClick={() => onView(index)}
      >
        <img
          src={image.url}
          alt={`Vehicle image ${index + 1}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = '<div class="flex items-center justify-center h-full text-slate-400"><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
            }
          }}
        />
        
        {/* Gradient Overlay for better icon visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Keep Icon - Top Left */}
        <div className="absolute top-3 left-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate(index, { keep: !image.keep });
            }}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
              image.keep
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-white/80 text-slate-500 hover:bg-white shadow-sm backdrop-blur-sm'
            }`}
          >
            {image.keep ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Main Icon - Top Right */}
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSetMain(index);
            }}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
              image.isMain
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white/80 text-slate-500 hover:bg-white shadow-sm backdrop-blur-sm'
            }`}
          >
            {image.isMain ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Remove Icon - Bottom Right */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
            className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-md transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Main Badge - Bottom Left */}
        {image.isMain && (
          <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <span className="bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded-lg shadow-md">
              ⭐ Main
            </span>
          </div>
        )}
        
        {/* Image Counter */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <span className="bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm">
            {index + 1} of {totalImages}
          </span>
        </div>

        {/* Reorder Controls */}
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp(index);
            }}
            disabled={index === 0}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
              index === 0 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-white/90 text-slate-600 hover:bg-white shadow-sm'
            }`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown(index);
            }}
            disabled={index === totalImages - 1}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
              index === totalImages - 1 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-white/90 text-slate-600 hover:bg-white shadow-sm'
            }`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Drag Handle */}
        <div className="absolute top-3 right-1/2 transform translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <div className="bg-white/90 text-slate-600 px-2 py-1 rounded-lg shadow-sm text-xs font-medium">
            ⋮⋮ Drag to reorder
          </div>
        </div>
      </div>
    </div>
  );
});

ImageCard.displayName = 'ImageCard';

interface ImagesStepProps {
  post: PostRow;
  onAccept: () => void;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}

export function ImagesStep({ post, onAccept, onNext, onBack, canProceed }: ImagesStepProps) {
  const [showPasteImagesModal, setShowPasteImagesModal] = useState(false);
  const [showLocalUpload, setShowLocalUpload] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { setImages, isOnline } = useStore();
  const images = (post.images || []).filter(img => img != null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // Remove the problematic useEffect that was causing infinite loop

  // Optimized image update function with immediate UI feedback and real-time sync
  const updateImage = useCallback(async (index: number, updates: Partial<ImageItem>) => {
    if (index < 0 || index >= images.length || !images[index]) return;
    
    // Create updated images array
    const updatedImages = images.map((img, idx) => 
      idx === index ? { ...img, ...updates } : img
    );
    
    // Update database immediately with real-time sync
    try {
      await setImages(post.id, updatedImages);
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error('Failed to update image:', error);
    }
  }, [images, post.id, setImages]);

  // Optimized image removal with immediate UI feedback and real-time sync
  const removeImage = useCallback(async (index: number) => {
    if (index < 0 || index >= images.length) return;
    
    // Create filtered images array
    const updatedImages = images.filter((_, idx) => idx !== index);
    
    // Update database immediately with real-time sync
    try {
      await setImages(post.id, updatedImages);
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error('Failed to remove image:', error);
    }
  }, [images, post.id, setImages]);

  // Move image up in order with real-time sync
  const moveImageUp = useCallback(async (index: number) => {
    if (index <= 0 || index >= images.length) return;
    const updatedImages = [...images];
    [updatedImages[index - 1], updatedImages[index]] = [updatedImages[index], updatedImages[index - 1]];
    try {
      await setImages(post.id, updatedImages);
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error('Failed to move image up:', error);
    }
  }, [images, post.id, setImages]);

  // Move image down in order with real-time sync
  const moveImageDown = useCallback(async (index: number) => {
    if (index < 0 || index >= images.length - 1) return;
    const updatedImages = [...images];
    [updatedImages[index], updatedImages[index + 1]] = [updatedImages[index + 1], updatedImages[index]];
    try {
      await setImages(post.id, updatedImages);
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error('Failed to move image down:', error);
    }
  }, [images, post.id, setImages]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (index < 0 || index >= images.length || !images[index]) return;
    
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
    e.dataTransfer.setData('application/json', JSON.stringify(images[index]));
  }, [images]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const dragIndex = parseInt(e.dataTransfer.getData('text/html'));
    
    if (isNaN(dragIndex) || dragIndex === dropIndex || dragIndex < 0 || dragIndex >= images.length || dropIndex < 0 || dropIndex >= images.length) {
      setDraggedIndex(null);
      return;
    }
    
    // Simple reorder logic
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(dragIndex, 1);
    updatedImages.splice(dropIndex, 0, movedImage);
    
    try {
      await setImages(post.id, updatedImages);
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error('Failed to reorder images:', error);
    }
    setDraggedIndex(null);
  }, [images, post.id, setImages]);

  // Reorder handler for ImageViewer with real-time sync
  const handleReorder = useCallback(async (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex >= images.length || toIndex < 0 || toIndex >= images.length || fromIndex === toIndex) return;
    
    // Simple reorder logic
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    
    try {
      await setImages(post.id, updatedImages);
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error('Failed to reorder images:', error);
    }
  }, [images, post.id, setImages]);

  const handleLocalImagesAdded = useCallback(async (newImages: { url: string; caption?: string; keep: boolean; isMain: boolean }[]) => {
    const imageItems: ImageItem[] = newImages.map(img => ({
      url: img.url,
      keep: img.keep,
      isMain: img.isMain,
      caption: img.caption,
    }));

    // Merge with existing images and deduplicate
    const existingUrls = new Set(images.map(img => img.url.toLowerCase()));
    const uniqueNewImages = imageItems.filter(img => !existingUrls.has(img.url.toLowerCase()));
    
    const allImages = [...images, ...uniqueNewImages];
    
    // Ensure exactly one main image
    const mainImages = allImages.filter(img => img.isMain);
    if (mainImages.length === 0 && allImages.length > 0) {
      allImages[0].isMain = true;
    } else if (mainImages.length > 1) {
      // Keep only the first main image
      let foundMain = false;
      allImages.forEach(img => {
        if (img.isMain && !foundMain) {
          foundMain = true;
        } else if (img.isMain) {
          img.isMain = false;
        }
      });
    }

    try {
      await setImages(post.id, allImages);
      setLastUpdateTime(new Date());
    } catch (error) {
      console.error('Failed to add images:', error);
    }
    setShowLocalUpload(false);
  }, [images, post.id, setImages]);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="section-padding py-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Step 3: Images</h3>
            <p className="text-sm text-slate-600 mt-1">
              Review and manage vehicle images
            </p>
            {/* Real-time status indicator */}
            <div className="flex items-center gap-2 mt-2">
              {isOnline ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi className="w-3 h-3" />
                  <span className="text-xs">Live sync active</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-600">
                  <WifiOff className="w-3 h-3" />
                  <span className="text-xs">Offline mode</span>
                </div>
              )}
              {lastUpdateTime && (
                <span className="text-xs text-slate-500">
                  Last updated: {lastUpdateTime.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          {canProceed && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Images ready</span>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="btn btn-secondary btn-sm flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back: Details
            </button>
            <div className="text-sm text-slate-600">
              {images.length > 0 ? (
                <span className="text-green-600">✓ {images.length} images found</span>
              ) : (
                <span>No images detected</span>
              )}
            </div>
          </div>
          <button
            onClick={onNext}
            disabled={!canProceed}
            className="btn btn-primary btn-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Next: Pricing
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col">
        {images.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No images found</h3>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Images will be automatically detected from the listing, or you can add them manually
              </p>
              <div className="space-y-3">
                <button 
                  onClick={() => setShowLocalUpload(true)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Upload from Device
                </button>
                <button 
                  onClick={() => setShowPasteImagesModal(true)}
                  className="w-full bg-white hover:bg-slate-50 text-slate-700 font-medium px-6 py-3 rounded-xl border border-slate-200 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Image URLs
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Image Summary */}
            <div className="section-padding py-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-900">{images.length}</div>
                    <div className="text-sm font-medium text-slate-600">Total Images</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{images.filter(img => img && img.keep).length}</div>
                    <div className="text-sm font-medium text-slate-600">Selected</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{images.filter(img => img && img.isMain).length}</div>
                    <div className="text-sm font-medium text-slate-600">Main</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowLocalUpload(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Upload className="w-4 h-4" />
                    Add More
                  </button>
                </div>
              </div>
            </div>
            
            <div className="section-padding py-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {images.map((image, index) => (
                  <ImageCard
                    key={`${image.url}-${index}`}
                    image={image}
                    index={index}
                    totalImages={images.length}
                    onUpdate={updateImage}
                    onRemove={removeImage}
                    onSetMain={(idx) => {
                      const newMainState = !images[idx].isMain;
                      const updatedImages = images.map((img, i) => ({
                        ...img,
                        isMain: i === idx ? newMainState : false
                      }));
                      setImages(post.id, updatedImages);
                    }}
                    onView={(idx) => {
                      setSelectedImageIndex(idx);
                      setShowImageViewer(true);
                    }}
                    onMoveUp={moveImageUp}
                    onMoveDown={moveImageDown}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    draggedIndex={draggedIndex}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Local Upload Modal */}
      {showLocalUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Upload Images</h3>
                <button
                  onClick={() => setShowLocalUpload(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <LocalImageUpload
                onImagesAdded={handleLocalImagesAdded}
                existingImagesCount={images.length}
              />
            </div>
          </div>
        </div>
      )}

      {/* Paste Images Modal */}
      <PasteImagesModal
        isOpen={showPasteImagesModal}
        onClose={() => setShowPasteImagesModal(false)}
        postId={post.id}
        existingImages={images}
      />

      {/* Image Viewer */}
      <ImageViewer
        images={images}
        currentIndex={selectedImageIndex}
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        onImageUpdate={updateImage}
        onReorder={handleReorder}
      />
    </div>
  );
}
