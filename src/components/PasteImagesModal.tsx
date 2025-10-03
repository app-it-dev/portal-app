'use client';

import { useState } from 'react';
import { Modal } from './Modal';
import { parseImageItemsFromText } from '@/utils/urlParsers';
import { useSupabaseStore as useStore } from '@/store/supabase-store';
import { toast } from 'sonner';
import type { ImageItem } from '@/types';

interface PasteImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  existingImages: ImageItem[];
}

export function PasteImagesModal({ isOpen, onClose, postId, existingImages }: PasteImagesModalProps) {
  const [text, setText] = useState('');
  const { setImages } = useStore();

  const handleAddImages = () => {
    const { items, skipped } = parseImageItemsFromText(text);
    
    if (items.length === 0) {
      toast.error('No valid image URLs found');
      return;
    }

    // Check if there's already a main image
    const hasMainImage = existingImages.some(img => img.isMain);
    
    // Create new image items
    const newImages: ImageItem[] = items.map((item, index) => ({
      url: item.url,
      keep: true,
      isMain: !hasMainImage && index === 0, // First image becomes main if no main exists
      caption: item.caption,
    }));

    // Merge with existing images and deduplicate
    const existingUrls = new Set(existingImages.map(img => img.url.toLowerCase()));
    const uniqueNewImages = newImages.filter(img => !existingUrls.has(img.url.toLowerCase()));
    
    const allImages = [...existingImages, ...uniqueNewImages];
    
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

    // Update the post's images
    setImages(postId, allImages);

    // Show success message
    const addedCount = uniqueNewImages.length;
    const duplicateCount = items.length - addedCount;
    let message = `Added ${addedCount} images`;
    if (duplicateCount > 0) {
      message += ` (${duplicateCount} duplicates skipped)`;
    }
    if (skipped > 0) {
      message += ` (${skipped} invalid/skipped)`;
    }
    toast.success(message);

    // Close modal and reset
    setText('');
    onClose();
  };

  const handleCancel = () => {
    setText('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Paste Image URLs"
      actions={
        <>
          <button
            onClick={handleCancel}
            className="btn btn-secondary btn-md"
          >
            Cancel
          </button>
          <button
            onClick={handleAddImages}
            className="btn btn-primary btn-md"
            disabled={!text.trim()}
          >
            Add Images
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="images-textarea" className="block text-sm font-medium text-slate-700 mb-2">
            Paste image URLs (one per line)
          </label>
          <textarea
            id="images-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`https://img1.jpg
https://img2.jpg, Front 3/4 view
https://img3.jpg	Interior (tab-separated)
# This is a comment
https://img4.jpg, Rear view`}
            className="w-full h-48 p-3 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          />
        </div>
        
        <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
          <p className="font-medium mb-1">Supported formats:</p>
          <ul className="space-y-1 text-xs">
            <li>• URL only: <code className="bg-slate-200 px-1 rounded">https://img1.jpg</code></li>
            <li>• URL with caption: <code className="bg-slate-200 px-1 rounded">https://img2.jpg, Front view</code></li>
            <li>• Tab-separated: <code className="bg-slate-200 px-1 rounded">https://img3.jpg	Interior</code></li>
            <li>• Lines starting with # are comments (ignored)</li>
            <li>• Duplicate URLs are automatically skipped</li>
            <li>• First image becomes main if no main image exists</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
