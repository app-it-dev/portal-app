// Auto-generated Supabase types
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: Record<string, unknown>;
    Functions: Record<string, unknown>;
  };
  portal: {
    Tables: {
      portal_admin: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          role: 'super_admin' | 'admin' | 'moderator';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          role: 'super_admin' | 'admin' | 'moderator';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          role?: 'super_admin' | 'admin' | 'moderator';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      portal_import_posts: {
        Row: {
          id: string;
          admin_id: string;
          url: string;
          source: string | null;
          note: string | null;
          status: 'pending' | 'analyzing' | 'analyzed' | 'rejected' | 'completed';
          raw_content: string | null;
          raw_analysis: Json | null;
          title: string | null;
          description: string | null;
          price: number | null;
          currency: string;
          year: number | null;
          make: string | null;
          model: string | null;
          trim: string | null;
          body_type: string | null;
          fuel_type: string | null;
          transmission: string | null;
          engine: string | null;
          mileage: number | null;
          color: string | null;
          condition: string | null;
          features: Json;
          images: Json;
          main_image_url: string | null;
          car_price: number | null;
          shipping_cost: number;
          broker_fee: number;
          platform_fee: number;
          customs_fee: number;
          vat_amount: number;
          total_cost: number;
          workflow_step: 'raw' | 'details' | 'images' | 'pricing' | 'complete';
          step_completed: Json;
          created_at: string;
          updated_at: string;
          last_analyzed_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          admin_id: string;
          url: string;
          source?: string | null;
          note?: string | null;
          status?: 'pending' | 'analyzing' | 'analyzed' | 'rejected' | 'completed';
          raw_content?: string | null;
          raw_analysis?: Json | null;
          title?: string | null;
          description?: string | null;
          price?: number | null;
          currency?: string;
          year?: number | null;
          make?: string | null;
          model?: string | null;
          trim?: string | null;
          body_type?: string | null;
          fuel_type?: string | null;
          transmission?: string | null;
          engine?: string | null;
          mileage?: number | null;
          color?: string | null;
          condition?: string | null;
          features?: Json;
          images?: Json;
          main_image_url?: string | null;
          car_price?: number | null;
          shipping_cost?: number;
          broker_fee?: number;
          platform_fee?: number;
          customs_fee?: number;
          vat_amount?: number;
          total_cost?: number;
          workflow_step?: 'raw' | 'details' | 'images' | 'pricing' | 'complete';
          step_completed?: Json;
          created_at?: string;
          updated_at?: string;
          last_analyzed_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          admin_id?: string;
          url?: string;
          source?: string | null;
          note?: string | null;
          status?: 'pending' | 'analyzing' | 'analyzed' | 'rejected' | 'completed';
          raw_content?: string | null;
          raw_analysis?: Json | null;
          title?: string | null;
          description?: string | null;
          price?: number | null;
          currency?: string;
          year?: number | null;
          make?: string | null;
          model?: string | null;
          trim?: string | null;
          body_type?: string | null;
          fuel_type?: string | null;
          transmission?: string | null;
          engine?: string | null;
          mileage?: number | null;
          color?: string | null;
          condition?: string | null;
          features?: Json;
          images?: Json;
          main_image_url?: string | null;
          car_price?: number | null;
          shipping_cost?: number;
          broker_fee?: number;
          platform_fee?: number;
          customs_fee?: number;
          vat_amount?: number;
          total_cost?: number;
          workflow_step?: 'raw' | 'details' | 'images' | 'pricing' | 'complete';
          step_completed?: Json;
          created_at?: string;
          updated_at?: string;
          last_analyzed_at?: string | null;
          completed_at?: string | null;
        };
      };
    };
    Functions: Record<string, unknown>;
  };
}

// Helper types for easier access
export type PortalAdmin = Database['portal']['Tables']['portal_admin']['Row'];
export type PortalAdminInsert = Database['portal']['Tables']['portal_admin']['Insert'];
export type PortalAdminUpdate = Database['portal']['Tables']['portal_admin']['Update'];

export type ImportPost = Database['portal']['Tables']['portal_import_posts']['Row'];
export type ImportPostInsert = Database['portal']['Tables']['portal_import_posts']['Insert'];
export type ImportPostUpdate = Database['portal']['Tables']['portal_import_posts']['Update'];
