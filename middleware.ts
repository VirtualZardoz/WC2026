import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin routes require admin role
    if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
      if (token?.role !== 'admin') {
        // For API routes, return 403 Forbidden
        if (path.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Forbidden: Admin access required' },
            { status: 403 }
          );
        }
        // For pages, redirect to home with error
        return NextResponse.redirect(new URL('/?error=admin_required', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Return true to allow the request to proceed to the middleware function
      // Return false to redirect to login
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Public routes - no auth required
        const publicRoutes = [
          '/login',
          '/register',
          '/api/auth',
        ];

        if (publicRoutes.some(route => path.startsWith(route))) {
          return true;
        }

        // All other matched routes require authentication
        return !!token;
      },
    },
  }
);

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    // Protected user pages
    '/predictions/:path*',
    '/profile/:path*',
    '/leaderboard/:path*',
    '/results/:path*',

    // Admin pages
    '/admin/:path*',

    // Protected API routes
    '/api/predictions/:path*',
    '/api/profile/:path*',
    '/api/admin/:path*',
  ],
};
