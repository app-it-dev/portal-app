export interface Translations {
  title_ar: string | null;
  make_ar: string | null;
  model_ar: string | null;
  fuel_ar: string | null;
  drivetrain_ar: string | null;
  engine_ar: string | null;
  exterior_color_ar: string | null;
  interior_color_ar: string | null;
  exterior_features_ar: string[];
  interior_features_ar: string[];
  safety_tech_ar: string[];
}

export interface PostRow {
  vin: string | null;
  make: string;
  model: string;
  year: number;
  engine: string | null;
  fuel: 'Gasoline' | 'Diesel' | 'Electric' | 'Hybrid' | null;
  drivetrain: 'FWD' | 'RWD' | 'AWD' | '4WD' | null;
  mileage: number | null;
  mileage_unit: 'mi' | 'km';
  country: string;
  state: string | null;
  city: string | null;
  condition: 'New' | 'Used' | 'Certified';
  price: number;
  exterior_color: string | null;
  interior_color: string | null;
  specs: object | null;
  exterior_features: string[] | null;
  interior_features: string[] | null;
  safety_tech: string[] | null;
  car_history: {
    single_owner?: boolean;
    no_accident_history?: boolean;
    full_service_history?: boolean;
  } | null;
  translations: Translations;
}

export interface AnalyzeState {
  post: PostRow | null;
  loading: boolean;
  error: string | null;
  dirty: boolean;
  rawContent: string;
}
