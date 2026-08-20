import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  let next = searchParams.get('next') || searchParams.get('redirectTo') || '/feed';

  // Prevent open redirect attacks: ensure next is a relative path
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/feed';
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const email = data.user.email?.toLowerCase().trim() || '';

      // Check allowed domains (enforcing SRMIST & Gmail during this stage)
      const allowedDomains = (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS || 'srmist.edu.in,gmail.com')
        .split(',')
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);

      const isAllowed = allowedDomains.some((domain) => email.endsWith('@' + domain));

      if (!isAllowed) {
        console.warn(`[AUTH CALLBACK] Unauthorized email domain: ${email}. Signing out.`);
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/access-denied`);
      }

      // Check if forward URL contains an absolute origin or relative path
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } else {
      console.error('[AUTH CALLBACK] Error exchanging code for session:', error?.message);
    }
  }

  // If code exchange failed or was missing, return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
