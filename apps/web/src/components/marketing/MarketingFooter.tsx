'use client';

import React from 'react';
import Logo from '../Logo';

export default function MarketingFooter() {
  return (
    <footer className="bg-surface-container-lowest w-full px-margin-desktop py-stack-lg flex flex-col md:flex-row justify-between items-center gap-stack-md border-t border-outline-variant/30 mt-auto z-20 relative">
      <div className="flex items-center gap-stack-sm">
        <Logo showText={true} size={24} />
      </div>
      <p className="font-body-sm text-body-sm text-primary">
        © {new Date().getFullYear()} CuriousBees Institutional Research. All rights reserved.
      </p>
      <nav className="flex gap-stack-md flex-wrap justify-center">
        <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary transition-colors" href="#">Privacy Policy</a>
        <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary transition-colors" href="#">Terms of Service</a>
        <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary transition-colors" href="#">Ethics Framework</a>
        <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary transition-colors" href="#">Contact</a>
      </nav>
    </footer>
  );
}
