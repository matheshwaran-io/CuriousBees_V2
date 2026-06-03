'use client';

import React from 'react';
import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="py-stack-xl text-center flex flex-col items-center justify-center z-10 mb-stack-xl">
      <div className="glass-panel p-stack-xl rounded-2xl max-w-3xl w-full">
        <h2 className="font-display-lg text-headline-xl md:text-[40px] text-on-surface mb-stack-md">
          Ready to shape the future?
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant mb-stack-lg max-w-xl mx-auto leading-relaxed">
          Join the leading minds at SRMIST. Establish your workspace, connect with peers, and elevate your research impact.
        </p>
        <Link href="/signup">
          <button className="bg-secondary text-on-secondary font-label-md text-label-md px-8 py-4 rounded-lg shadow-sm hover:opacity-90 transition-opacity active:scale-95 text-lg font-bold">
            Register Your Project
          </button>
        </Link>
      </div>
    </section>
  );
}
