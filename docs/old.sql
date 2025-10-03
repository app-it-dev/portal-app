-- old.sql — CarsGate Legacy Schema (REFERENCE ONLY; not intended to run as-is)
-- Purpose: Provide Cursor with the *previous* schema and a structured mapping to the new schema in new_sql.md
-- so it can generate migrations and code updates smoothly.

/* =====================================================================
   1) LEGACY SCHEMA (AS PROVIDED) — FOR CONTEXT ONLY
   ---------------------------------------------------------------------
   Notes:
   - Types like USER-DEFINED are placeholders in the legacy dump.
   - Foreign keys reference objects that may not exist in this file.
   - Keep as reference to compare with the new production schema.
   ===================================================================== */

-- ========== TABLES ==========

-- customers
CREATE TABLE public.customers (
  id integer NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  city text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id)
);

-- gateway
CREATE TABLE public.gateway (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id integer NOT NULL,
  status text NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  refund_reason text,
  refund_date timestamp without time zone,
  note text,
  created_at timestamp with time zone,
  order_id integer,
  payment_id text,
  customer_id integer,
  CONSTRAINT gateway_pkey PRIMARY KEY (id),
  CONSTRAINT gateway_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT gateway_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(post_id),
  CONSTRAINT gateway_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);

-- merchants
CREATE TABLE public.merchants (
  merchant_id integer NOT NULL DEFAULT nextval('merchants_merchant_id_seq'::regclass),
  user_id uuid,
  business_name text NOT NULL,
  business_type text,
  logo_url text,
  website_url text,
  email text NOT NULL UNIQUE,
  phone text NOT NULL UNIQUE,
  secondary_phone text,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text,
  postal_code text NOT NULL,
  country text NOT NULL,
  business_hours jsonb DEFAULT '{}'::jsonb,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::merchant_status,
  description text,
  social_media jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT merchants_pkey PRIMARY KEY (merchant_id),
  CONSTRAINT merchants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- orders
CREATE TABLE public.orders (
  id integer NOT NULL,
  post_id integer NOT NULL,
  status USER-DEFINED NOT NULL,
  deposit_amount numeric DEFAULT NULL::numeric,
  final_payment_method text,
  final_payment_received_at timestamp with time zone,
  note text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  gateway_id uuid,
  customer_id integer,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(post_id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT orders_gateway_id_fkey FOREIGN KEY (gateway_id) REFERENCES public.gateway(id)
);

-- otp_debug
CREATE TABLE public.otp_debug (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  phone text NOT NULL,
  otp text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT otp_debug_pkey PRIMARY KEY (id)
);

-- otp_verify
CREATE TABLE public.otp_verify (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  city text,
  name text,
  CONSTRAINT otp_verify_pkey PRIMARY KEY (id)
);

-- post_views
CREATE TABLE public.post_views (
  id integer NOT NULL DEFAULT nextval('post_views_id_seq'::regclass),
  post_id integer,
  viewed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT post_views_pkey PRIMARY KEY (id),
  CONSTRAINT post_views_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(post_id)
);

-- posts
CREATE TABLE public.posts (
  post_id integer NOT NULL,
  merchant_id integer,
  user_id uuid DEFAULT auth.uid(),
  verified boolean NOT NULL DEFAULT false,
  status USER-DEFINED DEFAULT 'Available'::post_status,
  vin text,
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  engine text,
  fuel text,
  drivetrain text,
  mileage integer,
  mileage_unit USER-DEFINED DEFAULT 'mi'::mileage_unit,
  country text NOT NULL,
  state text,
  city text,
  condition USER-DEFINED NOT NULL,
  price bigint NOT NULL,
  exterior_color text,
  interior_color text,
  main_image text,
  images jsonb,
  specs jsonb DEFAULT '{}'::jsonb,
  exterior_features jsonb,
  interior_features jsonb,
  safety_tech jsonb,
  car_history jsonb,
  translations jsonb DEFAULT '{}'::jsonb,
  post_source USER-DEFINED DEFAULT 'website'::post_source,
  source_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  featured_posts boolean DEFAULT false,
  CONSTRAINT posts_pkey PRIMARY KEY (post_id),
  CONSTRAINT posts_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(merchant_id),
  CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- quotes
CREATE TABLE public.quotes (
  id integer NOT NULL,
  order_id integer NOT NULL,
  total_amount numeric NOT NULL,
  currency text DEFAULT 'SAR'::text,
  valid_until date,
  is_accepted boolean DEFAULT false,
  accepted_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  customer_id integer NOT NULL,
  CONSTRAINT quotes_pkey PRIMARY KEY (id),
  CONSTRAINT quotes_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT quotes_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);

-- ========== VIEWS ==========

-- public.post_app
create view public.post_app as
select 
  p.post_id,
  p.make,
  p.model,
  p.year,
  p.condition,
  p.price,
  convert_and_round_mileage (p.mileage, p.mileage_unit) as mileage_km,
  p.exterior_color,
  p.interior_color,
  p.main_image,
  p.images,
  p.engine,
  p.fuel,
  p.drivetrain,
  p.exterior_features,
  p.interior_features,
  p.safety_tech,
  p.car_history,
  p.status,
  p.country,
  p.translations
from posts p
where p.status = 'Available'::post_status and p.verified = true;

-- public.post_dash
create view public.post_dash as
select
  posts.post_id,
  posts.merchant_id,
  posts.user_id,
  posts.make,
  posts.model,
  posts.year,
  posts.vin,
  posts.condition,
  posts.mileage,
  posts.mileage_unit,
  posts.exterior_color,
  posts.interior_color,
  posts.created_at,
  posts.country,
  posts.state,
  posts.city,
  posts.price,
  posts.status
from posts;

-- public.post_views (redeclared later with CASCADE)
create table public.post_views (
  id serial not null,
  post_id integer null,
  viewed_at timestamp with time zone null default now(),
  constraint post_views_pkey primary key (id),
  constraint post_views_post_id_fkey foreign KEY (post_id) references posts (post_id) on delete CASCADE
) TABLESPACE pg_default;

-- public.posts_app
create view public.posts_app as
select
  p.post_id,
  p.make,
  p.model,
  p.year,
  p.condition,
  p.price,
  convert_and_round_mileage (p.mileage, p.mileage_unit) as mileage_km,
  p.main_image,
  p.featured_posts,
  jsonb_build_object(
    'ar',
    jsonb_build_object(
      'make',  p.translations ->> 'make_ar'::text,
      'model', p.translations ->> 'model_ar'::text
    )
  ) as translations
from posts p
where p.status = 'Available'::post_status and p.verified = true;

-- public.posts_dash
create view public.posts_dash as
select
  posts.post_id,
  posts.user_id,
  posts.merchant_id,
  posts.make,
  posts.model,
  posts.year,
  posts.status,
  posts.main_image
from posts;

-- public.posts_page
create view public.posts_page as
select
  p.post_id,
  p.make,
  p.model,
  p.year,
  p.condition,
  p.price,
  convert_and_round_mileage (p.mileage, p.mileage_unit) as mileage_km,
  p.main_image,
  jsonb_build_object(
    'ar',
    jsonb_build_object(
      'make',  p.translations ->> 'make_ar'::text,
      'model', p.translations ->> 'model_ar'::text
    )
  ) as translations
from posts p
where
  p.status = 'Available'::post_status
  and p.verified = true
  and (p.post_id = any (array[24262, 24463, 94083]));

-- ========== PORTAL (legacy) ==========
CREATE SCHEMA IF NOT EXISTS portal;

CREATE TABLE portal.portal_admin (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'moderator'::text])),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT portal_admin_pkey PRIMARY KEY (id),
  CONSTRAINT portal_admin_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE portal.portal_import_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  url text NOT NULL,
  source text,
  note text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'analyzing'::text, 'analyzed'::text, 'rejected'::text, 'completed'::text])),
  raw_content text,
  raw_analysis jsonb,
  title text,
  description text,
  price numeric,
  currency text DEFAULT 'USD'::text,
  year integer,
  make text,
  model text,
  trim text,
  body_type text,
  fuel_type text,
  transmission text,
  engine text,
  mileage integer,
  color text,
  condition text,
  features jsonb DEFAULT '[]'::jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  main_image_url text,
  car_price numeric,
  shipping_cost numeric DEFAULT 0,
  broker_fee numeric DEFAULT 0,
  platform_fee numeric DEFAULT 0,
  customs_fee numeric DEFAULT 0,
  vat_amount numeric DEFAULT 0,
  total_cost numeric DEFAULT 0,
  workflow_step text DEFAULT 'raw'::text CHECK (workflow_step = ANY (ARRAY['raw'::text, 'details'::text, 'images'::text, 'pricing'::text, 'complete'::text])),
  step_completed jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_analyzed_at timestamp with time zone,
  completed_at timestamp with time zone,
  CONSTRAINT portal_import_posts_pkey PRIMARY KEY (id),
  CONSTRAINT portal_import_posts_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES portal.portal_admin(id)
);

create view portal.admin_dashboard as
select
  pa.id as admin_id,
  pa.user_id,
  pa.email,
  pa.role,
  pa.is_active,
  pa.created_at as admin_since,
  count(pip.id) as total_posts,
  count(case when pip.status = 'pending' then 1 end) as pending_posts,
  count(case when pip.status = 'rejected' then 1 end) as rejected_posts,
  count(case when pip.status = 'completed' then 1 end) as completed_posts
from portal.portal_admin pa
left join portal.portal_import_posts pip on true
where pa.is_active = true
group by pa.id, pa.user_id, pa.email, pa.role, pa.is_active, pa.created_at;


/* =====================================================================
   2) REFERENCE MAPPING — Old -> New (overview)
   ---------------------------------------------------------------------
   Use this map to drive Cursor migrations and code refactors.
   =====================================================================

   | OLD OBJECT                         | NEW OBJECT / NOTES
   |------------------------------------|----------------------------------------------
   | public.customers (id int PK)       | public.customers (bigserial PK, +user_id, UNIQUE(phone))
   | public.gateway                     | payments.transactions + payments.webhook_events + payments.refunds
   | public.merchants                   | public.merchants (same idea; cleaned types, RLS)
   | public.orders                      | public.orders (+session_id UUID FK, +buyer_snapshot JSONB)
   | public.otp_verify (public)         | security.otp_verify (Edge-only, +session_id FK to payments.checkout_sessions)
   | public.otp_debug                   | security.otp_debug (admin-only; optional)
   | public.post_views                  | public.post_views (same; RLS tightened)
   | public.posts                       | public.posts (types, constraints, RLS tightened)
   | public.quotes                      | public.quotes (same; RLS clarified)
   | portal.portal_admin                | public.admins (simple 2-admins model) + portal.admin_dashboard view reads it
   | portal.portal_import_posts         | portal.portal_import_posts (unchanged semantics; RLS admins-only)
   | (N/A)                              | payments.checkout_sessions (new thread-id for OTP->Order->Txn)
   | (N/A)                              | public.is_deposit_paid(order_id) RPC (SECURITY DEFINER)

   Key flows:
   - Reservation: NEW payments.checkout_sessions(id) is the single join key:
       session -> security.otp_verify -> customers (upsert) -> orders -> payments.transactions
   - Audience apps: continue reading public views (posts_app/post_app/posts_page)
   - Brokers: use posts_dash/post_dash (RLS restricts to own)
   - Portal: admin JWT grants full RLS via public.admins

*/


/* =====================================================================
   3) AUTH & PORTAL CONNECTION (HOW-TO) — for Cursor codegen
   ---------------------------------------------------------------------
   - Auth: Supabase Auth (email magic link/OTP). After login, JWT has sub=auth.users.id.
   - Admin Gate: Table public.admins (new schema). If session.user.id ∈ admins & is_active=true -> admin.
   - Portal Access:
       * Next.js middleware checks session + SELECT admins row.
       * If not admin -> /403
       * Use createServerClient with anon key; user JWT in cookies enforces RLS.
   - No service role in browser.
   - payments & security schemas: no grants to anon/auth. Edge Functions (service_role) only.
   - To show payment status in UI: call RPC public.is_deposit_paid(order_id).
*/


/* =====================================================================
   4) SECURITY IMPLEMENTATION (SHORT CHECKLIST)
   ---------------------------------------------------------------------
   - RLS enabled on all base tables.
   - public.is_admin() checks membership in public.admins.
   - Merchants constrained by public.current_merchant_id().
   - Audience read is via views + column grants; VIN not exposed.
   - OTP plain (per business choice) in security.otp_verify; very short TTL; Edge-only.
   - payments.* isolated; webhooks write here; orders updated via session linkage.
   - Never ship service role to client; use server components/route handlers for admin pages.
*/


-- EOF
