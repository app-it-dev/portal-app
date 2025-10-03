'use client';

import { useState } from 'react';
import { Modal } from './Modal';
import { parsePostUrlsFromText } from '@/utils/urlParsers';
import { useSupabaseStore as useStore } from '@/store/supabase-store';
import { toast } from 'sonner';

interface PastePostsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PastePostsModal({ isOpen, onClose }: PastePostsModalProps) {
  const [text, setText] = useState('');
  const { importPosts, setActive } = useStore();

  const handleImport = () => {
    const { urls, skipped } = parsePostUrlsFromText(text);
    
    if (urls.length === 0) {
      toast.error('No valid URLs found');
      return;
    }

    // Create post rows from URLs
    const newPosts = urls.map(url => ({ url }));
    
    // Import posts (this will handle deduplication against existing posts)
    importPosts(newPosts);
    
    // Set the first new post as active
    // We need to get the posts after import to find the new ones
    setTimeout(() => {
      const existingPosts = useStore.getState().posts;
      const firstNewPost = existingPosts.find(post => urls.includes(post.url));
      if (firstNewPost) {
        setActive(firstNewPost.id);
      }
    }, 0);

    // Show success message
    const message = skipped > 0 
      ? `Imported ${urls.length} posts (${skipped} invalid/skipped)`
      : `Imported ${urls.length} posts`;
    toast.success(message);

    // Close modal and reset
    setText('');
    onClose();
  };

  const handleCancel = () => {
    setText('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (text.trim()) {
        handleImport();
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Paste Posts"
      actions={
        <>
          <button
            onClick={handleCancel}
            className="btn btn-secondary btn-md"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            className="btn btn-primary btn-md"
            disabled={!text.trim()}
          >
            Import
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="posts-textarea" className="block text-sm font-medium text-slate-700 mb-2">
            Paste URLs (one per line)
          </label>
          <textarea
            id="posts-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`posts
https://www.cars.com/vehicledetail/ec374853-beaf-453b-a71c-f0512e44c4e3/
https://www.cars.com/vehicledetail/f2cff3d3-34a4-40bf-96b5-3b1216b7fe7b/
https://www.cars.com/vehicledetail/e28d4736-0381-4d4d-ad61-707263f82dd4/?attribution_type=ship
https://www.cars.com/vehicledetail/a770b3bf-ff7f-4a52-89bd-58b3dc7d25e0/?attribution_type=se_rnp`}
            className="w-full h-64 p-3 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          />
        </div>
      </div>
    </Modal>
  );
}
