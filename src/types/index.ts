export type PostStatus = 'pending' | 'rejected' | 'analyzing' | 'parsed' | 'ready' | 'inserted';

export type WorkflowStep = 'raw' | 'details' | 'images' | 'pricing' | 'complete';

export interface ImageItem {
  url: string;
  keep: boolean;
  isMain: boolean;
  caption?: string;
  width?: number;
  height?: number;
}

export interface ParsedPost {
  title?: string | null;
  notes?: string | null;
  vehicle?: {
    year?: number | null;
    make?: string | null;
    model?: string | null;
    vin?: string | null;
    condition?: string | null;
    mileage?: number | null;
    drivetrain?: string | null;
    fuel_type?: string | null;
    engine?: string | null;
  };
  specs?: {
    exterior_color?: string | null;
    interior_color?: string | null;
    exterior_features?: string[];
    interior_features?: string[];
    safety_and_tech?: string[];
  };
  extras?: {
    car_history?: { 
      single_owner?: boolean; 
      no_accident_history?: boolean; 
      full_service_history?: boolean; 
    } | null;
    raw?: unknown;
  };
  translations?: {
    title_ar?: string | null;
    make_ar?: string | null;
    model_ar?: string | null;
    fuel_ar?: string | null;
    drivetrain_ar?: string | null;
    engine_ar?: string | null;
    exterior_color_ar?: string | null;
    interior_color_ar?: string | null;
    exterior_features_ar?: string[];
    interior_features_ar?: string[];
    safety_tech_ar?: string[];
  };
  // Additional fields
  mileage_unit?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  price?: number | null;
  // Features at root level
  exterior_features?: string[];
  interior_features?: string[];
  safety_tech?: string[];
}

export interface PostRow {
  id: string;
  url: string;
  source?: string;
  note?: string;
  status: PostStatus;
  rejectionReason?: string;
  rawContent?: string;
  parsedJson?: ParsedPost;
  images: ImageItem[];
  lastUpdatedAt: string;
  workflowStep?: WorkflowStep;
  stepCompleted?: {
    raw?: boolean;
    details?: boolean;
    images?: boolean;
    pricing?: boolean;
  };
  pricing?: {
    carPrice?: number;
    shipping?: number;
    brokerFee?: number;
    platformFee?: number;
    customsFees?: number;
    vat?: number;
    total?: number;
    // Additional fields with currency labels
    carPriceUSD?: number;
    shippingUSD?: number;
    brokerFeeUSD?: number;
    platformFeeSAR?: number;
    carPriceSAR?: number;
    shippingSAR?: number;
    brokerFeeSAR?: number;
    customsFeesSAR?: number;
    vatSAR?: number;
    totalSAR?: number;
  };
}


export interface StoreState {
  posts: PostRow[];
  activeId: string | null;
  search: string;
  showPastePostsModal: boolean;
  inflightByPostId: { [postId: string]: AbortController | undefined };
}

export interface StoreActions {
  importPosts: (rows: { url: string; source?: string; note?: string }[]) => void;
  importImages: (rows: { post_url: string; image_url: string; caption?: string }[]) => void;
  setActive: (id: string | null) => void;
  setSearch: (search: string) => void;
  reject: (id: string, reason?: string) => void;
  undoReject: (id: string) => void;
  saveRaw: (id: string, text: string) => void;
  analyze: (id: string) => Promise<void>;
  setImages: (id: string, images: ImageItem[]) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
  hydrate: () => void;
  persist: () => void;
  setShowPastePostsModal: (show: boolean) => void;
  // Workflow actions
  setWorkflowStep: (id: string, step: WorkflowStep) => void;
  completeStep: (id: string, step: WorkflowStep) => void;
  acceptAnalysis: (id: string) => void;
  saveDetails: (id: string, data: any) => void;
  acceptImages: (id: string) => void;
  savePricing: (id: string, pricing: any) => void;
  finalizePost: (id: string) => void;
}

export type Store = StoreState & StoreActions;
