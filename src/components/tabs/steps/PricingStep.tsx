'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, ArrowLeft, Calculator, DollarSign, Wifi, WifiOff } from 'lucide-react';
import type { PostRow } from '@/types';
import { useSupabaseStore as useStore } from '@/store/supabase-store';

interface PricingStepProps {
  post: PostRow;
  onSave: (pricing: any) => void;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}

export function PricingStep({ post, onSave, onNext, onBack, canProceed }: PricingStepProps) {
  const { savePricing, isOnline } = useStore();
  const [pricing, setPricing] = useState({
    carPrice: post.pricing?.carPrice || post.parsedJson?.price || 0,
    shipping: post.pricing?.shipping || 5000, // Default 5000 USD
    brokerFee: post.pricing?.brokerFee || 3000, // Default 3000 USD
    platformFee: post.pricing?.platformFee || 2000, // Default 2000 SAR
  });

  const [calculatedPricing, setCalculatedPricing] = useState({
    customsFees: 0,
    vat: 0,
    total: 0,
  });

  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // USD to SAR conversion rate (approximate)
  const USD_TO_SAR_RATE = 3.75;

  // Reset initialization when post changes
  useEffect(() => {
    setIsInitialized(false);
  }, [post.id]);

  // Initialize pricing state when post data changes (only once)
  useEffect(() => {
    if (!isInitialized) {
      setPricing({
        carPrice: post.pricing?.carPrice || post.parsedJson?.price || 0,
        shipping: post.pricing?.shipping || 5000,
        brokerFee: post.pricing?.brokerFee || 3000,
        platformFee: post.pricing?.platformFee || 2000,
      });
      setIsInitialized(true);
    }
  }, [post.pricing, post.parsedJson, isInitialized]);

  // Calculate pricing whenever pricing changes
  useEffect(() => {
    const carPriceUSD = pricing.carPrice || 0;
    const shippingUSD = pricing.shipping || 0;
    const brokerFeeUSD = pricing.brokerFee || 0;
    const platformFeeSAR = pricing.platformFee || 0;
    
    // Convert USD to SAR for calculations
    const carPriceSAR = carPriceUSD * USD_TO_SAR_RATE;
    const shippingSAR = shippingUSD * USD_TO_SAR_RATE;
    const brokerFeeSAR = brokerFeeUSD * USD_TO_SAR_RATE;
    
    const customsFeesSAR = carPriceSAR * 0.05; // 5% customs fees
    const vatSAR = (carPriceSAR + customsFeesSAR) * 0.15; // 15% VAT on car price + customs
    const totalSAR = carPriceSAR + customsFeesSAR + vatSAR + shippingSAR + brokerFeeSAR + platformFeeSAR;

    setCalculatedPricing({
      customsFees: customsFeesSAR,
      vat: vatSAR,
      total: totalSAR,
    });
  }, [pricing.carPrice, pricing.shipping, pricing.brokerFee, pricing.platformFee]);

  // Debounced auto-save for real-time sync (doesn't interfere with typing)
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      // Only auto-save if there are actual values and we're not in the middle of a manual save
      if (pricing.carPrice > 0 && !isSaving) {
        try {
          const fullPricing = {
            carPriceUSD: pricing.carPrice,
            shippingUSD: pricing.shipping,
            brokerFeeUSD: pricing.brokerFee,
            platformFeeSAR: pricing.platformFee,
            carPriceSAR: pricing.carPrice * USD_TO_SAR_RATE,
            shippingSAR: pricing.shipping * USD_TO_SAR_RATE,
            brokerFeeSAR: pricing.brokerFee * USD_TO_SAR_RATE,
            customsFeesSAR: calculatedPricing.customsFees,
            vatSAR: calculatedPricing.vat,
            totalSAR: calculatedPricing.total,
            // Legacy fields for backward compatibility
            carPrice: pricing.carPrice,
            shipping: pricing.shipping,
            brokerFee: pricing.brokerFee,
            platformFee: pricing.platformFee,
            customsFees: calculatedPricing.customsFees,
            vat: calculatedPricing.vat,
            total: calculatedPricing.total,
          };
          await savePricing(post.id, fullPricing);
          setLastUpdateTime(new Date());
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [pricing, calculatedPricing, post.id, savePricing, isSaving]);

  const handleSave = useCallback(async () => {
    const fullPricing = {
      // Input fields with currency labels
      carPriceUSD: pricing.carPrice,
      shippingUSD: pricing.shipping,
      brokerFeeUSD: pricing.brokerFee,
      platformFeeSAR: pricing.platformFee,
      // Calculated fields with currency labels
      carPriceSAR: (pricing.carPrice || 0) * USD_TO_SAR_RATE,
      shippingSAR: (pricing.shipping || 0) * USD_TO_SAR_RATE,
      brokerFeeSAR: (pricing.brokerFee || 0) * USD_TO_SAR_RATE,
      customsFeesSAR: calculatedPricing.customsFees,
      vatSAR: calculatedPricing.vat,
      totalSAR: calculatedPricing.total,
      // Legacy fields for backward compatibility
      carPrice: pricing.carPrice,
      shipping: pricing.shipping,
      brokerFee: pricing.brokerFee,
      platformFee: pricing.platformFee,
      customsFees: calculatedPricing.customsFees,
      vat: calculatedPricing.vat,
      total: calculatedPricing.total,
    };
    
    
    setIsSaving(true);
    try {
      await savePricing(post.id, fullPricing);
      setLastUpdateTime(new Date());
      onSave(fullPricing);
    } catch (error) {
      console.error('❌ Failed to save pricing:', error);
    } finally {
      setIsSaving(false);
    }
  }, [pricing, calculatedPricing, onSave, post.id, savePricing]);

  const handleCarPriceChange = useCallback((value: string) => {
    const numValue = parseFloat(value) || 0;
    setPricing(prev => ({ ...prev, carPrice: numValue }));
  }, []);

  const handleShippingChange = useCallback((value: string) => {
    const numValue = parseFloat(value) || 0;
    setPricing(prev => ({ ...prev, shipping: numValue }));
  }, []);

  const handleBrokerFeeChange = useCallback((value: string) => {
    const numValue = parseFloat(value) || 0;
    setPricing(prev => ({ ...prev, brokerFee: numValue }));
  }, []);

  const handlePlatformFeeChange = useCallback((value: string) => {
    const numValue = parseFloat(value) || 0;
    setPricing(prev => ({ ...prev, platformFee: numValue }));
  }, []);

  const formatCurrency = (amount: number, currency: 'USD' | 'SAR' = 'SAR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="section-padding py-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Step 4: Pricing</h3>
            <p className="text-sm text-slate-600 mt-1">
              Set vehicle price and calculate total costs
            </p>
            {/* Real-time status indicator */}
            <div className="flex items-center gap-2 mt-2">
              {isOnline ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi className="w-3 h-3" />
                  <span className="text-xs">Live sync active</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-600">
                  <WifiOff className="w-3 h-3" />
                  <span className="text-xs">Offline mode</span>
                </div>
              )}
              {lastUpdateTime && (
                <span className="text-xs text-slate-500">
                  Last updated: {lastUpdateTime.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          {canProceed && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Pricing complete</span>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="btn btn-secondary btn-sm flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back: Images
            </button>
            <div className="text-sm text-slate-600">
              {pricing.carPrice > 0 ? (
                <span className="text-green-600">✓ Price set: {formatCurrency(pricing.carPrice)}</span>
              ) : (
                <span>Enter vehicle price</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary btn-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Save Pricing
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="section-padding py-8">
          <div className="max-w-4xl mx-auto">
            {/* Pricing Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Section */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-500" />
                    Vehicle Pricing
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Car Price */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Vehicle Price (USD)
                      </label>
                      <input
                        type="number"
                        value={pricing.carPrice || ''}
                        onChange={(e) => handleCarPriceChange(e.target.value)}
                        placeholder="Enter vehicle price in USD"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        step="0.01"
                        min="0"
                      />
                    </div>

                    {/* Shipping */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Shipping (USD)
                      </label>
                      <input
                        type="number"
                        value={pricing.shipping || ''}
                        onChange={(e) => handleShippingChange(e.target.value)}
                        placeholder="5000"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        step="0.01"
                        min="0"
                      />
                    </div>

                    {/* Broker Fee */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Broker Fee (USD)
                      </label>
                      <input
                        type="number"
                        value={pricing.brokerFee || ''}
                        onChange={(e) => handleBrokerFeeChange(e.target.value)}
                        placeholder="3000"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        step="0.01"
                        min="0"
                      />
                    </div>

                    {/* Platform Fee */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Platform Fee (SAR)
                      </label>
                      <input
                        type="number"
                        value={pricing.platformFee || ''}
                        onChange={(e) => handlePlatformFeeChange(e.target.value)}
                        placeholder="2000"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculation Section */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                  <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-blue-500" />
                    Cost Breakdown
                  </h4>
                  
                  <div className="space-y-3">
                    {/* Car Price */}
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-600">Vehicle Price</span>
                      <span className="font-medium">{formatCurrency((pricing.carPrice || 0) * USD_TO_SAR_RATE, 'SAR')}</span>
                    </div>

                    {/* Customs Fees */}
                    <div className="flex justify-between items-center py-2 border-t border-blue-200">
                      <span className="text-slate-600">Customs Fees (5%)</span>
                      <span className="font-medium text-amber-600">{formatCurrency(calculatedPricing.customsFees, 'SAR')}</span>
                    </div>

                    {/* VAT */}
                    <div className="flex justify-between items-center py-2 border-t border-blue-200">
                      <span className="text-slate-600">VAT (15%)</span>
                      <span className="font-medium text-amber-600">{formatCurrency(calculatedPricing.vat, 'SAR')}</span>
                    </div>

                    {/* Shipping */}
                    <div className="flex justify-between items-center py-2 border-t border-blue-200">
                      <span className="text-slate-600">Shipping</span>
                      <span className="font-medium">{formatCurrency((pricing.shipping || 0) * USD_TO_SAR_RATE, 'SAR')}</span>
                    </div>

                    {/* Broker Fee */}
                    <div className="flex justify-between items-center py-2 border-t border-blue-200">
                      <span className="text-slate-600">Broker Fee</span>
                      <span className="font-medium">{formatCurrency((pricing.brokerFee || 0) * USD_TO_SAR_RATE, 'SAR')}</span>
                    </div>

                    {/* Platform Fee */}
                    <div className="flex justify-between items-center py-2 border-t border-blue-200">
                      <span className="text-slate-600">Platform Fee</span>
                      <span className="font-medium">{formatCurrency(pricing.platformFee || 0, 'SAR')}</span>
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center py-3 border-t-2 border-blue-300 bg-blue-100 rounded-lg px-4 -mx-2">
                      <span className="text-lg font-semibold text-slate-900">Total Amount</span>
                      <span className="text-xl font-bold text-blue-600">{formatCurrency(calculatedPricing.total, 'SAR')}</span>
                    </div>
                  </div>
                </div>

                {/* Summary Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h5 className="text-md font-semibold text-slate-900 mb-3">Pricing Summary</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Base Price:</span>
                      <span>{formatCurrency((pricing.carPrice || 0) * USD_TO_SAR_RATE, 'SAR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Additional Fees:</span>
                      <span>{formatCurrency(calculatedPricing.customsFees + calculatedPricing.vat + ((pricing.shipping || 0) * USD_TO_SAR_RATE) + ((pricing.brokerFee || 0) * USD_TO_SAR_RATE) + (pricing.platformFee || 0), 'SAR')}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-slate-900 border-t pt-2">
                      <span>Final Total:</span>
                      <span className="text-lg">{formatCurrency(calculatedPricing.total, 'SAR')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
