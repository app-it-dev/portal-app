'use client';

import { useSupabaseStore as useStore } from '@/store/supabase-store';
import { Eye, X, RotateCcw, FileSpreadsheet, Search } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { BulkActions } from '@/components/BulkActions';

export function PostsTable() {
  const { posts, activeId, search, setActive, reject, undoReject, inflightByPostId } = useStore();

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

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const truncateUrl = (url: string, maxLength: number = 20) => {
    return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
  };

  const handleView = (url: string) => {
    window.open(url, '_blank');
  };

  const handleReject = (id: string, currentStatus: string) => {
    if (currentStatus === 'rejected') {
      undoReject(id);
    } else {
      reject(id, 'Manually rejected');
    }
  };

  if (posts.length === 0) {
    return (
      <div className="section-padding py-12 text-center bg-white">
        <div className="text-slate-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
            <FileSpreadsheet className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-lg font-medium mb-2">No posts uploaded yet</p>
          <p className="text-sm">Upload a Posts XLSX file to get started</p>
        </div>
      </div>
    );
  }

  if (filteredPosts.length === 0) {
    return (
      <div className="section-padding py-12 text-center bg-white">
        <div className="text-slate-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-lg font-medium mb-2">No posts match your filter</p>
          <p className="text-sm">Try adjusting your search or filter criteria</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Posts
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          {filteredPosts.length > 0 && (
            <div className="text-xs text-slate-400">
              Click to open
            </div>
          )}
        </div>
      </div>
      
      {/* Bulk Actions */}
      <BulkActions />
      
      {/* Desktop Table View */}
      <div className="hidden lg:block flex-1 overflow-auto">
        <div className="min-w-full">
          <table className="w-full table-fixed">
            <thead className="sticky top-0 bg-white border-b border-slate-200 z-10">
              <tr>
                <th className="text-left py-3 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider w-16">#</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider w-1/3">URL</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider w-32">Status</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider w-40">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredPosts.map((post, index) => (
                <tr
                  key={post.id}
                  className={`group hover:bg-slate-50/50 transition-all duration-150 cursor-pointer ${
                    activeId === post.id ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => setActive(post.id)}
                >
                  <td className="py-3 px-2 text-sm font-mono text-slate-400 w-16">
                    {String(index + 1).padStart(2, '0')}
                  </td>
                  <td className="py-3 px-2 w-1/3 min-w-0">
                    <div className="font-semibold text-slate-900 text-sm truncate">
                      {getDomain(post.url)}
                    </div>
                  </td>
                  <td className="py-3 px-2 w-32">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={post.status} />
                      {inflightByPostId[post.id] && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-600">
                          <div className="w-2.5 h-2.5 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="hidden xl:inline">Analyzing</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2 w-40">
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleView(post.url)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-all duration-150"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                      <button
                        onClick={() => handleReject(post.id, post.status)}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                          post.status === 'rejected' 
                            ? 'text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200' 
                            : 'text-red-600 bg-red-50 hover:bg-red-100 border border-red-200'
                        }`}
                      >
                        {post.status === 'rejected' ? (
                          <>
                            <RotateCcw className="w-3 h-3" />
                            Undo
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" />
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tablet/Mobile Card View */}
      <div className="lg:hidden flex-1 overflow-auto">
        <div className="p-4 space-y-3">
          {filteredPosts.map((post, index) => (
            <div
              key={post.id}
              className={`group bg-white border border-slate-200 rounded-xl p-4 transition-all duration-200 cursor-pointer hover:shadow-sm ${
                activeId === post.id 
                  ? 'bg-blue-50/50 border-blue-200 shadow-sm ring-1 ring-blue-200' 
                  : 'hover:border-slate-300'
              }`}
              onClick={() => setActive(post.id)}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-600 text-sm font-mono rounded-lg">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={post.status} />
                    {inflightByPostId[post.id] && (
                      <div className="flex items-center gap-1.5 text-xs text-blue-600">
                        <div className="w-2.5 h-2.5 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Analyzing</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleView(post.url)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-all duration-150"
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </button>
                  <button
                    onClick={() => handleReject(post.id, post.status)}
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                      post.status === 'rejected' 
                        ? 'text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200' 
                        : 'text-red-600 bg-red-50 hover:bg-red-100 border border-red-200'
                    }`}
                  >
                    {post.status === 'rejected' ? (
                      <>
                        <RotateCcw className="w-3 h-3" />
                        Undo
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3" />
                        Reject
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* URL content */}
              <div>
                <div className="font-semibold text-slate-900 text-sm">
                  {getDomain(post.url)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
