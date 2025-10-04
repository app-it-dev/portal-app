import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';

export async function GET() {
  // This API route should only be called from authenticated pages
  // The AdminAuthWrapper will handle authentication at the page level
  try {
    const supabase = getServerSupabase();
    
    // Fetch basic statistics from portal_import_posts
    const { data: stats, error: statsError } = await supabase
      .schema('portal')
      .from('portal_import_posts')
      .select('*');

    if (statsError) {
      console.error('Supabase error:', statsError);
      return NextResponse.json({ error: 'Failed to fetch posts data' }, { status: 500 });
    }

    // Calculate statistics for portal_import_posts
    const totalPosts = stats.length;
    const pendingPosts = stats.filter(p => p.status === 'pending').length;
    const analyzingPosts = stats.filter(p => p.status === 'analyzing').length;
    const analyzedPosts = stats.filter(p => p.status === 'analyzed').length;
    const rejectedPosts = stats.filter(p => p.status === 'rejected').length;
    const completedPosts = stats.filter(p => p.status === 'completed').length;
    
    const prices = stats.map(p => p.car_price).filter(p => p !== null && p !== undefined);
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const postsLast30Days = stats.filter(p => new Date(p.created_at) >= thirtyDaysAgo).length;

    // Make distribution (from analyzed posts)
    const makeCounts: { [key: string]: number } = {};
    stats.filter(p => p.make).forEach(post => {
      if (post.make) {
        makeCounts[post.make] = (makeCounts[post.make] || 0) + 1;
      }
    });
    const makeDistribution = Object.entries(makeCounts)
      .map(([make, count]) => ({ make, count }))
      .sort((a, b) => b.count - a.count);

    // Source distribution
    const sourceCounts: { [key: string]: number } = {};
    stats.filter(p => p.source).forEach(post => {
      if (post.source) {
        sourceCounts[post.source] = (sourceCounts[post.source] || 0) + 1;
      }
    });
    const sourceDistribution = Object.entries(sourceCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    // Price range distribution (using car_price)
    const priceRanges = [
      { range: 'Under $100k', min: 0, max: 100000 },
      { range: '$100k - $200k', min: 100000, max: 200000 },
      { range: '$200k - $300k', min: 200000, max: 300000 },
      { range: '$300k - $400k', min: 300000, max: 400000 },
      { range: '$400k - $500k', min: 400000, max: 500000 },
      { range: 'Over $500k', min: 500000, max: Infinity }
    ];
    
    const priceRangeDistribution = priceRanges.map(range => ({
      range: range.range,
      count: stats.filter(p => p.car_price && p.car_price >= range.min && p.car_price < range.max).length
    }));

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const postsInMonth = stats.filter(p => {
        const postDate = new Date(p.created_at);
        return postDate >= monthStart && postDate <= monthEnd;
      }).length;
      
      monthlyTrend.push({ month: monthName, posts: postsInMonth });
    }

    // Recent posts
    const recentPosts = stats
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(post => ({
        id: post.id,
        url: post.url,
        make: post.make,
        model: post.model,
        year: post.year,
        car_price: post.car_price,
        status: post.status,
        created_at: post.created_at
      }));

    const dashboardData = {
      totalPosts,
      pendingPosts,
      analyzingPosts,
      analyzedPosts,
      rejectedPosts,
      completedPosts,
      avgPrice,
      minPrice,
      maxPrice,
      postsLast30Days,
      makeDistribution,
      sourceDistribution,
      priceRangeDistribution,
      monthlyTrend,
      recentPosts
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
