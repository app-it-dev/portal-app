import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabaseServer';

export async function GET() {
  // This API route should only be called from authenticated pages
  // The AdminAuthWrapper will handle authentication at the page level
  try {
    const supabase = getServerSupabase();
    
    // Fetch basic statistics
    const { data: stats, error: statsError } = await supabase
      .from('post_dash')
      .select('*');

    if (statsError) {
      console.error('Supabase error:', statsError);
      return NextResponse.json({ error: 'Failed to fetch posts data' }, { status: 500 });
    }

    // Calculate statistics
    const totalPosts = stats.length;
    const availablePosts = stats.filter(p => p.status === 'Available').length;
    const pendingPosts = stats.filter(p => p.status === 'Pending').length;
    const soldPosts = stats.filter(p => p.status === 'Sold').length;
    const verifiedPosts = stats.filter(p => p.verified).length;
    
    const prices = stats.map(p => p.price).filter(p => p);
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const postsLast30Days = stats.filter(p => new Date(p.created_at) >= thirtyDaysAgo).length;

    // Make distribution
    const makeCounts: { [key: string]: number } = {};
    stats.forEach(post => {
      makeCounts[post.make] = (makeCounts[post.make] || 0) + 1;
    });
    const makeDistribution = Object.entries(makeCounts)
      .map(([make, count]) => ({ make, count }))
      .sort((a, b) => b.count - a.count);

    // Country distribution
    const countryCounts: { [key: string]: number } = {};
    stats.forEach(post => {
      countryCounts[post.country] = (countryCounts[post.country] || 0) + 1;
    });
    const countryDistribution = Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    // Price range distribution
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
      count: stats.filter(p => p.price >= range.min && p.price < range.max).length
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
        post_id: post.post_id,
        make: post.make,
        model: post.model,
        year: post.year,
        price: post.price,
        status: post.status,
        created_at: post.created_at
      }));

    const dashboardData = {
      totalPosts,
      availablePosts,
      pendingPosts,
      soldPosts,
      verifiedPosts,
      avgPrice,
      minPrice,
      maxPrice,
      postsLast30Days,
      makeDistribution,
      countryDistribution,
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
