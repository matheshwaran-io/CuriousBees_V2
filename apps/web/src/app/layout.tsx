import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: 'CuriousBees — Elevating Academic Research & Collaboration',
  description: 'CuriousBees is a premium university-grade research platform connecting scholars, supervisors, and institutions for seamless collaboration, academic tracking, and innovation.',
  openGraph: {
    title: 'CuriousBees — Elevating Academic Research',
    description: 'A premium university-grade research platform connecting scholars, supervisors, and institutions.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CuriousBees — Academic Research Platform',
    description: 'A premium university-grade research platform connecting scholars, supervisors, and institutions.',
  }
};

export default function RootLayout({
  children,
}: Readrules<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" style={{ colorScheme: 'light' }}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  console.log('[CLERK TRACE] Document head script executing, process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY present:', !!'${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}');
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
                  localStorage.setItem('curiousbees-theme', 'light');
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="antialiased bg-darkBg text-textPrimary relative min-h-screen">

        <ClerkProvider>
          {/* Global 3% noise texture overlay */}
          <div className="noise-overlay" />
          {/* Clerk Smart CAPTCHA anchor for Custom Flows */}
          <div id="clerk-captcha" />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}

// Utility to handle typescript parameter typings without syntax bugs
type Readrules<T> = Readonly<T>;

