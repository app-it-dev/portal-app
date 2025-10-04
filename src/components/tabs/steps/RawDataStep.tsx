'use client';

import { useState, useEffect } from 'react';
import { Play, Clipboard, Trash2, Loader2 } from 'lucide-react';
import type { PostRow } from '@/types';
import { toast } from 'sonner';

interface RawDataStepProps {
  post: PostRow;
  onSave: (content: string) => void;
  onNext: () => void;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
}

export function RawDataStep({ post, onSave, onNext, onAnalyze, isAnalyzing }: RawDataStepProps) {
  const [content, setContent] = useState(post.rawContent || '');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [shouldAutoAdvance, setShouldAutoAdvance] = useState(false);
  const [isLocalAnalyzing, setIsLocalAnalyzing] = useState(false);

  useEffect(() => {
    setContent(post.rawContent || '');
  }, [post.rawContent]);

  // Auto-advance when analysis completes and data is ready
  useEffect(() => {
    console.log('Auto-advance check:', {
      shouldAutoAdvance,
      hasParsedJson: !!post.parsedJson,
      isAnalyzing,
      postStatus: post.status,
      stepCompleted: post.stepCompleted,
      isRawStepCompleted: post.stepCompleted?.raw
    });
    
    // Only auto-advance if:
    // 1. We should auto-advance (analysis completed)
    // 2. We have parsed JSON data
    // 3. We're not currently analyzing
    // 4. The raw step is actually completed (this ensures n8n workflow finished)
    if (shouldAutoAdvance && post.parsedJson && !isAnalyzing && post.stepCompleted?.raw) {
      console.log('Auto-advancing to next step...');
      setShouldAutoAdvance(false);
      // Small delay to ensure UI is ready
      setTimeout(() => {
        onNext();
      }, 300);
    }
  }, [shouldAutoAdvance, post.parsedJson, isAnalyzing, onNext, post.status, post.stepCompleted]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setContent(text);
      onSave(text);
      toast.success('Content pasted successfully');
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      toast.error('Failed to read clipboard');
    }
  };

  const handleClear = () => {
    setContent('');
    onSave('');
    toast.success('Content cleared');
  };

  const handleAnalyzeClick = async () => {
    if (!content.trim()) {
      toast.error('Please paste content first');
      return;
    }
    
    // Clear any previous errors
    setAnalysisError(null);
    
    // Save content first (synchronous)
    onSave(content);
    
    // Start analysis immediately
    if (onAnalyze) {
      try {
        console.log('Starting analysis...');
        setIsLocalAnalyzing(true);
        await onAnalyze();
        console.log('Analysis completed, setting auto-advance...');
        toast.success('Analysis completed successfully');
        
        // Trigger auto-advance when data is ready
        setShouldAutoAdvance(true);
      } catch (error) {
        console.error('Analysis failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Don't show error for aborted analyses (user switched to another post)
        if (errorMessage.includes('timed out') || errorMessage.includes('aborted')) {
          console.log('Analysis was cancelled or timed out');
          setAnalysisError(null);
        } else {
          setAnalysisError(errorMessage);
          toast.error('Analysis failed. Please check your connection and try again.');
        }
      } finally {
        setIsLocalAnalyzing(false);
      }
    }
  };

  const canProceed = post.parsedJson && !isAnalyzing;
  const isActuallyAnalyzing = isAnalyzing || isLocalAnalyzing;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="section-padding py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Step 1: Raw Data</h3>
            <p className="text-sm text-slate-600 mt-1">
              Paste the raw page content from the car listing
            </p>
          </div>
          {canProceed && (
            <div className="flex items-center gap-2 text-green-600">
              <span className="text-sm font-medium">✓ Analysis Complete</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col">
        <div className="section-padding py-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base font-medium text-slate-700">Raw Page Content</h4>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">
                {content.length} characters
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClear}
                  className="btn btn-sm btn-secondary flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </button>
                <button
                  onClick={handlePaste}
                  className="btn btn-sm btn-secondary flex items-center gap-2"
                >
                  <Clipboard className="w-4 h-4" />
                  Paste
                </button>
                {onAnalyze && !canProceed && (
                  <button
                    onClick={handleAnalyzeClick}
                    disabled={!content.trim() || isActuallyAnalyzing}
                    className="btn btn-primary btn-sm flex items-center gap-2"
                  >
                    {isActuallyAnalyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {isActuallyAnalyzing ? 'Analyzing...' : (analysisError ? 'Retry Analysis' : 'Start Analysis')}
                  </button>
                )}
                {canProceed && (
                  <button
                    onClick={onNext}
                    className="btn btn-sm btn-primary flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Next: Review Details
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="section-padding py-4">
          <div className="flex flex-col gap-4">
            <div>
              <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Paste the raw page content here..."
                className="w-full min-h-[400px] text-sm border border-slate-200 rounded-lg p-4 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Analysis Error */}
            {analysisError && (
              <div className="border-t border-slate-200 pt-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-xs">!</span>
                    </div>
                    <h4 className="text-sm font-medium text-red-800">Analysis Failed</h4>
                  </div>
                  <div className="text-sm text-red-700 mb-3">
                    <p className="mb-2">❌ {analysisError}</p>
                    <p className="text-xs text-red-600">
                      {analysisError.includes('timed out') 
                        ? 'The AI analysis is taking longer than expected. This can happen with complex content. Please try again.'
                        : 'Please try again. If the problem persists, check your internet connection.'
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => setAnalysisError(null)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="section-padding py-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              {content.trim() ? (
                <span className="text-green-600">✓ Content ready for analysis</span>
              ) : (
                <span>Paste content to continue</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
