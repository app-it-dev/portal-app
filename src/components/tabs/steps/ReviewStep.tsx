'use client';

import { CheckCircle, ExternalLink, Download } from 'lucide-react';
import type { PostRow } from '@/types';

interface ReviewStepProps {
  post: PostRow;
  onFinalize: () => void;
  canFinalize: boolean;
}

export function ReviewStep({ post, onFinalize, canFinalize }: ReviewStepProps) {
  const parsedData = post.parsedJson;
  const images = post.images || [];

  const handleViewOriginal = () => {
    window.open(post.url, '_blank');
  };

  const handleExportJson = () => {
    if (!parsedData) return;
    
    const dataStr = JSON.stringify(parsedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `post-${post.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="section-padding py-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Step 4: Final Review</h3>
            <p className="text-sm text-slate-600 mt-1">
              Review all extracted data before finalizing
            </p>
          </div>
          {canFinalize && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Ready to finalize</span>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportJson}
              className="btn btn-secondary btn-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
            <div className="text-sm text-slate-600">
              {parsedData ? (
                <span className="text-green-600">✓ All data ready</span>
              ) : (
                <span>Complete previous steps first</span>
              )}
            </div>
          </div>
          <button
            onClick={onFinalize}
            disabled={!canFinalize}
            className="btn btn-primary btn-sm flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Finalize Post
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="section-padding py-4">
          <div className="space-y-6">
            {/* Vehicle Information */}
            {parsedData && (
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-4">Vehicle Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-700">Make:</span> {parsedData.vehicle?.make || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Model:</span> {parsedData.vehicle?.model || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Year:</span> {parsedData.vehicle?.year || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Condition:</span> {parsedData.vehicle?.condition || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Mileage:</span> {parsedData.vehicle?.mileage ? `${parsedData.vehicle.mileage.toLocaleString()} mi` : 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Drivetrain:</span> {parsedData.vehicle?.drivetrain || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Fuel Type:</span> {parsedData.vehicle?.fuel_type || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Engine:</span> {parsedData.vehicle?.engine || 'N/A'}
                  </div>
                </div>
              </div>
            )}

            {/* Colors */}
            {parsedData?.specs && (
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-4">Colors</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-700">Exterior:</span> {parsedData.specs.exterior_color || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Interior:</span> {parsedData.specs.interior_color || 'N/A'}
                  </div>
                </div>
              </div>
            )}

            {/* Images Summary */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-4">Images</h4>
              <div className="text-sm text-slate-600">
                {images.length > 0 ? (
                  <div>
                    <p>{images.length} images found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {images.filter(img => img.keep).length} selected for keeping
                    </p>
                  </div>
                ) : (
                  <p>No images found</p>
                )}
              </div>
            </div>

            {/* Original URL */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-900 mb-4">Source</h4>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-mono text-slate-600 break-all">
                    {post.url}
                  </p>
                </div>
                <button
                  onClick={handleViewOriginal}
                  className="btn btn-secondary btn-sm flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Original
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
