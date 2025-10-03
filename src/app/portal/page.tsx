import { getServerSupabase } from '@/lib/supabaseServer';

export default async function PortalHome() {
  const supabase = await getServerSupabase();

  // Check authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  console.log('Server user:', user?.id, userError);

  // Check admin status
  const { data: adminCheck, error: adminError } = await supabase
    .from('admins')
    .select('user_id, role, is_active')
    .eq('user_id', user?.id)
    .eq('is_active', true)
    .limit(1);
  console.log('Admin check:', adminCheck, adminError);

  const { data: dashboard, error: dashboardError } = await supabase
    .schema('portal')
    .from('admin_dashboard')
    .select('*');

  const { data: posts, error: postsError } = await supabase
    .from('posts_dash')
    .select('*')
    .limit(50);

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, post_id, customer_id, status, deposit_amount, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  const ordersWithDeposit = await Promise.all((orders ?? []).map(async (o) => {
    const { data: paid } = await supabase.rpc('is_deposit_paid', { p_order_id: o.id });
    return { ...o, deposit_paid: !!paid };
  }));

  return (
    <pre>{JSON.stringify({ 
      user: user?.id, 
      adminCheck, 
      dashboard, 
      posts, 
      orders: ordersWithDeposit,
      errors: {
        userError,
        adminError,
        dashboardError,
        postsError,
        ordersError
      }
    }, null, 2)}</pre>
  );
}


