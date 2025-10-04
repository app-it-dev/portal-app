-- Quick fix for the 12 errors - minimal changes needed

-- 1. Create portal schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS portal;

-- 2. Grant permissions to authenticated users
GRANT USAGE ON SCHEMA portal TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 3. Grant table access
GRANT SELECT ON public.admins TO authenticated;
GRANT SELECT ON public.merchants TO authenticated;
GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.posts TO authenticated;
GRANT SELECT ON public.customers TO authenticated;

-- 4. Create posts_dash view if it doesn't exist
CREATE OR REPLACE VIEW public.posts_dash AS
SELECT
  p.post_id,
  p.user_id,
  p.merchant_id,
  p.make,
  p.model,
  p.year,
  p.status,
  p.main_image
FROM public.posts p;

-- 5. Grant view access
GRANT SELECT ON public.posts_dash TO authenticated, anon;

-- 6. Create portal_import_posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS portal.portal_import_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  url text NOT NULL,
  source text,
  note text,
  status text NOT NULL DEFAULT 'pending',
  raw_content text,
  raw_analysis jsonb,
  title text,
  description text,
  price numeric,
  currency text DEFAULT 'USD',
  year int,
  make text,
  model text,
  trim text,
  body_type text,
  fuel_type text,
  transmission text,
  engine text,
  mileage int,
  color text,
  condition text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  main_image_url text,
  car_price numeric,
  shipping_cost numeric NOT NULL DEFAULT 0,
  broker_fee numeric NOT NULL DEFAULT 0,
  platform_fee numeric NOT NULL DEFAULT 0,
  customs_fee numeric NOT NULL DEFAULT 0,
  vat_amount numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  workflow_step text DEFAULT 'raw',
  step_completed jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_analyzed_at timestamptz,
  completed_at timestamptz
);

-- 7. Grant access to portal_import_posts
GRANT SELECT, INSERT, UPDATE, DELETE ON portal.portal_import_posts TO authenticated;

-- 8. Disable RLS temporarily for testing
ALTER TABLE portal.portal_import_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
