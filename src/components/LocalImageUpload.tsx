'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface LocalImageUploadProps {
  onImagesAdded: (images: { url: string; caption?: string; keep: boolean; isMain: boolean }[]) => void;
  existingImagesCount: number;
}

export function LocalImageUpload({ onImagesAdded, existingImagesCount }: LocalImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast.error('Please select image files only');
      setIsUploading(false);
      return;
    }

    if (imageFiles.length !== files.length) {
      toast.warning(`Selected ${imageFiles.length} image files (${files.length - imageFiles.length} non-image files ignored)`);
    }

    try {
      toast.info(`Processing ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''}...`);
      
      const newImages = await Promise.all(
        imageFiles.map(async (file, index) => {
          return new Promise<{ url: string; caption?: string; keep: boolean; isMain: boolean }>((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
              const dataUrl = e.target?.result as string;
              resolve({
                url: dataUrl,
                caption: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
                keep: true,
                isMain: existingImagesCount === 0 && index === 0, // First image becomes main if no existing images
              });
            };
            
            reader.onerror = () => {
              reject(new Error(`Failed to read ${file.name}`));
            };
            
            reader.readAsDataURL(file);
          });
        })
      );

      onImagesAdded(newImages);
      toast.success(`Successfully added ${newImages.length} image${newImages.length > 1 ? 's' : ''}`);
    } catch (error) {
      toast.error('Failed to process images');
      console.error('Error processing images:', error);
    } finally {
      setIsUploading(false);
    }
  }, [onImagesAdded, existingImagesCount]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 hover:border-slate-400'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isDragOver ? 'bg-blue-100' : 'bg-slate-100'
          }`}>
            {isUploading ? (
              <div className="relative">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                </div>
              </div>
            ) : (
              <Upload className={`w-8 h-8 ${isDragOver ? 'text-blue-600' : 'text-slate-400'}`} />
            )}
          </div>
          
          <div>
            <p className="text-lg font-medium text-slate-900 mb-2">
              {isUploading ? 'Processing images...' : 'Upload Images'}
            </p>
            <p className="text-sm text-slate-600">
              {isUploading 
                ? 'Please wait while we process your images'
                : 'Drag and drop images here, or click to browse'
              }
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Supports JPG, PNG, GIF, WebP and other image formats
            </p>
            {isUploading && (
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={handleClick}
          disabled={isUploading}
          className="btn btn-secondary btn-sm flex items-center gap-2"
        >
          <ImageIcon className="w-4 h-4" />
          Choose Files
        </button>
        
        <div className="text-xs text-slate-500">
          or drag and drop multiple images
        </div>
      </div>
    </div>
  );
}
