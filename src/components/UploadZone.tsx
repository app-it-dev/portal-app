'use client';

import { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, X, Clipboard, Plus, Link } from 'lucide-react';
import { useSupabaseStore as useStore } from '@/store/supabase-store';
import { parsePostsXLSX, parseImagesXLSX } from '@/utils/xlsx';
import { parsePostUrlsFromText } from '@/utils/urlParsers';
import { toast } from 'sonner';
import { PastePostsModal } from './PastePostsModal';

export function UploadZone() {
  const [postsFile, setPostsFile] = useState<File | null>(null);
  const [imagesFile, setImagesFile] = useState<File | null>(null);
  const [quickUrl, setQuickUrl] = useState('');
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const postsInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);
  
  const { importPosts, importImages, setSearch, reset, showPastePostsModal, setShowPastePostsModal, setActive } = useStore();

  const handlePostsUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const posts = await parsePostsXLSX(file);
      importPosts(posts);
      setPostsFile(file);
      toast.success(`Imported ${posts.length} posts from ${file.name}`);
    } catch (error) {
      toast.error(`Failed to parse posts file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleImagesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const images = await parseImagesXLSX(file);
      importImages(images);
      setImagesFile(file);
      toast.success(`Imported ${images.length} images from ${file.name}`);
    } catch (error) {
      toast.error(`Failed to parse images file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearPostsFile = () => {
    setPostsFile(null);
    if (postsInputRef.current) {
      postsInputRef.current.value = '';
    }
  };

  const clearImagesFile = () => {
    setImagesFile(null);
    if (imagesInputRef.current) {
      imagesInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    reset();
    clearPostsFile();
    clearImagesFile();
    toast.success('Reset complete - all data cleared');
  };

  const handleQuickAddUrl = () => {
    if (!quickUrl.trim()) return;
    
    try {
      const { urls, skipped } = parsePostUrlsFromText(quickUrl);
      
      if (urls.length === 0) {
        toast.error('No valid URL found');
        return;
      }

      if (urls.length > 1) {
        toast.error('Please enter only one URL at a time');
        return;
      }

      // Create post from URL
      const newPosts = urls.map(url => ({ url }));
      importPosts(newPosts);
      
      // Set the new post as active
      setTimeout(() => {
        const existingPosts = useStore.getState().posts;
        const newPost = existingPosts.find(post => post.url === urls[0]);
        if (newPost) {
          setActive(newPost.id);
        }
      }, 0);

      toast.success('Post added successfully');
      setQuickUrl('');
      setIsAddingUrl(false);
    } catch (error) {
      toast.error('Invalid URL format');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuickAddUrl();
    } else if (e.key === 'Escape') {
      setQuickUrl('');
      setIsAddingUrl(false);
    }
  };

  return (
    <div className="section-padding py-4 border-b border-slate-200 bg-slate-50/50">
      <div className="content-spacing">
        {/* Quick Add Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Add Post</h2>
          {!isAddingUrl ? (
            <button
              onClick={() => setIsAddingUrl(true)}
              className="btn btn-primary btn-sm w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Single URL
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Paste car listing URL..."
                  className="input flex-1 text-sm"
                  autoFocus
                />
                <button
                  onClick={handleQuickAddUrl}
                  disabled={!quickUrl.trim()}
                  className="btn btn-primary btn-sm px-3"
                >
                  <Link className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setQuickUrl('');
                    setIsAddingUrl(false);
                  }}
                  className="btn btn-secondary btn-sm px-3"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500">Press Enter to add, Escape to cancel</p>
            </div>
          )}
        </div>

        {/* Bulk Upload Section */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Bulk Upload</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <input
                ref={postsInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handlePostsUpload}
                className="hidden"
              />
              <button
                onClick={() => postsInputRef.current?.click()}
                className="btn btn-secondary btn-sm w-full opacity-50 cursor-not-allowed"
                disabled
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Posts
              </button>
              {postsFile && (
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-white p-2 rounded border">
                  <FileSpreadsheet className="w-3 h-3 text-green-600" />
                  <span className="flex-1 truncate">{postsFile.name}</span>
                  <button
                    onClick={clearPostsFile}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <input
                ref={imagesInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImagesUpload}
                className="hidden"
              />
              <button
                onClick={() => imagesInputRef.current?.click()}
                className="btn btn-secondary btn-sm w-full opacity-50 cursor-not-allowed"
                disabled
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Images
              </button>
              {imagesFile && (
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-white p-2 rounded border">
                  <FileSpreadsheet className="w-3 h-3 text-green-600" />
                  <span className="flex-1 truncate">{imagesFile.name}</span>
                  <button
                    onClick={clearImagesFile}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setShowPastePostsModal(true)}
            className="btn btn-secondary btn-sm w-full mt-2"
          >
            <Clipboard className="w-4 h-4 mr-2" />
            Paste Multiple URLs
          </button>
        </div>

        {/* Controls Section */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Search..."
              onChange={(e) => setSearch(e.target.value)}
              className="input flex-1 text-sm"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleReset}
              className="btn btn-destructive btn-sm px-3 text-xs"
            >
              Reset All
            </button>
          </div>
        </div>
      </div>

      <PastePostsModal
        isOpen={showPastePostsModal}
        onClose={() => setShowPastePostsModal(false)}
      />
    </div>
  );
}
