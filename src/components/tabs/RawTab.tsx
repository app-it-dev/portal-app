'use client';

import { useState } from 'react';
import { useSupabaseStore as useStore } from '@/store/supabase-store';
import type { PostRow } from '@/types';
import { Trash2, Save } from 'lucide-react';

interface RawTabProps {
  post: PostRow;
}

export function RawTab({ post }: RawTabProps) {
  const [content, setContent] = useState(post.rawContent || '');
  const { saveRaw } = useStore();

  const handleSave = () => {
    saveRaw(post.id, content);
  };

  const handleClear = () => {
    setContent('');
    saveRaw(post.id, '');
  };

  const handlePasteAndSave = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setContent(text);
      // Auto-save immediately after pasting
      saveRaw(post.id, text);
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900">Raw Page Content</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={handleClear}
            className="btn btn-xs btn-secondary"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear
          </button>
          <button
            onClick={handlePasteAndSave}
            className="btn btn-xs btn-secondary"
          >
            Paste
          </button>
          <button
            onClick={handleSave}
            className="btn btn-xs btn-primary"
          >
            <Save className="w-3 h-3 mr-1" />
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste raw page content here..."
          className="flex-1 w-full p-3 border border-slate-300 rounded-lg bg-white text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>{content.length.toLocaleString()} characters</span>
          {content.length > 0 && (
            <span className="text-green-600">
              Content saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
