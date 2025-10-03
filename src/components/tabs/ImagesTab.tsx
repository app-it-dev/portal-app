'use client';

import { useState, useEffect } from 'react';
import { useSupabaseStore as useStore } from '@/store/supabase-store';
import type { PostRow, ImageItem } from '@/types';
import { X, Save, CheckSquare, Square, Image, Clipboard, Upload, Eye, Trash2, Star } from 'lucide-react';
import { PasteImagesModal } from '../PasteImagesModal';
import { LocalImageUpload } from '../LocalImageUpload';
import { ImageViewer } from '../ImageViewer';

interface ImagesTabProps {
  post: PostRow;
}

export function ImagesTab({ post }: ImagesTabProps) {
  const [images, setLocalImages] = useState<ImageItem[]>(post.images);
  const [showPasteImagesModal, setShowPasteImagesModal] = useState(false);
  const [showLocalUpload, setShowLocalUpload] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const { setImages } = useStore();

  useEffect(() => {
    console.log('ImagesTab: Post images updated:', post.images);
    setLocalImages(post.images);
  }, [post.images]);

  const handleKeepToggle = (index: number) => {
    console.log('Keep toggle clicked for index:', index, 'Current state:', images[index]);
    const newImages = images.map((img, i) => {
      if (i === index) {
        const updated = { ...img, keep: !img.keep };
        console.log('Updated image:', updated);
        return updated;
      }
      return img;
    });
    
    // If unchecking the main image, promote the first kept image
    if (newImages[index].isMain && !newImages[index].keep) {
      const firstKept = newImages.find(img => img.keep && img !== newImages[index]);
      if (firstKept) {
        firstKept.isMain = true;
        newImages[index].isMain = false;
      }
    }
    
    console.log('Updated images array:', newImages);
    setLocalImages([...newImages]); // Force new array reference
  };

  const handleDeleteImage = (index: number) => {
    console.log('Delete clicked for index:', index);
    const newImages = images.filter((_, i) => i !== index);
    
    // If we deleted the main image, promote the first remaining image
    if (images[index].isMain && newImages.length > 0) {
      newImages[0].isMain = true;
    }
    
    console.log('Updated images after delete:', newImages);
    setLocalImages(newImages);
  };

  const handleMainToggle = (index: number) => {
    console.log('Main toggle clicked for index:', index, 'Current state:', images[index]);
    const newImages = images.map((img, i) => {
      if (i === index) {
        return { ...img, isMain: img.keep ? !img.isMain : false };
      }
      return { ...img, isMain: false }; // Unset all others
    });
    
    // Ensure only one main image
    const mainCount = newImages.filter(img => img.isMain).length;
    if (mainCount === 0 && newImages.length > 0 && newImages[index].keep) {
      newImages[index].isMain = true;
    }
    
    console.log('Updated images for main toggle:', newImages);
    setLocalImages([...newImages]); // Force new array reference
  };

  const handleSelectAll = () => {
    const newImages = images.map((img, index) => ({
      ...img,
      keep: true,
      isMain: index === 0, // First image becomes main
    }));
    setLocalImages(newImages);
  };

  const handleSelectNone = () => {
    const newImages = images.map(img => ({
      ...img,
      keep: false,
      isMain: false,
    }));
    setLocalImages(newImages);
  };

  const handleRemoveUnselected = () => {
    const keptImages = images.filter(img => img.keep);
    
    // Ensure at least one image remains
    if (keptImages.length === 0 && images.length > 0) {
      keptImages.push({ ...images[0], keep: true, isMain: true });
    }
    
    // Ensure exactly one main image
    const mainCount = keptImages.filter(img => img.isMain).length;
    if (mainCount === 0 && keptImages.length > 0) {
      keptImages[0].isMain = true;
    } else if (mainCount > 1) {
      // Keep only the first main image
      let foundMain = false;
      keptImages.forEach(img => {
        if (img.isMain && !foundMain) {
          foundMain = true;
        } else if (img.isMain) {
          img.isMain = false;
        }
      });
    }
    
    setLocalImages(keptImages);
  };

  const handleSave = () => {
    setImages(post.id, images);
  };

  const handleLocalImagesAdded = (newImages: { url: string; caption?: string; keep: boolean; isMain: boolean }[]) => {
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

    setLocalImages(allImages);
    setShowLocalUpload(false);
  };

  const handleImageViewerOpen = (index: number) => {
    setViewerIndex(index);
    setShowImageViewer(true);
  };

  const handleImageUpdate = (index: number, updates: Partial<ImageItem>) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], ...updates };
    setLocalImages(newImages);
  };

  const truncateCaption = (caption: string, maxLength: number = 30) => {
    return caption.length > maxLength ? caption.substring(0, maxLength) + '...' : caption;
  };

  if (images.length === 0) {
    return (
      <div className="h-full flex items-center justify-center section-padding py-16">
        <div className="text-center text-slate-500 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
            <Image className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-lg font-medium mb-2">No images found</p>
          <p className="text-sm mb-6">Upload images from your device or paste image URLs</p>
          
          <div className="space-y-3">
            <button
              onClick={() => setShowLocalUpload(true)}
              className="btn btn-primary btn-md w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload from Device
            </button>
            <button
              onClick={() => setShowPasteImagesModal(true)}
              className="btn btn-secondary btn-md w-full"
            >
              <Clipboard className="w-4 h-4 mr-2" />
              Paste Image URLs
            </button>
          </div>
        </div>
        
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
        
        <PasteImagesModal
          isOpen={showPasteImagesModal}
          onClose={() => setShowPasteImagesModal(false)}
          postId={post.id}
          existingImages={images}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="section-padding py-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Images ({images.length})</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setShowLocalUpload(true)}
              className="btn btn-secondary btn-sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </button>
            <button
              onClick={() => setShowPasteImagesModal(true)}
              className="btn btn-secondary btn-sm"
            >
              <Clipboard className="w-4 h-4 mr-2" />
              Paste URLs
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary btn-sm"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Selection
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="btn btn-sm btn-secondary"
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            All
          </button>
          <button
            onClick={handleSelectNone}
            className="btn btn-sm btn-secondary"
          >
            <Square className="w-4 h-4 mr-2" />
            None
          </button>
          <button
            onClick={handleRemoveUnselected}
            className="btn btn-sm btn-destructive"
          >
            <X className="w-4 h-4 mr-2" />
            Remove
          </button>
        </div>
        
        {/* Debug Info */}
        <div className="mt-2 p-2 bg-slate-100 rounded text-xs">
          <strong>Debug:</strong> {images.length} images | 
          Kept: {images.filter(img => img.keep).length} | 
          Main: {images.findIndex(img => img.isMain)} | 
          State: {JSON.stringify(images.map(img => ({ keep: img.keep, isMain: img.isMain })))}
        </div>
      </div>

      <div className="flex-1 overflow-auto section-padding py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          {images.map((image, index) => {
            console.log(`Rendering image ${index}:`, { keep: image.keep, isMain: image.isMain });
            return (
            <div
              key={`${post.id}-${image.url}-${index}`}
              className={`group border-2 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg ${
                image.keep 
                  ? 'border-green-500 bg-green-50 shadow-md' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                <img
                  src={image.url}
                  alt={image.caption || `Image ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="flex items-center justify-center h-full text-slate-500 text-sm">Failed to load</div>';
                      }
                  }}
                />
                
                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => handleImageViewerOpen(index)}
                    className="p-3 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>

                {/* Status Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {image.isMain && (
                    <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Main
                    </div>
                  )}
                  {!image.keep && (
                    <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Removed
                    </div>
                  )}
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteImage(index)}
                  className="absolute top-3 right-3 p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-4 space-y-3">
                {image.caption && (
                  <p className="text-sm text-slate-600 font-medium">
                    {truncateCaption(image.caption, 40)}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-blue-600 transition-colors">
                    <input
                      type="checkbox"
                      checked={image.keep}
                      onChange={() => handleKeepToggle(index)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="font-medium">Keep</span>
                  </label>
                  
                  <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-blue-600 transition-colors">
                    <input
                      type="radio"
                      name={`main-${post.id}`}
                      checked={image.isMain}
                      onChange={() => handleMainToggle(index)}
                      disabled={!image.keep}
                      className="w-4 h-4 border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="font-medium">Main</span>
                  </label>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
      
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
      
      <PasteImagesModal
        isOpen={showPasteImagesModal}
        onClose={() => setShowPasteImagesModal(false)}
        postId={post.id}
        existingImages={images}
      />

      <ImageViewer
        images={images}
        currentIndex={viewerIndex}
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        onImageUpdate={handleImageUpdate}
      />
    </div>
  );
}
