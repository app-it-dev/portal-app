'use client';

import { useSupabaseStore as useStore } from '@/store/supabase-store';
import type { PostRow } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { CheckCircle, Play, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SummaryTabProps {
  post: PostRow;
}

export function SummaryTab({ post }: SummaryTabProps) {
  const { setImages } = useStore();

  const keptImages = post.images.filter(img => img.keep);
  const mainImage = post.images.find(img => img.isMain && img.keep);
  
  const canMarkReady = 
    post.status !== 'rejected' &&
    post.parsedJson &&
    keptImages.length >= 1 &&
    mainImage;

  const handleMarkReady = () => {
    if (canMarkReady) {
      // Update the post status to ready
      const updatedPost = { ...post, status: 'ready' as const };
      // This would normally update the store, but for now we'll just show a toast
      toast.success('Post marked as ready');
    }
  };

  const handleInsert = () => {
    toast.success('Insert simulated - no backend call made');
    // In a real implementation, this would call an API
  };

  return (
    <div className="h-full flex flex-col">
      <div className="section-padding py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Summary</h3>
          <StatusBadge status={post.status} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto section-padding py-6">
        <div className="content-spacing">
          {/* Parsed Content */}
          <div>
            <h4 className="text-base font-semibold mb-4 text-slate-900">Parsed Content</h4>
            <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-slate-600">Title:</span>
                  <p className="text-base text-slate-900 mt-2">
                    {post.parsedJson?.title || <span className="text-slate-400">No title parsed yet</span>}
                  </p>
                </div>
              
                {/* Vehicle Information */}
                {post.parsedJson?.vehicle && (
                  <div>
                    <span className="text-sm font-medium text-slate-600">Vehicle Details:</span>
                    <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                      {post.parsedJson.vehicle.year && (
                        <div>
                          <span className="text-slate-500">Year:</span> {post.parsedJson.vehicle.year}
                        </div>
                      )}
                      {post.parsedJson.vehicle.make && (
                        <div>
                          <span className="text-slate-500">Make:</span> {post.parsedJson.vehicle.make}
                        </div>
                      )}
                      {post.parsedJson.vehicle.model && (
                        <div>
                          <span className="text-slate-500">Model:</span> {post.parsedJson.vehicle.model}
                        </div>
                      )}
                      {post.parsedJson.vehicle.vin && (
                        <div className="col-span-2">
                          <span className="text-slate-500">VIN:</span> {post.parsedJson.vehicle.vin}
                        </div>
                      )}
                      {post.parsedJson.vehicle.condition && (
                        <div>
                          <span className="text-slate-500">Condition:</span> {post.parsedJson.vehicle.condition}
                        </div>
                      )}
                      {post.parsedJson.vehicle.mileage && (
                        <div>
                          <span className="text-slate-500">Mileage:</span> {post.parsedJson.vehicle.mileage.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Specs Information */}
                {post.parsedJson?.specs && (
                  <div>
                    <span className="text-sm font-medium text-slate-600">Specifications:</span>
                    <div className="mt-2 space-y-2 text-sm">
                      {post.parsedJson.specs.exterior_color && (
                        <div>
                          <span className="text-slate-500">Exterior:</span> {post.parsedJson.specs.exterior_color}
                        </div>
                      )}
                      {post.parsedJson.specs.interior_color && (
                        <div>
                          <span className="text-slate-500">Interior:</span> {post.parsedJson.specs.interior_color}
                        </div>
                      )}
                      {post.parsedJson.specs.exterior_features && post.parsedJson.specs.exterior_features.length > 0 && (
                        <div>
                          <span className="text-slate-500">Exterior features:</span> {post.parsedJson.specs.exterior_features.length}
                        </div>
                      )}
                      {post.parsedJson.specs.interior_features && post.parsedJson.specs.interior_features.length > 0 && (
                        <div>
                          <span className="text-slate-500">Interior features:</span> {post.parsedJson.specs.interior_features.length}
                        </div>
                      )}
                      {post.parsedJson.specs.safety_and_tech && post.parsedJson.specs.safety_and_tech.length > 0 && (
                        <div>
                          <span className="text-slate-500">Safety & tech:</span> {post.parsedJson.specs.safety_and_tech.length}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-sm font-medium text-slate-600">Notes:</span>
                  <p className="text-base text-slate-900 mt-2">
                    {post.parsedJson?.notes || <span className="text-slate-400">No notes parsed yet</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Images Summary */}
          <div>
            <h4 className="text-base font-semibold mb-4 text-slate-900">Images</h4>
            <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Total:</span>
                  <span className="text-base font-semibold text-slate-900">{post.images.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Kept:</span>
                  <span className="text-base font-semibold text-slate-900">{keptImages.length}</span>
                </div>
                {mainImage && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-slate-600">Main Image:</span>
                    <div className="w-24 h-24 bg-slate-200 rounded-lg overflow-hidden border border-slate-300">
                      <img
                        src={mainImage.url}
                        alt="Main image"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Validation Status */}
          <div>
            <h4 className="text-base font-semibold mb-4 text-slate-900">Validation</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {post.status !== 'rejected' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  {post.status !== 'rejected' ? 'Not rejected' : 'Post is rejected'}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {post.parsedJson ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  {post.parsedJson ? 'Parsed JSON exists' : 'No parsed JSON'}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {keptImages.length >= 1 ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  {keptImages.length >= 1 ? `≥1 kept image (${keptImages.length})` : 'No kept images'}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {mainImage ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  {mainImage ? 'Exactly 1 main image' : 'No main image set'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleMarkReady}
              disabled={!canMarkReady}
              className="btn btn-primary btn-md w-full"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark Ready
            </button>
            
            <button
              onClick={handleInsert}
              disabled={post.status !== 'ready'}
              className="btn btn-secondary btn-md w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              Insert (simulated)
            </button>
          </div>

          {!canMarkReady && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                Mark Ready is blocked until all requirements are satisfied:
                <br />• Post is not rejected
                <br />• Parsed JSON exists
                <br />• ≥1 kept image and exactly 1 main
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
