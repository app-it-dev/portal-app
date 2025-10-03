'use client';

import { useState, useCallback, useEffect } from 'react';
import { PostRow as PostRowType, AnalyzeState } from '@/types/Analyze';
import { analyzeContent, validatePostRow, autoArabic } from '@/utils/analyzeHelpers';
import { Play, AlertCircle, Loader2, Save, Copy, RotateCcw, Plus, Trash2, Wand2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface AnalyzeTabProps {
  rawContent: string;
  onRawContentChange: (content: string) => void;
}

interface FeaturePair {
  en: string;
  ar: string;
}

export function AnalyzeTab({ rawContent, onRawContentChange }: AnalyzeTabProps) {
  const [state, setState] = useState<AnalyzeState>({
    post: null,
    loading: false,
    error: null,
    dirty: false,
    rawContent: rawContent || ''
  });

  const [originalPost, setOriginalPost] = useState<PostRowType | null>(null);

  useEffect(() => {
    setState(prev => ({ ...prev, rawContent: rawContent || '' }));
  }, [rawContent]);

  const handleAnalyze = useCallback(async () => {
    if (!state.rawContent.trim()) {
      toast.error('Please enter raw content first');
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const post = await analyzeContent(state.rawContent);
      setState(prev => ({ ...prev, post, loading: false, dirty: false }));
      setOriginalPost(post);
      toast.success('Analysis completed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      toast.error(errorMessage);
    }
  }, [state.rawContent]);

  const handleClear = useCallback(() => {
    setState(prev => ({ ...prev, post: null, error: null, dirty: false }));
    setOriginalPost(null);
    onRawContentChange('');
  }, [onRawContentChange]);

  const handleSave = useCallback(() => {
    if (!state.post) return;
    
    const validation = validatePostRow(state.post);
    if (!validation.isValid) {
      toast.error(`Validation failed: ${validation.errors.join(', ')}`);
      return;
    }

    setState(prev => ({ ...prev, dirty: false }));
    toast.success('Post saved to memory');
  }, [state.post]);

  const handleCopyJson = useCallback(() => {
    if (!state.post) return;
    
    const json = JSON.stringify(state.post, null, 2);
    navigator.clipboard.writeText(json);
    toast.success('JSON copied to clipboard');
  }, [state.post]);

  const updatePost = useCallback((updates: Partial<PostRowType>) => {
    setState(prev => ({
      ...prev,
      post: prev.post ? { ...prev.post, ...updates } : null,
      dirty: true
    }));
  }, []);

  const updateTranslation = useCallback((field: keyof PostRowType['translations'], value: string | string[] | null) => {
    setState(prev => ({
      ...prev,
      post: prev.post ? {
        ...prev.post,
        translations: { ...prev.post.translations, [field]: value }
      } : null,
      dirty: true
    }));
  }, []);

  const resetSection = useCallback((section: string) => {
    if (!originalPost) return;
    
    switch (section) {
      case 'vehicle':
        updatePost({
          make: originalPost.make,
          model: originalPost.model,
          year: originalPost.year,
          vin: originalPost.vin,
          condition: originalPost.condition,
          drivetrain: originalPost.drivetrain,
          fuel: originalPost.fuel,
          engine: originalPost.engine,
          mileage: originalPost.mileage,
          mileage_unit: originalPost.mileage_unit,
          price: originalPost.price
        });
        break;
      case 'location':
        updatePost({
          country: originalPost.country,
          state: originalPost.state,
          city: originalPost.city
        });
        break;
      case 'colors':
        updatePost({
          exterior_color: originalPost.exterior_color,
          interior_color: originalPost.interior_color
        });
        break;
    }
  }, [originalPost, updatePost]);

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
      <div className="form-spacing-sm">
        <div className="flex items-center justify-between">
          <h5 className="text-base font-medium text-slate-700">{title}</h5>
          <div className="flex gap-3">
            <button
              onClick={autoFillArabic}
              className="text-sm px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center gap-2 border border-blue-200"
            >
              <Wand2 className="w-4 h-4" />
              Auto-fill Arabic
            </button>
            <button
              onClick={addPair}
              className="text-sm px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 flex items-center gap-2 border border-green-200"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>
        
                      <div className="space-y-2">
          {pairs.map((pair, index) => (
            <div key={index} className="grid grid-cols-2 gap-3 items-center">
              <input
                type="text"
                value={pair.en}
                onChange={(e) => updatePair(index, 'en', e.target.value)}
                placeholder="English feature"
                className="input"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pair.ar}
                  onChange={(e) => updatePair(index, 'ar', e.target.value)}
                  placeholder="Arabic feature"
                  className="input flex-1"
                  dir="rtl"
                />
                {pairs.length > 1 && (
                  <button
                    onClick={() => removePair(index)}
                    className="px-2 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }, []);

  const validation = state.post ? validatePostRow(state.post) : { isValid: false, errors: [] };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between section-padding py-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Raw & Analyze</h3>
        <div className="flex items-center gap-3">
          {state.post && validation.isValid && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
              <CheckCircle2 className="w-4 h-4" />
              Matches public.posts (subset)
            </div>
          )}
          {state.dirty && (
            <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              Unsaved changes
            </div>
          )}
        </div>
      </div>

      {state.error && (
        <div className="flex items-center gap-3 section-padding py-4 bg-red-50 border-b border-red-200">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="text-sm text-red-800">{state.error}</div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left side - Raw Content */}
        <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col">
          <div className="section-padding py-4 border-b border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-medium text-slate-700">Raw Page Content</h4>
              <span className="text-sm text-slate-500">
                {state.rawContent.length} characters
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAnalyze}
                disabled={!state.rawContent.trim() || state.loading}
                className="btn btn-primary btn-sm flex-1"
              >
                {state.loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Analyze
              </button>
              <button
                onClick={handleClear}
                className="btn btn-secondary btn-sm"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="flex-1 section-padding py-4">
            <textarea
              value={state.rawContent}
              onChange={(e) => {
                const content = e.target.value;
                setState(prev => ({ ...prev, rawContent: content }));
                onRawContentChange(content);
              }}
              placeholder="Paste the raw page content here..."
              className="w-full h-full text-sm border border-slate-200 rounded-lg p-4 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Right side - Analysis Results */}
        <div className="flex-1 flex flex-col">
          {!state.post && !state.loading && (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                  <Play className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-lg font-medium mb-2">No analysis results yet</p>
                <p className="text-sm">Click &ldquo;Analyze&rdquo; to process the raw content</p>
              </div>
            </div>
          )}

          {state.loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin text-blue-500" />
                <p className="text-base text-slate-600">Analyzing content...</p>
              </div>
            </div>
          )}

          {state.post && (
            <>
              {/* Actions bar */}
              <div className="section-padding py-4 border-b border-slate-200">
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={!validation.isValid}
                    className="btn btn-primary btn-sm"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </button>
                  <button
                    onClick={handleCopyJson}
                    className="btn btn-secondary btn-sm"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy JSON
                  </button>
                </div>
              </div>

              {/* Form content */}
              <div className="flex-1 overflow-y-auto section-padding py-4">
                <div className="responsive-grid-2 gap-6">
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
                          value={state.post.make}
                          onChange={(e) => updatePost({ make: e.target.value })}
                          className="input-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">Model *</label>
                        <input
                          type="text"
                          value={state.post.model}
                          onChange={(e) => updatePost({ model: e.target.value })}
                          className="input-sm"
                        />
                      </div>
                    </div>

                    <div className="responsive-grid-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">Year *</label>
                        <input
                          type="number"
                          value={state.post.year}
                          onChange={(e) => updatePost({ year: parseInt(e.target.value) || new Date().getFullYear() })}
                          className="input-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">VIN</label>
                        <input
                          type="text"
                          value={state.post.vin || ''}
                          onChange={(e) => updatePost({ vin: e.target.value || null })}
                          className="input-sm"
                        />
                      </div>
                    </div>

                    <div className="responsive-grid-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">Condition *</label>
                        <select
                          value={state.post.condition}
                          onChange={(e) => updatePost({ condition: e.target.value as 'New' | 'Used' | 'Certified' })}
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
                          value={state.post.drivetrain || ''}
                          onChange={(e) => updatePost({ drivetrain: (e.target.value as 'FWD' | 'RWD' | 'AWD' | '4WD') || null })}
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
                          value={state.post.fuel || ''}
                          onChange={(e) => updatePost({ fuel: (e.target.value as 'Gasoline' | 'Diesel' | 'Electric' | 'Hybrid') || null })}
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
                          value={state.post.engine || ''}
                          onChange={(e) => updatePost({ engine: e.target.value || null })}
                          className="input-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="text-xs font-medium text-slate-700 block mb-1">Mileage</label>
                        <input
                          type="number"
                          value={state.post.mileage || ''}
                          onChange={(e) => updatePost({ mileage: parseInt(e.target.value) || null })}
                          className="input-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">Unit</label>
                        <select
                          value={state.post.mileage_unit}
                          onChange={(e) => updatePost({ mileage_unit: e.target.value as 'mi' | 'km' })}
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
                        value={state.post.price}
                        onChange={(e) => updatePost({ price: parseInt(e.target.value) || 0 })}
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
                            value={state.post.country}
                            onChange={(e) => updatePost({ country: e.target.value })}
                            className="input-sm"
                          />
                        </div>
                        <div className="responsive-grid-2 gap-2">
                          <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">State</label>
                            <input
                              type="text"
                              value={state.post.state || ''}
                              onChange={(e) => updatePost({ state: e.target.value || null })}
                              className="input-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">City</label>
                            <input
                              type="text"
                              value={state.post.city || ''}
                              onChange={(e) => updatePost({ city: e.target.value || null })}
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
                            value={state.post.exterior_color || ''}
                            onChange={(e) => updatePost({ exterior_color: e.target.value || null })}
                            className="input-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-700 block mb-1">Interior</label>
                          <input
                            type="text"
                            value={state.post.interior_color || ''}
                            onChange={(e) => updatePost({ interior_color: e.target.value || null })}
                            className="input-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Car History Checkboxes */}
                <div className="mt-6">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-3">Car History</label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="no-accident-history"
                          checked={state.post?.car_history?.no_accident_history || false}
                          onChange={(e) => {
                            updatePost({
                              car_history: {
                                ...state.post?.car_history,
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
                          checked={state.post?.car_history?.full_service_history || false}
                          onChange={(e) => {
                            updatePost({
                              car_history: {
                                ...state.post?.car_history,
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
                          checked={state.post?.car_history?.single_owner || false}
                          onChange={(e) => {
                            updatePost({
                              car_history: {
                                ...state.post?.car_history,
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
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-slate-900 mb-4">Translations (Arabic)</h4>
                  <div className="responsive-grid-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">Title (AR)</label>
                      <input
                        type="text"
                        value={state.post.translations.title_ar || ''}
                        onChange={(e) => updateTranslation('title_ar', e.target.value || '')}
                        className="input text-sm"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">Make (AR)</label>
                      <input
                        type="text"
                        value={state.post.translations.make_ar || ''}
                        onChange={(e) => updateTranslation('make_ar', e.target.value || null)}
                        className="input text-sm"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">Model (AR)</label>
                      <input
                        type="text"
                        value={state.post.translations.model_ar || ''}
                        onChange={(e) => updateTranslation('model_ar', e.target.value || null)}
                        className="input text-sm"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">Engine (AR)</label>
                      <input
                        type="text"
                        value={state.post.translations.engine_ar || ''}
                        onChange={(e) => updateTranslation('engine_ar', e.target.value || null)}
                        className="input text-sm"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">Fuel (AR)</label>
                      <input
                        type="text"
                        value={state.post.translations.fuel_ar || ''}
                        onChange={(e) => updateTranslation('fuel_ar', e.target.value || null)}
                        className="input text-sm"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">Drivetrain (AR)</label>
                      <input
                        type="text"
                        value={state.post.translations.drivetrain_ar || ''}
                        onChange={(e) => updateTranslation('drivetrain_ar', e.target.value || null)}
                        className="input text-sm"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">Exterior Color (AR)</label>
                      <input
                        type="text"
                        value={state.post.translations.exterior_color_ar || ''}
                        onChange={(e) => updateTranslation('exterior_color_ar', e.target.value || null)}
                        className="input text-sm"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">Interior Color (AR)</label>
                      <input
                        type="text"
                        value={state.post.translations.interior_color_ar || ''}
                        onChange={(e) => updateTranslation('interior_color_ar', e.target.value || null)}
                        className="input text-sm"
                        dir="rtl"
                      />
                    </div>
                  </div>
                </div>

                {/* Feature Editors */}
                <div className="mt-8 form-spacing">
                  {renderFeatureEditor(
                    'Exterior Features',
                    state.post.exterior_features || [],
                    state.post.translations.exterior_features_ar,
                    (en, ar) => {
                      updatePost({ exterior_features: en });
                      updateTranslation('exterior_features_ar', ar);
                    }
                  )}

                  {renderFeatureEditor(
                    'Interior Features',
                    state.post.interior_features || [],
                    state.post.translations.interior_features_ar,
                    (en, ar) => {
                      updatePost({ interior_features: en });
                      updateTranslation('interior_features_ar', ar);
                    }
                  )}

                  {renderFeatureEditor(
                    'Safety & Tech Features',
                    state.post.safety_tech || [],
                    state.post.translations.safety_tech_ar,
                    (en, ar) => {
                      updatePost({ safety_tech: en });
                      updateTranslation('safety_tech_ar', ar);
                    }
                  )}
                </div>

                {/* Validation Errors */}
                {!validation.isValid && validation.errors.length > 0 && (
                  <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
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
      </div>
    </div>
  );
}
