import type { Metadata } from 'next';
import QueryProvider from '@/components/QueryProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'CuriousBees — Elevating Academic Research & Collaboration',
  description: 'CuriousBees is a premium university-grade research platform connecting scholars, supervisors, and institutions for seamless collaboration, academic tracking, and innovation.',
  icons: {
    icon: '/icon.png',
    apple: '/apple-touch-icon.png',
    shortcut: '/logo.png',
  },
  openGraph: {
    title: 'CuriousBees — Elevating Academic Research',
    description: 'A premium university-grade research platform connecting scholars, supervisors, and institutions.',
    type: 'website',
    images: ['/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CuriousBees — Academic Research Platform',
    description: 'A premium university-grade research platform connecting scholars, supervisors, and institutions.',
    images: ['/logo.png'],
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
        <QueryProvider>
          {/* Global 3% noise texture overlay */}
          <div className="noise-overlay" />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}

// Utility to handle typescript parameter typings without syntax bugs
type Readrules<T> = Readonly<T>;

