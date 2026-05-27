import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const primaryHost = process.env.PRIMARY_HOST;
  const host = request.headers.get('host');

  if (primaryHost && host && host.endsWith('.vercel.app')) {
    const url = request.nextUrl.clone();
    url.protocol = 'https';
    url.host = primaryHost;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*'
};
