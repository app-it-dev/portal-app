-- Migration script to align database with new_sql.md schema
-- This script will add missing columns and update the schema

-- 1. Add buyer_snapshot column to orders table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'buyer_snapshot'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN buyer_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. Update order_status enum if needed
DO $$
BEGIN
    -- Check if the new enum values exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'initiated' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
    ) THEN
        -- Add new enum values
        ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'initiated';
        ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'in_progress';
        ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'refunded';
    END IF;
END $$;

-- 3. Ensure portal schema exists
CREATE SCHEMA IF NOT EXISTS portal;

-- 4. Create portal_import_posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS portal.portal_import_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES public.admins(user_id) ON DELETE CASCADE,
  url text NOT NULL,
  source text,
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','analyzing','analyzed','rejected','completed')),
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
  workflow_step text DEFAULT 'raw' CHECK (workflow_step IN ('raw','details','images','pricing','complete')),
  step_completed jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_analyzed_at timestamptz,
  completed_at timestamptz
);

-- 5. Enable RLS on portal_import_posts
ALTER TABLE portal.portal_import_posts ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policy for portal_import_posts
DROP POLICY IF EXISTS portal_import_admin_all ON portal.portal_import_posts;
CREATE POLICY portal_import_admin_all
  ON portal.portal_import_posts FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 7. Create posts_dash view if it doesn't exist
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

-- 8. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON portal.portal_import_posts TO authenticated;
GRANT SELECT ON public.posts_dash TO authenticated;

-- 9. Create the is_deposit_paid function if it doesn't exist
CREATE OR REPLACE FUNCTION public.is_deposit_paid(p_order_id bigint)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, payments
AS $$
  SELECT EXISTS(
    SELECT 1
    FROM payments.transactions t
    JOIN public.orders o ON o.id = t.order_id
    WHERE o.id = p_order_id
      AND t.status IN ('authorized','captured')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_deposit_paid(bigint) TO authenticated, anon;
