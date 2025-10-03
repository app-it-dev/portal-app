import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const res = NextResponse.next();

  // Only guard /portal/*
  if (!url.pathname.startsWith('/portal')) {
    return res;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          res.cookies.set(name, '', options);
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Check admin membership via RLS
  const { data: admins } = await supabase
    .from('admins')
    .select('user_id, is_active')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .limit(1);

  if (!admins || admins.length === 0) {
    url.pathname = '/unauthorized';
    return NextResponse.rewrite(url);
  }

  return res;
}

export const config = {
  matcher: ['/portal/:path*'],
};


