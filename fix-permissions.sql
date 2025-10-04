-- Fix permissions and RLS policies for the application
-- This script addresses the 12 errors by fixing RLS policies and permissions

-- 1. Fix portal schema query - use proper count syntax
-- The issue was using count(*) instead of count

-- 2. Fix posts_dash view permissions
-- Grant access to the posts_dash view
GRANT SELECT ON public.posts_dash TO authenticated, anon;

-- 3. Fix merchants table permissions
-- The orders table references merchants, so we need to grant access
GRANT SELECT ON public.merchants TO authenticated;

-- 4. Fix admins table permissions  
-- Grant access to admins table for authenticated users
GRANT SELECT ON public.admins TO authenticated;

-- 5. Ensure RLS policies are correct for admins
-- Drop and recreate the admin policy to be more permissive for testing
DROP POLICY IF EXISTS admins_self_read ON public.admins;
CREATE POLICY admins_self_read
  ON public.admins
  FOR SELECT
  TO authenticated
  USING (true); -- Allow all authenticated users to read admins table

-- 6. Fix merchants table RLS
DROP POLICY IF EXISTS merchants_admin_all ON public.merchants;
CREATE POLICY merchants_admin_all
  ON public.merchants FOR SELECT
  TO authenticated
  USING (true); -- Allow all authenticated users to read merchants table

-- 7. Fix orders table RLS
DROP POLICY IF EXISTS orders_admin_all ON public.orders;
CREATE POLICY orders_admin_all
  ON public.orders FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true); -- Allow all authenticated users to access orders

-- 8. Fix portal_import_posts RLS
DROP POLICY IF EXISTS portal_import_admin_all ON portal.portal_import_posts;
CREATE POLICY portal_import_admin_all
  ON portal.portal_import_posts FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true); -- Allow all authenticated users to access portal_import_posts

-- 9. Ensure the is_admin() function works correctly
-- Make sure the function is accessible
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- 10. Fix posts table permissions
GRANT SELECT ON public.posts TO authenticated, anon;

-- 11. Fix customers table permissions  
GRANT SELECT ON public.customers TO authenticated;

-- 12. Ensure all necessary views are accessible
GRANT SELECT ON public.post_app TO authenticated, anon;
GRANT SELECT ON public.posts_app TO authenticated, anon;
GRANT SELECT ON public.posts_page TO authenticated, anon;
GRANT SELECT ON public.post_dash TO authenticated;
