-- Complete schema fix for the 12 errors
-- This script will fix all the database issues

-- 1. Create missing schemas
CREATE SCHEMA IF NOT EXISTS portal;
CREATE SCHEMA IF NOT EXISTS payments;
CREATE SCHEMA IF NOT EXISTS security;

-- 2. Create missing tables
-- Create portal_import_posts table
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

-- 3. Add missing columns to existing tables
-- Add buyer_snapshot to orders table
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

-- 4. Create missing views
-- Create posts_dash view
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

-- 5. Create missing functions
-- Create is_deposit_paid function
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

-- 6. Enable RLS on all tables
ALTER TABLE portal.portal_import_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 7. Create permissive RLS policies for testing
-- Admins table
DROP POLICY IF EXISTS admins_self_read ON public.admins;
CREATE POLICY admins_self_read
  ON public.admins
  FOR SELECT
  TO authenticated
  USING (true);

-- Merchants table
DROP POLICY IF EXISTS merchants_admin_all ON public.merchants;
CREATE POLICY merchants_admin_all
  ON public.merchants FOR SELECT
  TO authenticated
  USING (true);

-- Orders table
DROP POLICY IF EXISTS orders_admin_all ON public.orders;
CREATE POLICY orders_admin_all
  ON public.orders FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- Portal import posts
DROP POLICY IF EXISTS portal_import_admin_all ON portal.portal_import_posts;
CREATE POLICY portal_import_admin_all
  ON portal.portal_import_posts FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- Posts table
DROP POLICY IF EXISTS posts_admin_all ON public.posts;
CREATE POLICY posts_admin_all
  ON public.posts FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- Customers table
DROP POLICY IF EXISTS customers_admin_all ON public.customers;
CREATE POLICY customers_admin_all
  ON public.customers FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- 8. Grant necessary permissions
-- Grant access to all tables and views
GRANT SELECT, INSERT, UPDATE, DELETE ON portal.portal_import_posts TO authenticated;
GRANT SELECT ON public.posts_dash TO authenticated, anon;
GRANT SELECT ON public.admins TO authenticated;
GRANT SELECT ON public.merchants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT ON public.posts TO authenticated, anon;
GRANT SELECT ON public.customers TO authenticated;

-- Grant access to views
GRANT SELECT ON public.post_app TO authenticated, anon;
GRANT SELECT ON public.posts_app TO authenticated, anon;
GRANT SELECT ON public.posts_page TO authenticated, anon;
GRANT SELECT ON public.post_dash TO authenticated;

-- Grant function access
GRANT EXECUTE ON FUNCTION public.is_deposit_paid(bigint) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- 9. Create missing enums if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('initiated','deposit_paid','in_progress','completed','cancelled','refunded');
  END IF;
END $$;

-- 10. Update order_status enum if needed
DO $$
BEGIN
    -- Add new enum values if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'initiated' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')) THEN
        ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'initiated';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'in_progress' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')) THEN
        ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'in_progress';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'refunded' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')) THEN
        ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'refunded';
    END IF;
END $$;
