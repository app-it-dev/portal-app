export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          is_active: boolean
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          is_active?: boolean
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          is_active?: boolean
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          city: string
          created_at: string | null
          id: number
          name: string
          phone: string
          user_id: string | null
        }
        Insert: {
          city: string
          created_at?: string | null
          id: number
          name: string
          phone: string
          user_id?: string | null
        }
        Update: {
          city?: string
          created_at?: string | null
          id?: number
          name?: string
          phone?: string
          user_id?: string | null
        }
        Relationships: []
      }
      merchants: {
        Row: {
          address_line1: string
          address_line2: string | null
          business_hours: Json | null
          business_name: string
          business_type: string | null
          city: string
          country: string
          created_at: string | null
          description: string | null
          email: string
          logo_url: string | null
          merchant_id: number
          phone: string
          postal_code: string
          secondary_phone: string | null
          social_media: Json | null
          state: string | null
          status: Database["public"]["Enums"]["merchant_status"]
          updated_at: string | null
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          business_hours?: Json | null
          business_name: string
          business_type?: string | null
          city: string
          country: string
          created_at?: string | null
          description?: string | null
          email: string
          logo_url?: string | null
          merchant_id?: number
          phone: string
          postal_code: string
          secondary_phone?: string | null
          social_media?: Json | null
          state?: string | null
          status?: Database["public"]["Enums"]["merchant_status"]
          updated_at?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          business_hours?: Json | null
          business_name?: string
          business_type?: string | null
          city?: string
          country?: string
          created_at?: string | null
          description?: string | null
          email?: string
          logo_url?: string | null
          merchant_id?: number
          phone?: string
          postal_code?: string
          secondary_phone?: string | null
          social_media?: Json | null
          state?: string | null
          status?: Database["public"]["Enums"]["merchant_status"]
          updated_at?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string | null
          customer_id: number | null
          deposit_amount: number | null
          final_payment_method: string | null
          final_payment_received_at: string | null
          id: number
          note: string | null
          post_id: number
          session_id: string | null
          buyer_snapshot: Json
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: number | null
          deposit_amount?: number | null
          final_payment_method?: string | null
          final_payment_received_at?: string | null
          id: number
          note?: string | null
          post_id: number
          session_id?: string | null
          buyer_snapshot?: Json
          status: Database["public"]["Enums"]["order_status"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: number | null
          deposit_amount?: number | null
          final_payment_method?: string | null
          final_payment_received_at?: string | null
          id?: number
          note?: string | null
          post_id?: number
          session_id?: string | null
          buyer_snapshot?: Json
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_app"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "orders_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_dash"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "orders_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "orders_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_app"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "orders_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_dash"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "orders_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_page"
            referencedColumns: ["post_id"]
          },
        ]
      }
      otp_debug: {
        Row: {
          created_at: string | null
          id: number
          otp: string
          phone: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          otp: string
          phone: string
        }
        Update: {
          created_at?: string | null
          id?: never
          otp?: string
          phone?: string
        }
        Relationships: []
      }
      otp_verify: {
        Row: {
          city: string | null
          created_at: string | null
          expires_at: string
          id: string
          is_verified: boolean | null
          name: string | null
          otp_code: string
          phone: string
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          is_verified?: boolean | null
          name?: string | null
          otp_code: string
          phone: string
        }
        Update: {
          city?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          is_verified?: boolean | null
          name?: string | null
          otp_code?: string
          phone?: string
        }
        Relationships: []
      }
      post_views: {
        Row: {
          id: number
          post_id: number | null
          viewed_at: string | null
        }
        Insert: {
          id?: number
          post_id?: number | null
          viewed_at?: string | null
        }
        Update: {
          id?: number
          post_id?: number | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_app"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_dash"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_app"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_dash"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_page"
            referencedColumns: ["post_id"]
          },
        ]
      }
      posts: {
        Row: {
          car_history: Json | null
          city: string | null
          condition: Database["public"]["Enums"]["vehicle_condition"]
          country: string
          created_at: string | null
          drivetrain: string | null
          engine: string | null
          exterior_color: string | null
          exterior_features: Json | null
          featured_posts: boolean | null
          fuel: string | null
          images: Json | null
          interior_color: string | null
          interior_features: Json | null
          main_image: string | null
          make: string
          merchant_id: number | null
          mileage: number | null
          mileage_unit: Database["public"]["Enums"]["mileage_unit"] | null
          model: string
          post_id: number
          post_source: Database["public"]["Enums"]["post_source"] | null
          price: number
          safety_tech: Json | null
          source_url: string | null
          specs: Json | null
          state: string | null
          status: Database["public"]["Enums"]["post_status"] | null
          translations: Json | null
          updated_at: string | null
          user_id: string | null
          verified: boolean
          vin: string | null
          year: number
        }
        Insert: {
          car_history?: Json | null
          city?: string | null
          condition: Database["public"]["Enums"]["vehicle_condition"]
          country: string
          created_at?: string | null
          drivetrain?: string | null
          engine?: string | null
          exterior_color?: string | null
          exterior_features?: Json | null
          featured_posts?: boolean | null
          fuel?: string | null
          images?: Json | null
          interior_color?: string | null
          interior_features?: Json | null
          main_image?: string | null
          make: string
          merchant_id?: number | null
          mileage?: number | null
          mileage_unit?: Database["public"]["Enums"]["mileage_unit"] | null
          model: string
          post_id: number
          post_source?: Database["public"]["Enums"]["post_source"] | null
          price: number
          safety_tech?: Json | null
          source_url?: string | null
          specs?: Json | null
          state?: string | null
          status?: Database["public"]["Enums"]["post_status"] | null
          translations?: Json | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean
          vin?: string | null
          year: number
        }
        Update: {
          car_history?: Json | null
          city?: string | null
          condition?: Database["public"]["Enums"]["vehicle_condition"]
          country?: string
          created_at?: string | null
          drivetrain?: string | null
          engine?: string | null
          exterior_color?: string | null
          exterior_features?: Json | null
          featured_posts?: boolean | null
          fuel?: string | null
          images?: Json | null
          interior_color?: string | null
          interior_features?: Json | null
          main_image?: string | null
          make?: string
          merchant_id?: number | null
          mileage?: number | null
          mileage_unit?: Database["public"]["Enums"]["mileage_unit"] | null
          model?: string
          post_id?: number
          post_source?: Database["public"]["Enums"]["post_source"] | null
          price?: number
          safety_tech?: Json | null
          source_url?: string | null
          specs?: Json | null
          state?: string | null
          status?: Database["public"]["Enums"]["post_status"] | null
          translations?: Json | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean
          vin?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["merchant_id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          currency: string | null
          customer_id: number
          id: number
          is_accepted: boolean | null
          notes: string | null
          order_id: number
          total_amount: number
          valid_until: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id: number
          id: number
          is_accepted?: boolean | null
          notes?: string | null
          order_id: number
          total_amount: number
          valid_until?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: number
          id?: number
          is_accepted?: boolean | null
          notes?: string | null
          order_id?: number
          total_amount?: number
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      post_app: {
        Row: {
          car_history: Json | null
          condition: Database["public"]["Enums"]["vehicle_condition"] | null
          country: string | null
          drivetrain: string | null
          engine: string | null
          exterior_color: string | null
          exterior_features: Json | null
          fuel: string | null
          images: Json | null
          interior_color: string | null
          interior_features: Json | null
          main_image: string | null
          make: string | null
          mileage_km: number | null
          model: string | null
          post_id: number | null
          price: number | null
          safety_tech: Json | null
          status: Database["public"]["Enums"]["post_status"] | null
          translations: Json | null
          year: number | null
        }
        Insert: {
          car_history?: Json | null
          condition?: Database["public"]["Enums"]["vehicle_condition"] | null
          country?: string | null
          drivetrain?: string | null
          engine?: string | null
          exterior_color?: string | null
          exterior_features?: Json | null
          fuel?: string | null
          images?: Json | null
          interior_color?: string | null
          interior_features?: Json | null
          main_image?: string | null
          make?: string | null
          mileage_km?: never
          model?: string | null
          post_id?: number | null
          price?: number | null
          safety_tech?: Json | null
          status?: Database["public"]["Enums"]["post_status"] | null
          translations?: Json | null
          year?: number | null
        }
        Update: {
          car_history?: Json | null
          condition?: Database["public"]["Enums"]["vehicle_condition"] | null
          country?: string | null
          drivetrain?: string | null
          engine?: string | null
          exterior_color?: string | null
          exterior_features?: Json | null
          fuel?: string | null
          images?: Json | null
          interior_color?: string | null
          interior_features?: Json | null
          main_image?: string | null
          make?: string | null
          mileage_km?: never
          model?: string | null
          post_id?: number | null
          price?: number | null
          safety_tech?: Json | null
          status?: Database["public"]["Enums"]["post_status"] | null
          translations?: Json | null
          year?: number | null
        }
        Relationships: []
      }
      post_dash: {
        Row: {
          city: string | null
          condition: Database["public"]["Enums"]["vehicle_condition"] | null
          country: string | null
          created_at: string | null
          exterior_color: string | null
          interior_color: string | null
          make: string | null
          merchant_id: number | null
          mileage: number | null
          mileage_unit: Database["public"]["Enums"]["mileage_unit"] | null
          model: string | null
          post_id: number | null
          price: number | null
          state: string | null
          status: Database["public"]["Enums"]["post_status"] | null
          user_id: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          city?: string | null
          condition?: Database["public"]["Enums"]["vehicle_condition"] | null
          country?: string | null
          created_at?: string | null
          exterior_color?: string | null
          interior_color?: string | null
          make?: string | null
          merchant_id?: number | null
          mileage?: number | null
          mileage_unit?: Database["public"]["Enums"]["mileage_unit"] | null
          model?: string | null
          post_id?: number | null
          price?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["post_status"] | null
          user_id?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          city?: string | null
          condition?: Database["public"]["Enums"]["vehicle_condition"] | null
          country?: string | null
          created_at?: string | null
          exterior_color?: string | null
          interior_color?: string | null
          make?: string | null
          merchant_id?: number | null
          mileage?: number | null
          mileage_unit?: Database["public"]["Enums"]["mileage_unit"] | null
          model?: string | null
          post_id?: number | null
          price?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["post_status"] | null
          user_id?: string | null
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["merchant_id"]
          },
        ]
      }
      posts_app: {
        Row: {
          condition: Database["public"]["Enums"]["vehicle_condition"] | null
          featured_posts: boolean | null
          main_image: string | null
          make: string | null
          mileage_km: number | null
          model: string | null
          post_id: number | null
          price: number | null
          translations: Json | null
          year: number | null
        }
        Insert: {
          condition?: Database["public"]["Enums"]["vehicle_condition"] | null
          featured_posts?: boolean | null
          main_image?: string | null
          make?: string | null
          mileage_km?: never
          model?: string | null
          post_id?: number | null
          price?: number | null
          translations?: never
          year?: number | null
        }
        Update: {
          condition?: Database["public"]["Enums"]["vehicle_condition"] | null
          featured_posts?: boolean | null
          main_image?: string | null
          make?: string | null
          mileage_km?: never
          model?: string | null
          post_id?: number | null
          price?: number | null
          translations?: never
          year?: number | null
        }
        Relationships: []
      }
      posts_dash: {
        Row: {
          main_image: string | null
          make: string | null
          merchant_id: number | null
          model: string | null
          post_id: number | null
          status: Database["public"]["Enums"]["post_status"] | null
          user_id: string | null
          year: number | null
        }
        Insert: {
          main_image?: string | null
          make?: string | null
          merchant_id?: number | null
          model?: string | null
          post_id?: number | null
          status?: Database["public"]["Enums"]["post_status"] | null
          user_id?: string | null
          year?: number | null
        }
        Update: {
          main_image?: string | null
          make?: string | null
          merchant_id?: number | null
          model?: string | null
          post_id?: number | null
          status?: Database["public"]["Enums"]["post_status"] | null
          user_id?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["merchant_id"]
          },
        ]
      }
      posts_page: {
        Row: {
          condition: Database["public"]["Enums"]["vehicle_condition"] | null
          main_image: string | null
          make: string | null
          mileage_km: number | null
          model: string | null
          post_id: number | null
          price: number | null
          translations: Json | null
          year: number | null
        }
        Insert: {
          condition?: Database["public"]["Enums"]["vehicle_condition"] | null
          main_image?: string | null
          make?: string | null
          mileage_km?: never
          model?: string | null
          post_id?: number | null
          price?: number | null
          translations?: never
          year?: number | null
        }
        Update: {
          condition?: Database["public"]["Enums"]["vehicle_condition"] | null
          main_image?: string | null
          make?: string | null
          mileage_km?: never
          model?: string | null
          post_id?: number | null
          price?: number | null
          translations?: never
          year?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      convert_and_round_mileage: {
        Args: {
          mileage: number
          unit: Database["public"]["Enums"]["mileage_unit"]
        }
        Returns: number
      }
      current_merchant_id: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_deposit_paid: {
        Args: { p_order_id: number }
        Returns: boolean
      }
      is_merchant: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_portal_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_post_view: {
        Args: { input_post_id: number } | { input_post_id: string }
        Returns: undefined
      }
    }
    Enums: {
      condition_type: "New" | "Used" | "Certified"
      gateway_status: "paid" | "failed" | "refunded" | "completed" | "canceled"
      merchant_status: "active" | "pending" | "suspended" | "inactive"
      mileage_unit: "km" | "mi"
      order_status:
        | "initiated"
        | "deposit_paid"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "refunded"
      post_source: "website" | "dealer"
      post_status: "Available" | "Pending" | "Sold"
      vehicle_condition: "New" | "Used" | "Certified"
      verification_level: "none" | "basic" | "verified" | "premium"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  portal: {
    Tables: {
      portal_admin: {
        Row: {
          id: string
          user_id: string
          email: string
          role: 'super_admin' | 'admin' | 'moderator'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          role: 'super_admin' | 'admin' | 'moderator'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          role?: 'super_admin' | 'admin' | 'moderator'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      portal_import_posts: {
        Row: {
          id: string
          admin_user_id: string
          url: string
          source: string | null
          note: string | null
          status: 'pending' | 'analyzing' | 'analyzed' | 'rejected' | 'completed'
          raw_content: string | null
          raw_analysis: Json | null
          title: string | null
          description: string | null
          price: number | null
          currency: string
          year: number | null
          make: string | null
          model: string | null
          trim: string | null
          body_type: string | null
          fuel_type: string | null
          transmission: string | null
          engine: string | null
          mileage: number | null
          color: string | null
          condition: string | null
          features: Json
          images: Json
          main_image_url: string | null
          car_price: number | null
          shipping_cost: number
          broker_fee: number
          platform_fee: number
          customs_fee: number
          vat_amount: number
          total_cost: number
          workflow_step: 'raw' | 'details' | 'images' | 'pricing' | 'complete'
          step_completed: Json
          created_at: string
          updated_at: string
          last_analyzed_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          admin_user_id: string
          url: string
          source?: string | null
          note?: string | null
          status?: 'pending' | 'analyzing' | 'analyzed' | 'rejected' | 'completed'
          raw_content?: string | null
          raw_analysis?: Json | null
          title?: string | null
          description?: string | null
          price?: number | null
          currency?: string
          year?: number | null
          make?: string | null
          model?: string | null
          trim?: string | null
          body_type?: string | null
          fuel_type?: string | null
          transmission?: string | null
          engine?: string | null
          mileage?: number | null
          color?: string | null
          condition?: string | null
          features?: Json
          images?: Json
          main_image_url?: string | null
          car_price?: number | null
          shipping_cost?: number
          broker_fee?: number
          platform_fee?: number
          customs_fee?: number
          vat_amount?: number
          total_cost?: number
          workflow_step?: 'raw' | 'details' | 'images' | 'pricing' | 'complete'
          step_completed?: Json
          created_at?: string
          updated_at?: string
          last_analyzed_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          admin_user_id?: string
          url?: string
          source?: string | null
          note?: string | null
          status?: 'pending' | 'analyzing' | 'analyzed' | 'rejected' | 'completed'
          raw_content?: string | null
          raw_analysis?: Json | null
          title?: string | null
          description?: string | null
          price?: number | null
          currency?: string
          year?: number | null
          make?: string | null
          model?: string | null
          trim?: string | null
          body_type?: string | null
          fuel_type?: string | null
          transmission?: string | null
          engine?: string | null
          mileage?: number | null
          color?: string | null
          condition?: string | null
          features?: Json
          images?: Json
          main_image_url?: string | null
          car_price?: number | null
          shipping_cost?: number
          broker_fee?: number
          platform_fee?: number
          customs_fee?: number
          vat_amount?: number
          total_cost?: number
          workflow_step?: 'raw' | 'details' | 'images' | 'pricing' | 'complete'
          step_completed?: Json
          created_at?: string
          updated_at?: string
          last_analyzed_at?: string | null
          completed_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
  payments: {
    Tables: {
      checkout_sessions: {
        Row: {
          id: string
          post_id: number
          amount: number
          currency: string
          buyer_name: string
          buyer_city: string
          buyer_phone: string
          otp_id: string | null
          customer_id: number | null
          order_id: number | null
          provider: string
          psp_payment_id: string | null
          idempotency_key: string | null
          status: string
          return_url: string | null
          cancel_url: string | null
          user_id: string | null
          user_agent: string | null
          ip_inet: string | null
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          post_id: number
          amount?: number
          currency?: string
          buyer_name: string
          buyer_city: string
          buyer_phone: string
          otp_id?: string | null
          customer_id?: number | null
          order_id?: number | null
          provider: string
          psp_payment_id?: string | null
          idempotency_key?: string | null
          status?: string
          return_url?: string | null
          cancel_url?: string | null
          user_id?: string | null
          user_agent?: string | null
          ip_inet?: string | null
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          post_id?: number
          amount?: number
          currency?: string
          buyer_name?: string
          buyer_city?: string
          buyer_phone?: string
          otp_id?: string | null
          customer_id?: number | null
          order_id?: number | null
          provider?: string
          psp_payment_id?: string | null
          idempotency_key?: string | null
          status?: string
          return_url?: string | null
          cancel_url?: string | null
          user_id?: string | null
          user_agent?: string | null
          ip_inet?: string | null
          created_at?: string
          expires_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          session_id: string
          order_id: number
          post_id: number
          customer_id: number | null
          provider: string
          payment_id: string | null
          status: string
          amount: number
          currency: string
          idempotency_key: string | null
          meta: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          order_id: number
          post_id: number
          customer_id?: number | null
          provider: string
          payment_id?: string | null
          status: string
          amount: number
          currency?: string
          idempotency_key?: string | null
          meta?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          order_id?: number
          post_id?: number
          customer_id?: number | null
          provider?: string
          payment_id?: string | null
          status?: string
          amount?: number
          currency?: string
          idempotency_key?: string | null
          meta?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          id: string
          provider: string
          event_type: string
          event_id: string | null
          payload: Json
          signature: string | null
          received_at: string
          processed: boolean
          processed_at: string | null
          error: string | null
        }
        Insert: {
          id?: string
          provider: string
          event_type: string
          event_id?: string | null
          payload: Json
          signature?: string | null
          received_at?: string
          processed?: boolean
          processed_at?: string | null
          error?: string | null
        }
        Update: {
          id?: string
          provider?: string
          event_type?: string
          event_id?: string | null
          payload?: Json
          signature?: string | null
          received_at?: string
          processed?: boolean
          processed_at?: string | null
          error?: string | null
        }
        Relationships: []
      }
      refunds: {
        Row: {
          id: string
          transaction_id: string
          amount: number
          reason: string | null
          status: string
          created_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          transaction_id: string
          amount: number
          reason?: string | null
          status?: string
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          transaction_id?: string
          amount?: number
          reason?: string | null
          status?: string
          created_at?: string
          processed_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
  security: {
    Tables: {
      otp_verify: {
        Row: {
          id: string
          session_id: string
          phone: string
          otp_code: string
          expires_at: string
          is_verified: boolean
          created_at: string
          city: string | null
          name: string | null
          attempts: number
          last_attempt_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          phone: string
          otp_code: string
          expires_at: string
          is_verified?: boolean
          created_at?: string
          city?: string | null
          name?: string | null
          attempts?: number
          last_attempt_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          phone?: string
          otp_code?: string
          expires_at?: string
          is_verified?: boolean
          created_at?: string
          city?: string | null
          name?: string | null
          attempts?: number
          last_attempt_at?: string | null
        }
        Relationships: []
      }
      otp_debug: {
        Row: {
          id: number
          phone: string
          otp: string
          created_at: string
        }
        Insert: {
          id?: number
          phone: string
          otp: string
          created_at?: string
        }
        Update: {
          id?: number
          phone?: string
          otp?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      condition_type: ["New", "Used", "Certified"],
      gateway_status: ["paid", "failed", "refunded", "completed", "canceled"],
      merchant_status: ["active", "pending", "suspended", "inactive"],
      mileage_unit: ["km", "mi"],
      order_status: [
        "initiated",
        "deposit_paid",
        "in_progress",
        "completed",
        "cancelled",
        "refunded",
      ],
      post_source: ["website", "dealer"],
      post_status: ["Available", "Pending", "Sold"],
      vehicle_condition: ["New", "Used", "Certified"],
      verification_level: ["none", "basic", "verified", "premium"],
    },
  },
} as const

// Helper types for easier access
export type PortalAdmin = Database['portal']['Tables']['portal_admin']['Row']
export type PortalAdminInsert = Database['portal']['Tables']['portal_admin']['Insert']
export type PortalAdminUpdate = Database['portal']['Tables']['portal_admin']['Update']

export type ImportPost = Database['portal']['Tables']['portal_import_posts']['Row']
export type ImportPostInsert = Database['portal']['Tables']['portal_import_posts']['Insert']
export type ImportPostUpdate = Database['portal']['Tables']['portal_import_posts']['Update']

export type CheckoutSession = Database['payments']['Tables']['checkout_sessions']['Row']
export type CheckoutSessionInsert = Database['payments']['Tables']['checkout_sessions']['Insert']
export type CheckoutSessionUpdate = Database['payments']['Tables']['checkout_sessions']['Update']

export type Transaction = Database['payments']['Tables']['transactions']['Row']
export type TransactionInsert = Database['payments']['Tables']['transactions']['Insert']
export type TransactionUpdate = Database['payments']['Tables']['transactions']['Update']

export type OtpVerify = Database['security']['Tables']['otp_verify']['Row']
export type OtpVerifyInsert = Database['security']['Tables']['otp_verify']['Insert']
export type OtpVerifyUpdate = Database['security']['Tables']['otp_verify']['Update']