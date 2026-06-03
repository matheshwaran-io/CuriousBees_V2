'use client';

import React from 'react';
import Link from 'next/link';
import Logo from '../Logo';

export default function MarketingNavbar() {
  return (
    <header className="bg-surface/85 backdrop-blur-md shadow-sm border-b border-outline-variant/20 fixed top-0 w-full z-50 flex justify-between items-center px-margin-desktop py-4 max-w-container-max mx-auto left-0 right-0">
      <Link href="/">
        <Logo showText={true} size={32} />
      </Link>
      
      <nav className="hidden md:flex gap-gutter items-center">
        <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Research</a>
        <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Education</a>
        <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Institutions</a>
        <a className="font-body-md text-body-md text-primary font-bold border-b-2 border-primary pb-1" href="#">About</a>
      </nav>
      
      <div className="flex items-center gap-stack-md">
        <Link href="/login">
          <button className="font-label-md text-label-md text-primary hover:opacity-80 transition-opacity active:scale-95 transition-transform hidden sm:block">
            Login
          </button>
        </Link>
        <Link href="/signup">
          <button className="font-label-md text-label-md bg-primary text-on-primary px-4 py-2 rounded-lg hover:opacity-80 transition-opacity active:scale-95 transition-transform">
            Sign Up
          </button>
        </Link>
      </div>
    </header>
  );
}
