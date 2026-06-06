import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/about(.*)',
  '/features(.*)',
  '/auth/denied(.*)',
  '/approval-pending(.*)',
  '/account-rejected(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId, sessionClaims } = await auth();

  // Enforce SRMIST email domain restriction
  if (userId && sessionClaims) {
    const email = (sessionClaims as any).email || 
                  (sessionClaims as any).primary_email_address || 
                  (sessionClaims as any).primary_email || 
                  '';
    
    if (email && !email.toLowerCase().endsWith('@srmist.edu.in')) {
      if (!request.nextUrl.pathname.startsWith('/auth/denied')) {
        return NextResponse.redirect(new URL('/auth/denied', request.url));
      }
    }
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
