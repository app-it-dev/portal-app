'use client';

import { useState, useEffect } from 'react';
import { Save, RotateCcw, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import type { PostRow } from '@/types';
import { toast } from 'sonner';

interface DetailsStepProps {
  post: PostRow;
  onSave: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  onReset: () => void;
}

// Helper function to flatten nested parsed data for form display
const flattenParsedData = (parsedJson: any) => {
  return {
    // Basic vehicle info
    vin: parsedJson.vehicle?.vin || '',
    make: parsedJson.vehicle?.make || '',
    model: parsedJson.vehicle?.model || '',
    year: parsedJson.vehicle?.year || '',
    engine: parsedJson.vehicle?.engine || '',
    fuel: parsedJson.vehicle?.fuel_type || '',
    drivetrain: parsedJson.vehicle?.drivetrain || '',
    mileage: parsedJson.vehicle?.mileage || '',
    mileage_unit: parsedJson.mileage_unit || '',
    country: parsedJson.country || '',
    state: parsedJson.state || '',
    city: parsedJson.city || '',
    condition: parsedJson.vehicle?.condition || '',
    price: parsedJson.price || '',
    exterior_color: parsedJson.specs?.exterior_color || '',
    interior_color: parsedJson.specs?.interior_color || '',
    // Features arrays - prioritize root level, then specs
    exterior_features: parsedJson.exterior_features || parsedJson.specs?.exterior_features || [],
    interior_features: parsedJson.interior_features || parsedJson.specs?.interior_features || [],
    safety_tech: parsedJson.safety_tech || parsedJson.specs?.safety_and_tech || [],
    // Car history
    car_history: parsedJson.extras?.car_history || {},
    // Arabic translations
    translations: parsedJson.translations || {},
  };
};

export function DetailsStep({ post, onSave, onNext, onBack, onReset }: DetailsStepProps) {
  const [formData, setFormData] = useState<any>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (post.parsedJson) {
      console.log('Raw parsedJson:', post.parsedJson);
      const flattenedData = flattenParsedData(post.parsedJson);
      console.log('Flattened data:', flattenedData);
      console.log('Features:', {
        exterior_features: flattenedData.exterior_features,
        interior_features: flattenedData.interior_features,
        safety_tech: flattenedData.safety_tech
      });
      console.log('Safety tech details:', {
        raw: post.parsedJson?.safety_tech,
        specs: post.parsedJson?.specs?.safety_and_tech,
        final: flattenedData.safety_tech
      });
      console.log('Translations safety tech:', {
        raw_translations: post.parsedJson?.translations,
        safety_tech_ar: post.parsedJson?.translations?.safety_tech_ar
      });
      setFormData(flattenedData);
    }
  }, [post.parsedJson]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  // Helper function to add feature to both English and Arabic arrays
  const addFeatureToBoth = (fieldKey: string) => {
    const newArray = [...(formData[fieldKey] || []), ''];
    const translationKey = `${fieldKey}_ar`;
    const newTranslationArray = [...(formData.translations?.[translationKey] || []), ''];
    
    setFormData((prev: any) => ({
      ...prev,
      [fieldKey]: newArray,
      translations: {
        ...prev.translations,
        [translationKey]: newTranslationArray
      }
    }));
    setHasChanges(true);
  };

  // Helper function to remove feature from both English and Arabic arrays
  const removeFeatureFromBoth = (fieldKey: string, index: number) => {
    const newArray = (formData[fieldKey] || []).filter((_: any, i: number) => i !== index);
    const translationKey = `${fieldKey}_ar`;
    const newTranslationArray = (formData.translations?.[translationKey] || []).filter((_: any, i: number) => i !== index);
    
    setFormData((prev: any) => ({
      ...prev,
      [fieldKey]: newArray,
      translations: {
        ...prev.translations,
        [translationKey]: newTranslationArray
      }
    }));
    setHasChanges(true);
  };

  // Helper function to update feature in both arrays
  const updateFeatureInBoth = (fieldKey: string, index: number, value: string, isArabic: boolean = false) => {
    if (isArabic) {
      const translationKey = `${fieldKey}_ar`;
      const newArray = [...(formData.translations?.[translationKey] || [])];
      newArray[index] = value;
      setFormData((prev: any) => ({
        ...prev,
        translations: {
          ...prev.translations,
          [translationKey]: newArray
        }
      }));
    } else {
      const newArray = [...(formData[fieldKey] || [])];
      newArray[index] = value;
      setFormData((prev: any) => ({
        ...prev,
        [fieldKey]: newArray
      }));
    }
    setHasChanges(true);
  };

  const handleSave = () => {
    // Convert flattened form data back to nested structure
    const nestedData = {
      title: post.parsedJson?.title,
      notes: post.parsedJson?.notes,
      vehicle: {
        vin: formData.vin || null,
        make: formData.make || null,
        model: formData.model || null,
        year: formData.year ? parseInt(formData.year) : null,
        engine: formData.engine || null,
        fuel_type: formData.fuel || null,
        drivetrain: formData.drivetrain || null,
        mileage: formData.mileage ? parseInt(formData.mileage) : null,
        condition: formData.condition || null,
      },
      specs: {
        exterior_color: formData.exterior_color || null,
        interior_color: formData.interior_color || null,
        exterior_features: formData.exterior_features || [],
        interior_features: formData.interior_features || [],
        safety_and_tech: formData.safety_tech || [],
      },
      // Features at root level
      exterior_features: formData.exterior_features || [],
      interior_features: formData.interior_features || [],
      safety_tech: formData.safety_tech || [],
      extras: {
        car_history: formData.car_history || null,
        raw: post.parsedJson?.extras?.raw,
      },
      translations: formData.translations || post.parsedJson?.translations || {},
      // Additional fields
      mileage_unit: formData.mileage_unit || null,
      country: formData.country || null,
      state: formData.state || null,
      city: formData.city || null,
      price: formData.price ? parseInt(formData.price) : null,
    };
    onSave(nestedData);
    setHasChanges(false);
    toast.success('Details saved successfully');
  };

  const handleNext = () => {
    if (hasChanges) {
      handleSave();
    }
    onNext();
  };

  const handleReset = () => {
    if (post.parsedJson) {
      setFormData(flattenParsedData(post.parsedJson));
      setHasChanges(false);
      toast.success('Details reset to original values');
    }
  };

  // English-only fields (no translation needed)
  const englishOnlyFields = [
    { key: 'vin', label: 'VIN', type: 'text' },
    { key: 'year', label: 'Year', type: 'number' },
    { key: 'mileage', label: 'Mileage', type: 'number' },
    { key: 'mileage_unit', label: 'Mileage Unit', type: 'text' },
    { key: 'country', label: 'Country', type: 'text' },
    { key: 'state', label: 'State', type: 'text' },
    { key: 'city', label: 'City', type: 'text' },
    { key: 'condition', label: 'Condition', type: 'text' },
    { key: 'price', label: 'Price', type: 'number' },
  ];

  // Translatable fields (have Arabic translations)
  const translatableFields = [
    { key: 'make', label: 'Make', type: 'text' },
    { key: 'model', label: 'Model', type: 'text' },
    { key: 'engine', label: 'Engine', type: 'text' },
    { key: 'fuel', label: 'Fuel Type', type: 'text' },
    { key: 'drivetrain', label: 'Drivetrain', type: 'text' },
    { key: 'exterior_color', label: 'Exterior Color', type: 'text' },
    { key: 'interior_color', label: 'Interior Color', type: 'text' },
  ];

  const arrayFields = [
    { key: 'exterior_features', label: 'Exterior Features', type: 'array' },
    { key: 'interior_features', label: 'Interior Features', type: 'array' },
    { key: 'safety_tech', label: 'Safety & Tech Features', type: 'array' },
  ];

  const historyFields = [
    { key: 'single_owner', label: 'Single Owner', type: 'boolean' },
    { key: 'no_accident_history', label: 'No Accident History', type: 'boolean' },
    { key: 'full_service_history', label: 'Full Service History', type: 'boolean' },
  ];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="section-padding py-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Step 2: Details</h3>
            <p className="text-sm text-slate-600 mt-1">
              Review and edit the extracted vehicle information
            </p>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Analysis Complete</span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            {hasChanges ? (
              <span className="text-orange-600">⚠ Unsaved changes</span>
            ) : (
              <span className="text-green-600">✓ All changes saved</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="btn btn-secondary btn-sm flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back: Images
            </button>
            <button
              onClick={handleReset}
              className="btn btn-secondary btn-sm flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            {hasChanges && (
              <button
                onClick={handleSave}
                className="btn btn-secondary btn-sm flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            )}
            <button
              onClick={handleNext}
              className="btn btn-primary btn-sm flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              Next: Images
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="section-padding py-4 space-y-6">
          {/* English-Only Information */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Basic Information (English Only)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {englishOnlyFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={formData[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 placeholder-slate-400 text-sm"
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Translatable Content - Split Screen */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Translatable Content
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* English Side */}
              <div className="space-y-4">
                <h5 className="text-md font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  English
                </h5>
                <div className="space-y-3">
                  {translatableFields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        value={formData[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 placeholder-slate-400 text-sm"
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Arabic Side */}
              <div className="space-y-4">
                <h5 className="text-md font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Arabic Translation
                </h5>
                <div className="space-y-3">
                  {translatableFields.map((field) => {
                    const translationKey = `${field.key}_ar`;
                    const translationValue = formData.translations?.[translationKey] || '';
                    return (
                      <div key={field.key} className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                          {field.label} (Arabic)
                        </label>
                        <input
                          type="text"
                          value={translationValue}
                          onChange={(e) => {
                            const newTranslations = {
                              ...formData.translations,
                              [translationKey]: e.target.value
                            };
                            handleFieldChange('translations', newTranslations);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-slate-900 placeholder-slate-400 text-sm"
                          placeholder={`Enter ${field.label.toLowerCase()} in Arabic...`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Features - Split Screen */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              Features
            </h4>
            <div className="space-y-6">
              {arrayFields.map((field) => {
                const fieldData = formData[field.key] || [];
                const translationKey = `${field.key}_ar`;
                const translationData = formData.translations?.[translationKey] || [];
                
                return (
                  <div key={field.key} className="space-y-4">
                    <h5 className="text-md font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      {field.label}
                    </h5>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* English Features */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-800">
                          English
                        </label>
                        <div className="space-y-2">
                          {fieldData.length > 0 ? (
                            fieldData.map((item: string, index: number) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-md">
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => updateFeatureInBoth(field.key, index, e.target.value, false)}
                                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  placeholder={`Feature ${index + 1}...`}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeFeatureFromBoth(field.key, index)}
                                  className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md text-sm font-medium transition-colors"
                                >
                                  ×
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-slate-500 italic p-3 bg-slate-50 rounded-md">
                              No {field.label.toLowerCase()} found
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Arabic Features */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-800">
                          Arabic
                        </label>
                        <div className="space-y-2">
                          {translationData.length > 0 ? (
                            translationData.map((item: string, index: number) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-md">
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => updateFeatureInBoth(field.key, index, e.target.value, true)}
                                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                  placeholder={`Arabic feature ${index + 1}...`}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeFeatureFromBoth(field.key, index)}
                                  className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md text-sm font-medium transition-colors"
                                >
                                  ×
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-slate-500 italic p-3 bg-slate-50 rounded-md">
                              No Arabic {field.label.toLowerCase()} found
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Single Add Feature Button */}
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => addFeatureToBoth(field.key)}
                        className="px-4 py-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 border border-purple-200 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="text-sm">+</span>
                        Add {field.label.slice(0, -1)}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Car History */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              Car History
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {historyFields.map((field) => (
                <div key={field.key} className="flex items-center gap-2 p-2 bg-slate-50 rounded-md border border-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.car_history?.[field.key] || false}
                    onChange={(e) => {
                      const newCarHistory = {
                        ...(formData.car_history || {}),
                        [field.key]: e.target.checked
                      };
                      handleFieldChange('car_history', newCarHistory);
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="text-xs font-medium text-slate-700 cursor-pointer">
                    {field.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
