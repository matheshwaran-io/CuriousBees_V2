import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse, NextFetchEvent } from 'next/server';

// 1. Define Public Routes
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  // Marketing / public pages — no login required
  '/about(.*)',
  '/research(.*)',
  '/education(.*)',
  '/institution(.*)',
  '/contact(.*)',
  '/features(.*)',
  '/privacy-policy(.*)',
  '/terms-of-service(.*)',
  '/ethics-framework(.*)',
  // Auth flow
  '/auth/denied(.*)',
  '/approval-pending(.*)',
  '/awaiting-supervisor-approval(.*)',
  '/account-rejected(.*)',
  '/error(.*)',
  // Admin panel uses its own PIN-based auth — bypass Clerk entirely
  '/sys-admin-login(.*)',
  '/sys-admin(.*)',
]);

// 2. Define the core Clerk Middleware logic
const coreMiddleware = clerkMiddleware(async (auth, request) => {
  const { userId, sessionClaims } = await auth();
  
  console.log(`[MIDDLEWARE INFO] Path: ${request.nextUrl.pathname}`);
  console.log(`[MIDDLEWARE INFO] Authenticated: ${!!userId}`);
  
  // Enforce SRMIST email domain restriction
  if (userId && sessionClaims) {
    const email = (sessionClaims as any).email || 
                  (sessionClaims as any).primary_email_address || 
                  (sessionClaims as any).primary_email || 
                  '';
    
    if (email && !email.toLowerCase().endsWith('@srmist.edu.in')) {
      if (!request.nextUrl.pathname.startsWith('/auth/denied')) {
        console.warn(`[MIDDLEWARE SECURITY] Blocking non-srmist email: ${email}`);
        return NextResponse.redirect(new URL('/auth/denied', request.url));
      }
    }
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

// 3. Export a resilient Edge wrapper around clerkMiddleware
export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  try {
    // Graceful configuration check
    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
      console.error("[MIDDLEWARE FATAL] Missing Clerk environment variables (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY or CLERK_SECRET_KEY).");
      if (request.nextUrl.pathname !== '/error') {
        return NextResponse.redirect(new URL('/error', request.url));
      }
      return NextResponse.next();
    }

    // Execute Clerk Middleware
    return await coreMiddleware(request, event);

  } catch (error: any) {
    // Next.js Redirect errors should not be swallowed
    if (error && error.message && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }

    // Safely catch edge runtime crashes
    console.error(`[MIDDLEWARE EXCEPTION] Path: ${request.nextUrl.pathname}`, error);
    
    // Prevent infinite redirect loops
    if (request.nextUrl.pathname !== '/error') {
      return NextResponse.redirect(new URL('/error', request.url));
    }
    return NextResponse.next();
  }
}

// 4. Safe Matcher Configuration
export const config = {
  matcher: [
    // Exclude API, _next/static, _next/image, images, static, favicon.ico and other assets
    "/((?!api|_next/static|_next/image|images|static|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2)$).*)"
  ]
};
