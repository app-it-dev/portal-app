import { PostRow } from '@/types/Analyze';

// Safe integer parse
export function toInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? null : parsed;
}

// Deduplicate array case-insensitively
export function dedupe(arr: string[]): string[] {
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  return arr.filter(item => {
    const lower = item.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
}

// Canonicalize English feature names
export function canonFeatureEN(label: string): string {
  if (!label) return label;
  
  const canonMap: Record<string, string> = {
    'collision warning system': 'Collision Warning System',
    'driver monitor': 'Driver Monitor',
    'parking distance sensors': 'Parking Distance Sensors',
    'parking assistance': 'Parking Assistance',
    'headlight control - auto highbeam': 'Automatic High-Beam Control',
    'traffic sign recognition': 'Traffic Sign Recognition',
    'autonomous drive': 'Autonomous Drive',
    'dynamic steering': 'Dynamic Steering',
    'alloy wheels': 'Alloy Wheels',
    'sunroof': 'Sunroof/Moonroof',
    'moonroof': 'Sunroof/Moonroof',
    'leather seats': 'Leather Seats',
    'memory seat': 'Memory Seat',
    'navigation system': 'Navigation System',
    'android auto': 'Android Auto®',
    'apple carplay': 'Apple CarPlay®',
    'bluetooth': 'Bluetooth®',
    'homelink': 'HomeLink',
    'satellite radio': 'Satellite Radio',
    'wifi hotspot': 'WiFi Hotspot',
    'cooled seats': 'Cooled Seats',
    'heated seats': 'Heated Seats',
    'heated steering wheel': 'Heated Steering Wheel',
    'premium sound system': 'Premium Sound System',
    'usb port': 'USB Port',
  };

  const lower = label.toLowerCase().trim();
  return canonMap[lower] || label.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

// Auto-translate to Arabic
export function autoArabic(en: string): string | null {
  if (!en) return null;
  
  const arabicMap: Record<string, string> = {
    // Fuel types
    'gasoline': 'بنزين',
    'diesel': 'ديزل',
    'electric': 'كهربائي',
    'hybrid': 'هجين',
    
    // Drivetrain
    'fwd': 'دفع أمامي',
    'rwd': 'دفع خلفي',
    'awd': 'دفع كلي',
    '4wd': 'دفع رباعي',
    
    // Features
    'alloy wheels': 'عجلات سبائك',
    'sunroof/moonroof': 'سقف بانورامي',
    'leather seats': 'مقاعد جلدية',
    'memory seat': 'مقعد بذاكرة',
    'navigation system': 'نظام ملاحة',
    'android auto®': 'أندرويد أوتو',
    'apple carplay®': 'أبل كاربلاي',
    'bluetooth®': 'بلوتوث',
    'homelink': 'هوم لينك',
    'satellite radio': 'راديو فضائي',
    'wifi hotspot': 'واي فاي',
    'cooled seats': 'مقاعد مبردة',
    'heated seats': 'مقاعد مدفأة',
    'heated steering wheel': 'مقود مدفأ',
    'premium sound system': 'نظام صوت فاخر',
    'usb port': 'منفذ USB',
    'collision warning system': 'نظام تحذير التصادم',
    'driver monitor': 'مراقب السائق',
    'parking distance sensors': 'حساسات المسافة للركن',
    'parking assistance': 'مساعد الركن',
    'automatic high-beam control': 'تحكم تلقائي بالإضاءة العالية',
    'traffic sign recognition': 'تمييز إشارات المرور',
    'autonomous drive': 'القيادة الذاتية',
    'dynamic steering': 'توجيه ديناميكي',
    
    // Brands
    'mercedes-benz': 'مرسيدس-بنز',
    'bmw': 'بي إم دبليو',
    'land rover': 'لاند روفر',
    'toyota': 'تويوتا',
    'honda': 'هوندا',
    'ford': 'فورد',
    'chevrolet': 'شيفروليه',
    'nissan': 'نيسان',
    'hyundai': 'هيونداي',
    'kia': 'كيا',
    'mazda': 'مازدا',
    'subaru': 'سوبارو',
    'volkswagen': 'فولكس واجن',
    'audi': 'أودي',
    'lexus': 'لكزس',
    'infiniti': 'إنفينيتي',
    'acura': 'أكورا',
    'cadillac': 'كاديلاك',
    'lincoln': 'لينكولن',
    'buick': 'بويك',
    'gmc': 'جي إم سي',
    'jeep': 'جيب',
    'ram': 'رام',
    'dodge': 'دودج',
    'chrysler': 'كرايسلر',
    'volvo': 'فولفو',
    'porsche': 'بورش',
    'jaguar': 'جاغوار',
    'mini': 'ميني',
    'tesla': 'تيسلا'
  };

  const lower = en.toLowerCase().trim();
  
  // Special case for Mercedes models
  if (lower.includes('mercedes') || lower.includes('benz')) {
    const classMatch = en.match(/^([SECGAB])-?Class$/i);
    if (classMatch) {
      return `الفئة ${classMatch[1].toUpperCase()}`;
    }
  }
  
  return arabicMap[lower] || null;
}

// Normalize API response to PostRow
export function normalizePostRow(input: unknown): PostRow {
  // Handle array response
  let data = input;
  if (Array.isArray(input)) {
    data = input[0] || {};
  }
  
  // Handle string response with code fences
  if (typeof data === 'string') {
    const stripped = data.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    try {
      data = JSON.parse(stripped);
    } catch (e) {
      console.error('Failed to parse JSON response:', e);
      data = {};
    }
  }
  
  // Ensure arrays exist
  const dataObj = data as Record<string, unknown>;
  const exteriorFeatures = Array.isArray(dataObj.exterior_features) ? dataObj.exterior_features : [];
  const interiorFeatures = Array.isArray(dataObj.interior_features) ? dataObj.interior_features : [];
  const safetyTech = Array.isArray(dataObj.safety_tech) ? dataObj.safety_tech : [];
  
  const translations = (dataObj.translations as Record<string, unknown>) || {};
  const exteriorFeaturesAr = Array.isArray(translations.exterior_features_ar) ? translations.exterior_features_ar : [];
  const interiorFeaturesAr = Array.isArray(translations.interior_features_ar) ? translations.interior_features_ar : [];
  const safetyTechAr = Array.isArray(translations.safety_tech_ar) ? translations.safety_tech_ar : [];
  
  // Canonicalize and dedupe English features
  const canonExterior = dedupe(exteriorFeatures.map(canonFeatureEN));
  const canonInterior = dedupe(interiorFeatures.map(canonFeatureEN));
  const canonSafety = dedupe(safetyTech.map(canonFeatureEN));
  
  // Auto-fill missing Arabic translations
  const fillArabic = (enArray: string[], arArray: string[]): string[] => {
    return enArray.map((en, index) => {
      if (arArray[index]) return arArray[index];
      return autoArabic(en) || '';
    });
  };
  
  const normalized: PostRow = {
    vin: (dataObj.vin as string) || null,
    make: (dataObj.make as string) || '',
    model: (dataObj.model as string) || '',
    year: toInt(dataObj.year) || new Date().getFullYear(),
    engine: (dataObj.engine as string) || null,
    fuel: (dataObj.fuel as 'Gasoline' | 'Diesel' | 'Electric' | 'Hybrid') || null,
    drivetrain: (dataObj.drivetrain as 'FWD' | 'RWD' | 'AWD' | '4WD') || null,
    mileage: toInt(dataObj.mileage),
    mileage_unit: (dataObj.mileage_unit as 'mi' | 'km') || 'mi',
    country: (dataObj.country as string) || '',
    state: (dataObj.state as string) || null,
    city: (dataObj.city as string) || null,
    condition: (dataObj.condition as 'New' | 'Used' | 'Certified') || 'Used',
    price: toInt(dataObj.price) || 0,
    exterior_color: (dataObj.exterior_color as string) || null,
    interior_color: (dataObj.interior_color as string) || null,
    specs: (dataObj.specs as object) || {},
    exterior_features: canonExterior,
    interior_features: canonInterior,
    safety_tech: canonSafety,
    car_history: dataObj.car_history ? {
      single_owner: Boolean((dataObj.car_history as Record<string, unknown>).single_owner),
      no_accident_history: Boolean((dataObj.car_history as Record<string, unknown>).no_accident_history),
      full_service_history: Boolean((dataObj.car_history as Record<string, unknown>).full_service_history)
    } : null,
    translations: {
      title_ar: (translations.title_ar as string) || null,
      make_ar: (translations.make_ar as string) || autoArabic((dataObj.make as string) || ''),
      model_ar: (translations.model_ar as string) || autoArabic((dataObj.model as string) || ''),
      fuel_ar: (translations.fuel_ar as string) || autoArabic((dataObj.fuel as string) || ''),
      drivetrain_ar: (translations.drivetrain_ar as string) || autoArabic((dataObj.drivetrain as string) || ''),
      engine_ar: (translations.engine_ar as string) || null,
      exterior_color_ar: (translations.exterior_color_ar as string) || null,
      interior_color_ar: (translations.interior_color_ar as string) || null,
      exterior_features_ar: fillArabic(canonExterior, exteriorFeaturesAr),
      interior_features_ar: fillArabic(canonInterior, interiorFeaturesAr),
      safety_tech_ar: fillArabic(canonSafety, safetyTechAr)
    }
  };
  
  return normalized;
}

// API call to analyze endpoint
export async function analyzeContent(rawContent: string): Promise<PostRow> {
  const response = await fetch('https://api.carsgate.co/webhook/v1/portal/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: rawContent }),
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return normalizePostRow(data);
}

// Validate PostRow
export function validatePostRow(post: PostRow): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!post.make.trim()) errors.push('Make is required');
  if (!post.model.trim()) errors.push('Model is required');
  if (!post.year || post.year < 1900 || post.year > new Date().getFullYear() + 2) {
    errors.push('Valid year is required');
  }
  if (!post.country.trim()) errors.push('Country is required');
  if (!post.condition) errors.push('Condition is required');
  if (!post.price || post.price <= 0) errors.push('Valid price is required');
  
  // Validate enums
  const validFuels = ['Gasoline', 'Diesel', 'Electric', 'Hybrid'];
  const validDrivetrains = ['FWD', 'RWD', 'AWD', '4WD'];
  const validConditions = ['New', 'Used', 'Certified'];
  const validMileageUnits = ['mi', 'km'];
  
  if (post.fuel && !validFuels.includes(post.fuel)) {
    errors.push('Invalid fuel type');
  }
  if (post.drivetrain && !validDrivetrains.includes(post.drivetrain)) {
    errors.push('Invalid drivetrain');
  }
  if (!validConditions.includes(post.condition)) {
    errors.push('Invalid condition');
  }
  if (!validMileageUnits.includes(post.mileage_unit)) {
    errors.push('Invalid mileage unit');
  }
  
  return { isValid: errors.length === 0, errors };
}
