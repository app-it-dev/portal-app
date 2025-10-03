'use client';

import { useCallback } from 'react';
import { useSupabaseStore as useStore } from '@/store/supabase-store';
import type { PostRow, WorkflowStep } from '@/types';
import { WorkflowStepIndicator } from '@/components/WorkflowStepIndicator';
import { RawDataStep } from './steps/RawDataStep';
import { DetailsStep } from './steps/DetailsStep';
import { ImagesStep } from './steps/ImagesStep';
import { PricingStep } from './steps/PricingStep';

interface WorkflowTabProps {
  post: PostRow;
}

export function WorkflowTab({ post }: WorkflowTabProps) {
  const { 
    saveRaw, 
    analyze, 
    saveDetails,
    acceptImages, 
    savePricing,
    finalizePost,
    setWorkflowStep 
  } = useStore();

  const currentStep = post.workflowStep || 'raw';
  const completedSteps = post.stepCompleted || {};
  
  // Read analyzing state from the post's status in the store
  const isAnalyzing = post.status === 'analyzing';

  const handleRawDataSave = useCallback((content: string) => {
    saveRaw(post.id, content);
  }, [post.id, saveRaw]);

  const handleAnalyze = useCallback(async () => {
    try {
      await analyze(post.id);
    } catch (error) {
      console.error('Analysis failed:', error);
      throw error; // Re-throw so RawDataStep can handle it
    }
  }, [post.id, analyze]);

  const handleSaveDetails = useCallback((data: any) => {
    saveDetails(post.id, data);
  }, [post.id, saveDetails]);

  const handleAcceptImages = useCallback(() => {
    acceptImages(post.id);
  }, [post.id, acceptImages]);

  const handleSavePricing = useCallback((pricing: any) => {
    savePricing(post.id, pricing);
  }, [post.id, savePricing]);

  const handleFinalize = useCallback(() => {
    finalizePost(post.id);
  }, [post.id, finalizePost]);

  const canProceedToDetails = completedSteps.raw && post.rawContent?.trim() && post.parsedJson && post.status === 'parsed';
  const canProceedToImages = Boolean(completedSteps.details);
  const canProceedToPricing = (post.images?.length > 0);
  const canComplete = Boolean(completedSteps.pricing);

  return (
    <div className="flex flex-col bg-white">
      {/* Workflow Step Indicator */}
      <WorkflowStepIndicator 
        currentStep={currentStep}
        completedSteps={completedSteps}
      />

      {/* Step Content */}
      <div className="flex-1">
        {currentStep === 'raw' && (
          <RawDataStep
            post={post}
            onSave={handleRawDataSave}
            onNext={() => setWorkflowStep(post.id, 'details')}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
        )}

        {currentStep === 'details' && (
          <DetailsStep
            post={post}
            onSave={handleSaveDetails}
            onNext={() => setWorkflowStep(post.id, 'images')}
            onBack={() => setWorkflowStep(post.id, 'raw')}
            onReset={() => setWorkflowStep(post.id, 'raw')}
          />
        )}

        {currentStep === 'images' && (
          <ImagesStep
            post={post}
            onAccept={handleAcceptImages}
            onNext={() => setWorkflowStep(post.id, 'pricing')}
            onBack={() => setWorkflowStep(post.id, 'details')}
            canProceed={canProceedToPricing}
          />
        )}

        {currentStep === 'pricing' && (
          <PricingStep
            post={post}
            onSave={handleSavePricing}
            onNext={() => setWorkflowStep(post.id, 'complete')}
            onBack={() => setWorkflowStep(post.id, 'images')}
            canProceed={canProceedToPricing}
          />
        )}

        {currentStep === 'complete' && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Post Complete!</h3>
              <p className="text-slate-600">This post has been fully processed and is ready for use.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
