import type { ParsedPost } from '@/types';

export interface AiAnalyzeRequest {
  url: string;
  raw: string;
}

export interface AiAnalyzeResponse {
  data?: {
    title?: string;
    notes?: string;
  };
  title?: string;
  summary?: string;
  message?: string;
  result?: {
    title?: string;
  };
}

/**
 * Fetches AI analysis from the CarsGate API
 */
export async function aiAnalyze(
  { url, raw }: AiAnalyzeRequest,
  signal?: AbortSignal
): Promise<AiAnalyzeResponse> {
  console.log('Starting AI analysis request...', { url, rawLength: raw.length });
  
  const startTime = Date.now();
  console.log('Making API request to CarsGate AI endpoint...');
  
  try {
    const response = await fetch('https://api.carsgate.co/webhook/v1/portal/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'carsgate-portal',
        url,
        raw,
        version: '2025-09-22',
        locale: 'en-SA',
      }),
      signal,
    });

    const duration = Date.now() - startTime;
    console.log(`AI analysis response received after ${duration}ms, status:`, response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Analyze failed (${response.status}): ${errorText}`);
    }

    try {
      return await response.json();
    } catch {
      // Try to parse as text first, then JSON.parse if possible
      try {
        const text = await response.text();
        return JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON response from analyze API');
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Analysis request was cancelled');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to AI service. Please check your internet connection.');
      }
      throw error;
    }
    throw new Error('Unknown error occurred during analysis');
  }
}

/**
 * Safely parses a stringified JSON field
 */
function safeJsonParse(str: unknown): unknown {
  if (!str || typeof str !== 'string') return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/**
 * Safely converts a value to a number
 */
function safeToNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

/**
 * Safely converts a value to an array (handles both strings and arrays)
 */
function safeSplitToArray(value: unknown): string[] {
  if (!value) return [];
  
  // If it's already an array, return it
  if (Array.isArray(value)) {
    return value.filter(item => typeof item === 'string' && item.trim().length > 0);
  }
  
  // If it's a string, split by comma
  if (typeof value === 'string') {
    return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }
  
  return [];
}

/**
 * Safely normalizes a string (trim and convert empty to null)
 */
function safeNormalizeString(str: unknown): string | null {
  if (typeof str !== 'string') return null;
  const trimmed = str.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Safely gets a property from an object
 */
function safeGet(obj: unknown, key: string): unknown {
  if (obj && typeof obj === 'object' && key in obj) {
    return (obj as Record<string, unknown>)[key];
  }
  return undefined;
}

/**
 * Adapts AI API response to our ParsedPost format
 * Handles both array and object responses
 */
export function adaptAiToParsedPost(res: unknown, fallbackUrl: string): ParsedPost {
  console.log('Raw AI response:', res);
  
  // Handle array responses - pick first successful item or first item
  let item: unknown;
  if (Array.isArray(res)) {
    if (res.length === 0) {
      return {
        title: `Parsed: ${fallbackUrl}`,
        notes: 'No fields returned',
      };
    }
    // Try to find first item with success: true, otherwise use first item
    const arrayRes = res as unknown[];
    item = arrayRes.find(r => r && typeof r === 'object' && 'success' in r && (r as { success: unknown }).success === true) || arrayRes[0];
    console.log('Selected item from array:', item);
  } else if (res && typeof res === 'object') {
    item = res;
  } else {
    return {
      title: `Parsed: ${fallbackUrl}`,
      notes: 'No fields returned',
    };
  }

  // Extract basic fields with fallbacks
  const title = safeNormalizeString(
    safeGet(safeGet(item, 'data'), 'title') ?? 
    safeGet(item, 'title') ?? 
    safeGet(safeGet(item, 'result'), 'title') ?? 
    (safeGet(item, 'year') && safeGet(item, 'make') && safeGet(item, 'model') ? 
      `${safeGet(item, 'year')} ${safeGet(item, 'make')} ${safeGet(item, 'model')}` : null)
  ) ?? `Parsed: ${fallbackUrl}`;

  const notes = safeNormalizeString(
    safeGet(safeGet(item, 'data'), 'notes') ?? 
    safeGet(item, 'summary') ?? 
    safeGet(item, 'message')
  ) ?? 'Parsed from AI';

  console.log('Extracted title:', title);
  console.log('Extracted notes:', notes);

  // Build vehicle info
  const vehicle = {
    year: safeToNumber(safeGet(item, 'year')),
    make: safeNormalizeString(safeGet(item, 'make')),
    model: safeNormalizeString(safeGet(item, 'model')),
    vin: safeNormalizeString(safeGet(item, 'vin')),
    condition: safeNormalizeString(safeGet(item, 'condition')),
    mileage: safeToNumber(safeGet(item, 'mileage')),
    drivetrain: safeNormalizeString(safeGet(item, 'drivetrain')),
    fuel_type: safeNormalizeString(safeGet(item, 'fuel')),
    engine: safeNormalizeString(safeGet(item, 'engine')),
  };

  // Build additional fields
  const additionalFields = {
    mileage_unit: safeNormalizeString(safeGet(item, 'mileage_unit')),
    country: safeNormalizeString(safeGet(item, 'country')),
    state: safeNormalizeString(safeGet(item, 'state')),
    city: safeNormalizeString(safeGet(item, 'city')),
    price: safeToNumber(safeGet(item, 'price')),
  };

  // Build specs info - handle both API response structures
  const specs = {
    exterior_color: safeNormalizeString(safeGet(item, 'exterior_color')),
    interior_color: safeNormalizeString(safeGet(item, 'interior_color')),
    exterior_features: safeSplitToArray(safeGet(item, 'exterior_features')),
    interior_features: safeSplitToArray(safeGet(item, 'interior_features')),
    safety_and_tech: safeSplitToArray(safeGet(item, 'safety_tech')),
  };

  console.log('Raw features from item:', {
    exterior_features: safeGet(item, 'exterior_features'),
    interior_features: safeGet(item, 'interior_features'),
    safety_tech: safeGet(item, 'safety_tech')
  });
  console.log('Raw features types:', {
    exterior_features_type: typeof safeGet(item, 'exterior_features'),
    interior_features_type: typeof safeGet(item, 'interior_features'),
    safety_tech_type: typeof safeGet(item, 'safety_tech')
  });
  console.log('Processed specs:', specs);

  // Build translations info
  const translations = safeGet(item, 'translations') as Record<string, unknown> || {};
  console.log('Raw translations from item:', translations);
  
  const translationsObj = {
    title_ar: safeNormalizeString(safeGet(translations, 'title_ar')),
    make_ar: safeNormalizeString(safeGet(translations, 'make_ar')),
    model_ar: safeNormalizeString(safeGet(translations, 'model_ar')),
    fuel_ar: safeNormalizeString(safeGet(translations, 'fuel_ar')),
    drivetrain_ar: safeNormalizeString(safeGet(translations, 'drivetrain_ar')),
    engine_ar: safeNormalizeString(safeGet(translations, 'engine_ar')),
    exterior_color_ar: safeNormalizeString(safeGet(translations, 'exterior_color_ar')),
    interior_color_ar: safeNormalizeString(safeGet(translations, 'interior_color_ar')),
    exterior_features_ar: safeSplitToArray(safeGet(translations, 'exterior_features_ar')),
    interior_features_ar: safeSplitToArray(safeGet(translations, 'interior_features_ar')),
    safety_tech_ar: safeSplitToArray(safeGet(translations, 'safety_tech_ar')),
  };
  
  console.log('Processed translations:', translationsObj);

  // Build extras info
  const carHistory = safeJsonParse(safeGet(item, 'car_history'));
  const extras = {
    car_history: carHistory ? {
      single_owner: Boolean((carHistory as Record<string, unknown>)?.single_owner),
      no_accident_history: Boolean((carHistory as Record<string, unknown>)?.no_accident_history),
      full_service_history: Boolean((carHistory as Record<string, unknown>)?.full_service_history)
    } : null,
    raw: item,
  };

  const result = {
    title,
    notes,
    vehicle: Object.values(vehicle).some(v => v !== null) ? vehicle : undefined,
    specs: Object.values(specs).some(v => v !== null && (Array.isArray(v) ? v.length > 0 : true)) ? specs : undefined,
    extras: Object.values(extras).some(v => v !== null) ? extras : undefined,
    translations: Object.values(translationsObj).some(v => v !== null && (Array.isArray(v) ? v.length > 0 : true)) ? translationsObj : undefined,
    // Include additional fields directly in the root
    mileage_unit: additionalFields.mileage_unit,
    country: additionalFields.country,
    state: additionalFields.state,
    city: additionalFields.city,
    price: additionalFields.price,
    // Include features at root level for easier access
    exterior_features: specs.exterior_features,
    interior_features: specs.interior_features,
    safety_tech: specs.safety_and_tech,
  };
  
  console.log('AI Response parsed result:', result);
  console.log('Features in result:', {
    exterior_features: result.exterior_features,
    interior_features: result.interior_features,
    safety_tech: result.safety_tech
  });
  
  return result;
}

/**
 * Wrapper that adds timeout and abort controller to aiAnalyze
 */
export async function aiAnalyzeWithTimeout(
  request: AiAnalyzeRequest,
  timeoutMs: number = 20000,
  externalSignal?: AbortSignal
): Promise<AiAnalyzeResponse> {
  console.log(`Starting AI analysis with ${timeoutMs}ms timeout...`);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log(`AI analysis timed out after ${timeoutMs}ms`);
    controller.abort();
  }, timeoutMs);

  // Combine external signal with timeout signal
  const combinedSignal = externalSignal ? 
    (() => {
      const combined = new AbortController();
      const abort = () => combined.abort();
      externalSignal.addEventListener('abort', abort);
      controller.signal.addEventListener('abort', abort);
      return combined.signal;
    })() : 
    controller.signal;

  try {
    const result = await aiAnalyze(request, combinedSignal);
    clearTimeout(timeoutId);
    console.log('AI analysis completed successfully');
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      console.error('AI analysis was aborted (timeout or external cancellation)');
      throw new Error('Analyze request timed out');
    }
    console.error('AI analysis failed with error:', err);
    throw err;
  }
}
