'use client';

import { CheckCircle, ArrowRight } from 'lucide-react';
import type { WorkflowStep } from '@/types';

interface WorkflowStepIndicatorProps {
  currentStep: WorkflowStep;
  completedSteps: {
    raw?: boolean;
    details?: boolean;
    images?: boolean;
    pricing?: boolean;
  };
}

const steps = [
  { id: 'raw' as const, label: 'Raw Data' },
  { id: 'details' as const, label: 'Details' },
  { id: 'images' as const, label: 'Images' },
  { id: 'pricing' as const, label: 'Pricing' },
];

export function WorkflowStepIndicator({ currentStep, completedSteps }: WorkflowStepIndicatorProps) {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="section-padding py-2 border-b border-slate-200 bg-slate-50/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          {steps.map((step, index) => {
            const isCompleted = completedSteps[step.id];
            const isCurrent = step.id === currentStep;
            const isPast = index < currentStepIndex;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center">
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                    ${isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isCurrent 
                        ? 'bg-blue-500 text-white' 
                        : isPast
                          ? 'bg-slate-300 text-slate-600'
                          : 'bg-slate-200 text-slate-500'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <div className="ml-1">
                    <div className={`text-xs font-medium ${
                      isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-slate-500'
                    }`}>
                      {step.label}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-400 mx-2" />
                )}
              </div>
            );
          })}
        </div>
        
        <div className="text-xs text-slate-600">
          Step {currentStepIndex + 1} of {steps.length}
        </div>
      </div>
    </div>
  );
}
