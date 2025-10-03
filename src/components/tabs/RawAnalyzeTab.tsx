'use client';

import { useState, useEffect } from 'react';
import { useSupabaseStore as useStore } from '@/store/supabase-store';
import type { PostRow } from '@/types';
import { AnalyzeTab } from './AnalyzeTab';

interface RawAnalyzeTabProps {
  post: PostRow;
}

export function RawAnalyzeTab({ post }: RawAnalyzeTabProps) {
  const [rawContent, setRawContent] = useState(post.rawContent || '');
  const { saveRaw } = useStore();

  // Sync with store when post changes
  useEffect(() => {
    setRawContent(post.rawContent || '');
  }, [post.rawContent]);

  const handleRawContentChange = (content: string) => {
    setRawContent(content);
    saveRaw(post.id, content);
  };

  return (
    <AnalyzeTab 
      rawContent={rawContent}
      onRawContentChange={handleRawContentChange}
    />
  );
}
