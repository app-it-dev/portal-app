'use client';

import { useState, useCallback, useEffect } from 'react';
import { Play, CheckCircle, Loader2, AlertCircle, RotateCcw, Save, Copy, Plus, Trash2, Wand2 } from 'lucide-react';
import type { PostRow } from '@/types';
import { analyzeContent, validatePostRow, autoArabic } from '@/utils/analyzeHelpers';
import { toast } from 'sonner';

interface AnalyzeStepProps {
  post: PostRow;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onAccept: () => void;
  canProceed: boolean;
}

interface FeaturePair {
  en: string;
  ar: string;
}

export function AnalyzeStep({ post, isAnalyzing, onAnalyze, onAccept, canProceed }: AnalyzeStepProps) {
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [originalResult, setOriginalResult] = useState<any>(null);

  // Initialize with existing parsed data if available
  useEffect(() => {
    if (post.parsedJson) {
      setAnalysisResult(post.parsedJson);
      setOriginalResult(post.parsedJson);
    }
  }, [post.parsedJson]);

  const handleAnalyze = useCallback(async () => {
    if (!post.rawContent?.trim()) {
      toast.error('No raw content to analyze');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await analyzeContent(post.rawContent);
      setAnalysisResult(result);
      setOriginalResult(result);
      setDirty(false);
      toast.success('Analysis completed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [post.rawContent]);

  const updateResult = useCallback((updates: any) => {
    setAnalysisResult((prev: any) => ({
      ...prev,
      ...updates
    }));
    setDirty(true);
  }, []);

  const updateTranslation = useCallback((field: string, value: string | string[] | null) => {
    setAnalysisResult((prev: any) => ({
      ...prev,
      translations: { ...prev.translations, [field]: value }
    }));
    setDirty(true);
  }, []);

  const resetSection = useCallback((section: string) => {
    if (!originalResult) return;
    
    switch (section) {
      case 'vehicle':
        updateResult({
          make: originalResult.make,
          model: originalResult.model,
          year: originalResult.year,
          vin: originalResult.vin,
          condition: originalResult.condition,
          drivetrain: originalResult.drivetrain,
          fuel: originalResult.fuel,
          engine: originalResult.engine,
          mileage: originalResult.mileage,
          mileage_unit: originalResult.mileage_unit,
          price: originalResult.price
        });
        break;
      case 'location':
        updateResult({
          country: originalResult.country,
          state: originalResult.state,
          city: originalResult.city
        });
        break;
      case 'colors':
        updateResult({
          exterior_color: originalResult.exterior_color,
          interior_color: originalResult.interior_color
        });
        break;
    }
  }, [originalResult, updateResult]);

  const handleSave = useCallback(() => {
    if (!analysisResult) return;
    
    const validation = validatePostRow(analysisResult);
    if (!validation.isValid) {
      toast.error(`Validation failed: ${validation.errors.join(', ')}`);
      return;
    }

    setDirty(false);
    toast.success('Changes saved');
  }, [analysisResult]);

  const handleCopyJson = useCallback(() => {
    if (!analysisResult) return;
    
    const json = JSON.stringify(analysisResult, null, 2);
    navigator.clipboard.writeText(json);
    toast.success('JSON copied to clipboard');
  }, [analysisResult]);

  const renderFeatureEditor = useCallback((
    title: string,
    enFeatures: string[],
    arFeatures: string[],
    onUpdate: (en: string[], ar: string[]) => void
  ) => {
    const pairs: FeaturePair[] = Math.max(enFeatures.length, arFeatures.length, 1) === 0 
      ? [{ en: '', ar: '' }]
      : Array.from({ length: Math.max(enFeatures.length, arFeatures.length, 1) }, (_, i) => ({
          en: enFeatures[i] || '',
          ar: arFeatures[i] || ''
        }));

    const updatePair = (index: number, field: 'en' | 'ar', value: string) => {
      const newPairs = [...pairs];
      newPairs[index] = { ...newPairs[index], [field]: value };
      
      const newEn = newPairs.map(p => p.en).filter(Boolean);
      const newAr = newPairs.map(p => p.ar);
      onUpdate(newEn, newAr);
    };

    const addPair = () => {
      const newEn = [...enFeatures, ''];
      const newAr = [...arFeatures, ''];
      onUpdate(newEn, newAr);
    };

    const removePair = (index: number) => {
      const newEn = enFeatures.filter((_, i) => i !== index);
      const newAr = arFeatures.filter((_, i) => i !== index);
      onUpdate(newEn, newAr);
    };

    const autoFillArabic = () => {
      const newAr = enFeatures.map((en, index) => {
        if (arFeatures[index]) return arFeatures[index];
        return autoArabic(en) || '';
      });
      onUpdate(enFeatures, newAr);
    };

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-sm font-medium text-slate-700">{title}</h5>
          <div className="flex gap-1">
            <button
              onClick={autoFillArabic}
              className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center gap-1 border border-blue-200"
              title="Auto-fill Arabic"
            >
              <Wand2 className="w-3 h-3" />
              Auto
            </button>
            <button
              onClick={addPair}
              className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 flex items-center gap-1 border border-green-200"
              title="Add feature"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
        </div>
        
        <div className="space-y-1">
          {pairs.map((pair, index) => (
            <div key={index} className="grid grid-cols-2 gap-2 items-center">
              <input
                type="text"
                value={pair.en}
                onChange={(e) => updatePair(index, 'en', e.target.value)}
                placeholder="English feature"
                className="input-sm"
              />
              <div className="flex gap-1">
                <input
                  type="text"
                  value={pair.ar}
                  onChange={(e) => updatePair(index, 'ar', e.target.value)}
                  placeholder="Arabic feature"
                  className="input-sm flex-1"
                  dir="rtl"
                />
                {pairs.length > 1 && (
                  <button
                    onClick={() => removePair(index)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Remove feature"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }, []);

  const validation = analysisResult ? validatePostRow(analysisResult) : { isValid: false, errors: [] };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="section-padding py-2 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Step 2: AI Analysis</h3>
            <p className="text-xs text-slate-600">
              AI will extract vehicle information from the raw content
            </p>
          </div>
          <div className="flex items-center gap-2">
            {analysisResult && validation.isValid && (
              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                <CheckCircle className="w-3 h-3" />
                Valid
              </div>
            )}
            {dirty && (
              <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                Unsaved
              </div>
            )}
            {canProceed && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Complete</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!analysisResult && !isProcessing && !error && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-lg font-medium mb-2">Ready to analyze</p>
              <p className="text-sm text-slate-600 mb-6">Click the button below to start AI analysis</p>
              <button
                onClick={handleAnalyze}
                disabled={!post.rawContent?.trim()}
                className="btn btn-primary btn-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Analysis
              </button>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin text-blue-500" />
              <p className="text-base text-slate-600">Analyzing content...</p>
              <p className="text-sm text-slate-500 mt-2">This may take a few moments</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-lg font-medium mb-2 text-red-800">Analysis Failed</p>
              <p className="text-sm text-red-600 mb-6">{error}</p>
              <button
                onClick={handleAnalyze}
                className="btn btn-primary"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </button>
            </div>
          </div>
        )}

        {analysisResult && (
          <>
            {/* Actions bar */}
            <div className="section-padding py-2 border-b border-slate-200 flex-shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={!validation.isValid}
                  className="btn btn-primary btn-xs"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </button>
                <button
                  onClick={handleCopyJson}
                  className="btn btn-secondary btn-xs"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy JSON
                </button>
              </div>
            </div>

            {/* Form content */}
            <div className="flex-1 overflow-y-auto section-padding py-3">
              <div className="responsive-grid-2 gap-4">
                {/* Vehicle Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">Vehicle</h4>
                    <button
                      onClick={() => resetSection('vehicle')}
                      className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  </div>
                  
                  <div className="responsive-grid-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">Make *</label>
                      <input
                        type="text"
                        value={analysisResult.make || ''}
                        onChange={(e) => updateResult({ make: e.target.value })}
                        className="input-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">Model *</label>
                      <input
                        type="text"
                        value={analysisResult.model || ''}
                        onChange={(e) => updateResult({ model: e.target.value })}
                        className="input-sm"
                      />
                    </div>
                  </div>

                  <div className="responsive-grid-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">Year *</label>
                      <input
                        type="number"
                        value={analysisResult.year || ''}
                        onChange={(e) => updateResult({ year: parseInt(e.target.value) || new Date().getFullYear() })}
                        className="input-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">VIN</label>
                      <input
                        type="text"
                        value={analysisResult.vin || ''}
                        onChange={(e) => updateResult({ vin: e.target.value || null })}
                        className="input-sm"
                      />
                    </div>
                  </div>

                  <div className="responsive-grid-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">Condition *</label>
                      <select
                        value={analysisResult.condition || ''}
                        onChange={(e) => updateResult({ condition: e.target.value as 'New' | 'Used' | 'Certified' })}
                        className="input-sm"
                      >
                        <option value="New">New</option>
                        <option value="Used">Used</option>
                        <option value="Certified">Certified</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">Drivetrain</label>
                      <select
                        value={analysisResult.drivetrain || ''}
                        onChange={(e) => updateResult({ drivetrain: (e.target.value as 'FWD' | 'RWD' | 'AWD' | '4WD') || null })}
                        className="input-sm"
                      >
                        <option value="">Select...</option>
                        <option value="FWD">FWD</option>
                        <option value="RWD">RWD</option>
                        <option value="AWD">AWD</option>
                        <option value="4WD">4WD</option>
                      </select>
                    </div>
                  </div>

                  <div className="responsive-grid-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">Fuel</label>
                      <select
                        value={analysisResult.fuel || ''}
                        onChange={(e) => updateResult({ fuel: (e.target.value as 'Gasoline' | 'Diesel' | 'Electric' | 'Hybrid') || null })}
                        className="input-sm"
                      >
                        <option value="">Select...</option>
                        <option value="Gasoline">Gasoline</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Electric">Electric</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">Engine</label>
                      <input
                        type="text"
                        value={analysisResult.engine || ''}
                        onChange={(e) => updateResult({ engine: e.target.value || null })}
                        className="input-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-slate-700 block mb-1">Mileage</label>
                      <input
                        type="number"
                        value={analysisResult.mileage || ''}
                        onChange={(e) => updateResult({ mileage: parseInt(e.target.value) || null })}
                        className="input-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">Unit</label>
                      <select
                        value={analysisResult.mileage_unit || 'mi'}
                        onChange={(e) => updateResult({ mileage_unit: e.target.value as 'mi' | 'km' })}
                        className="input-sm"
                      >
                        <option value="mi">mi</option>
                        <option value="km">km</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">Price *</label>
                    <input
                      type="number"
                      value={analysisResult.price || ''}
                      onChange={(e) => updateResult({ price: parseInt(e.target.value) || 0 })}
                      className="input text-sm"
                    />
                  </div>
                </div>

                {/* Location, Colors, and other sections */}
                <div className="space-y-2">
                  {/* Location */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-slate-900">Location</h4>
                      <button
                        onClick={() => resetSection('location')}
                        className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">Country *</label>
                        <input
                          type="text"
                          value={analysisResult.country || ''}
                          onChange={(e) => updateResult({ country: e.target.value })}
                          className="input-sm"
                        />
                      </div>
                      <div className="responsive-grid-2 gap-2">
                        <div>
                          <label className="text-xs font-medium text-slate-700 block mb-1">State</label>
                          <input
                            type="text"
                            value={analysisResult.state || ''}
                            onChange={(e) => updateResult({ state: e.target.value || null })}
                            className="input-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-700 block mb-1">City</label>
                          <input
                            type="text"
                            value={analysisResult.city || ''}
                            onChange={(e) => updateResult({ city: e.target.value || null })}
                            className="input-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Colors */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-slate-900">Colors</h4>
                      <button
                        onClick={() => resetSection('colors')}
                        className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                      </button>
                    </div>
                    
                    <div className="responsive-grid-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">Exterior</label>
                        <input
                          type="text"
                          value={analysisResult.exterior_color || ''}
                          onChange={(e) => updateResult({ exterior_color: e.target.value || null })}
                          className="input-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">Interior</label>
                        <input
                          type="text"
                          value={analysisResult.interior_color || ''}
                          onChange={(e) => updateResult({ interior_color: e.target.value || null })}
                          className="input-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Car History Checkboxes */}
              <div className="mt-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Car History</label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="no-accident-history"
                        checked={analysisResult?.car_history?.no_accident_history || false}
                        onChange={(e) => {
                          updateResult({
                            car_history: {
                              ...analysisResult?.car_history,
                              no_accident_history: e.target.checked
                            }
                          });
                        }}
                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="no-accident-history" className="ml-2 text-xs text-slate-700">
                        No Accident History
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="full-service-history"
                        checked={analysisResult?.car_history?.full_service_history || false}
                        onChange={(e) => {
                          updateResult({
                            car_history: {
                              ...analysisResult?.car_history,
                              full_service_history: e.target.checked
                            }
                          });
                        }}
                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="full-service-history" className="ml-2 text-xs text-slate-700">
                        Full Service History
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="single-owner"
                        checked={analysisResult?.car_history?.single_owner || false}
                        onChange={(e) => {
                          updateResult({
                            car_history: {
                              ...analysisResult?.car_history,
                              single_owner: e.target.checked
                            }
                          });
                        }}
                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="single-owner" className="ml-2 text-xs text-slate-700">
                        Single Owner
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arabic Translations */}
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Translations (Arabic)</h4>
                <div className="responsive-grid-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">Title (AR)</label>
                    <input
                      type="text"
                      value={analysisResult.translations?.title_ar || ''}
                      onChange={(e) => updateTranslation('title_ar', e.target.value || '')}
                      className="input text-sm"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">Make (AR)</label>
                    <input
                      type="text"
                      value={analysisResult.translations?.make_ar || ''}
                      onChange={(e) => updateTranslation('make_ar', e.target.value || null)}
                      className="input text-sm"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">Model (AR)</label>
                    <input
                      type="text"
                      value={analysisResult.translations?.model_ar || ''}
                      onChange={(e) => updateTranslation('model_ar', e.target.value || null)}
                      className="input text-sm"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">Engine (AR)</label>
                    <input
                      type="text"
                      value={analysisResult.translations?.engine_ar || ''}
                      onChange={(e) => updateTranslation('engine_ar', e.target.value || null)}
                      className="input text-sm"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">Fuel (AR)</label>
                    <input
                      type="text"
                      value={analysisResult.translations?.fuel_ar || ''}
                      onChange={(e) => updateTranslation('fuel_ar', e.target.value || null)}
                      className="input text-sm"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">Drivetrain (AR)</label>
                    <input
                      type="text"
                      value={analysisResult.translations?.drivetrain_ar || ''}
                      onChange={(e) => updateTranslation('drivetrain_ar', e.target.value || null)}
                      className="input text-sm"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">Exterior Color (AR)</label>
                    <input
                      type="text"
                      value={analysisResult.translations?.exterior_color_ar || ''}
                      onChange={(e) => updateTranslation('exterior_color_ar', e.target.value || null)}
                      className="input text-sm"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">Interior Color (AR)</label>
                    <input
                      type="text"
                      value={analysisResult.translations?.interior_color_ar || ''}
                      onChange={(e) => updateTranslation('interior_color_ar', e.target.value || null)}
                      className="input text-sm"
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              {/* Feature Editors */}
              <div className="mt-4">
                {renderFeatureEditor(
                  'Exterior Features',
                  analysisResult.exterior_features || [],
                  analysisResult.translations?.exterior_features_ar || [],
                  (en, ar) => {
                    updateResult({ exterior_features: en });
                    updateTranslation('exterior_features_ar', ar);
                  }
                )}

                {renderFeatureEditor(
                  'Interior Features',
                  analysisResult.interior_features || [],
                  analysisResult.translations?.interior_features_ar || [],
                  (en, ar) => {
                    updateResult({ interior_features: en });
                    updateTranslation('interior_features_ar', ar);
                  }
                )}

                {renderFeatureEditor(
                  'Safety & Tech Features',
                  analysisResult.safety_tech || [],
                  analysisResult.translations?.safety_tech_ar || [],
                  (en, ar) => {
                    updateResult({ safety_tech: en });
                    updateTranslation('safety_tech_ar', ar);
                  }
                )}
              </div>

              {/* Validation Errors */}
              {!validation.isValid && validation.errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h5 className="text-sm font-medium text-red-800 mb-3">Validation Errors:</h5>
                  <ul className="text-sm text-red-700 space-y-2">
                    {validation.errors.map((error, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="section-padding py-2 border-t border-slate-200 bg-slate-50/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-600">
            {analysisResult ? (
              <span className="text-green-600">✓ Analysis complete - Review and edit data above</span>
            ) : (
              <span>Run analysis to continue</span>
            )}
          </div>
          <button
            onClick={onAccept}
            disabled={!canProceed}
            className="btn btn-primary btn-xs flex items-center gap-1"
          >
            <CheckCircle className="w-3 h-3" />
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
