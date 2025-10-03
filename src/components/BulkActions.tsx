'use client';

import { useState } from 'react';
import { Play, X, RotateCcw, CheckCircle } from 'lucide-react';
import { useSupabaseStore as useStore } from '@/store/supabase-store';
import { toast } from 'sonner';

export function BulkActions() {
  const { posts, search, analyze, reject, undoReject } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter posts - show all posts since filter widget is removed
  const filteredPosts = posts.filter(post => {

    if (search) {
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        post.url.toLowerCase().includes(searchLower) ||
        post.source?.toLowerCase().includes(searchLower) ||
        post.note?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    return true;
  });

  const pendingPosts = filteredPosts.filter(p => p.status === 'pending' && p.rawContent?.trim());
  const rejectedPosts = filteredPosts.filter(p => p.status === 'rejected');

  const handleBulkAnalyze = async () => {
    if (pendingPosts.length === 0) {
      toast.error('No pending posts with raw content to analyze');
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const post of pendingPosts) {
        try {
          await analyze(post.id);
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Failed to analyze post ${post.id}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Analyzed ${successCount} posts successfully`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to analyze ${errorCount} posts`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkReject = () => {
    if (pendingPosts.length === 0) {
      toast.error('No pending posts to reject');
      return;
    }

    pendingPosts.forEach(post => {
      reject(post.id, 'Bulk rejected');
    });

    toast.success(`Rejected ${pendingPosts.length} posts`);
  };

  const handleBulkUndoReject = () => {
    if (rejectedPosts.length === 0) {
      toast.error('No rejected posts to undo');
      return;
    }

    rejectedPosts.forEach(post => {
      undoReject(post.id);
    });

    toast.success(`Undid rejection for ${rejectedPosts.length} posts`);
  };

  if (filteredPosts.length === 0) {
    return null;
  }

  return (
    <div className="section-padding py-2 border-b border-slate-200 bg-slate-50/30">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-600 mr-2">Bulk Actions:</span>
        

        {rejectedPosts.length > 0 && (
          <button
            onClick={handleBulkUndoReject}
            className="btn btn-secondary btn-xs flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Undo Reject ({rejectedPosts.length})
          </button>
        )}

        {isProcessing && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            Processing...
          </div>
        )}
      </div>
    </div>
  );
}
