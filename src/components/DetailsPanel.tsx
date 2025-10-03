'use client';

import { useSupabaseStore as useStore } from '@/store/supabase-store';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { WorkflowTab } from '@/components/tabs/WorkflowTab';

export function DetailsPanel() {
  const { posts, activeId, next, prev } = useStore();

  const activePost = activeId ? posts.find(p => p.id === activeId) : null;

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const truncateUrl = (url: string, maxLength: number = 60) => {
    return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
  };

  const handleView = () => {
    if (activePost) {
      window.open(activePost.url, '_blank');
    }
  };


  if (!activePost) {
    return (
      <div className="section-padding py-16 text-center bg-white h-full flex items-center justify-center">
        <div className="text-slate-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
            <ChevronRight className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-lg font-medium mb-2">No post selected</p>
          <p className="text-sm">Select a post from the table to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white border-l border-slate-200">
      {/* Top Navigation Bar */}
      <div className="section-padding py-4 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              className="btn btn-sm btn-secondary"
              title="Previous (K)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="btn btn-sm btn-secondary"
              title="Next (J)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleView}
              className="btn btn-sm btn-primary"
              title="View in new tab (V)"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="font-medium text-slate-900 text-base">
            {getDomain(activePost.url)}
          </div>
          <div className="text-sm text-slate-500 font-mono break-all">
            {truncateUrl(activePost.url, 50)}
          </div>
        </div>
      </div>

      {/* Workflow Content */}
      <div className="flex-1">
        <WorkflowTab post={activePost} />
      </div>
    </div>
  );
}
