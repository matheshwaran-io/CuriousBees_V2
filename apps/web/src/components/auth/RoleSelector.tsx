'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface RoleSelectorProps {
  value: 'FACULTY' | 'PHD_SCHOLAR';
  onChange: (value: 'FACULTY' | 'PHD_SCHOLAR') => void;
}

export default function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="pt-2 text-left">
      <label id="role-label" className="block font-label-caps text-label-caps text-on-surface-variant mb-2">
        Role
      </label>
      <div 
        role="radiogroup"
        aria-labelledby="role-label"
        className="flex p-1 bg-surface-container-high rounded-lg gap-1 border border-outline-variant/20"
      >
        {/* Supervisor Option */}
        <label className="flex-1 text-center cursor-pointer select-none">
          <input
            type="radio"
            name="role"
            value="FACULTY"
            checked={value === 'FACULTY'}
            onChange={() => onChange('FACULTY')}
            className="sr-only peer"
          />
          <div
            className={cn(
              "py-2 px-4 rounded-md font-label-md text-label-md text-on-surface-variant transition-all duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 outline-none",
              value === 'FACULTY'
                ? "bg-primary text-on-primary font-semibold shadow-sm"
                : "hover:bg-surface-container-highest/30 text-on-surface-variant"
            )}
          >
            Research Supervisor
          </div>
        </label>

        {/* Scholar Option */}
        <label className="flex-1 text-center cursor-pointer select-none">
          <input
            type="radio"
            name="role"
            value="PHD_SCHOLAR"
            checked={value === 'PHD_SCHOLAR'}
            onChange={() => onChange('PHD_SCHOLAR')}
            className="sr-only peer"
          />
          <div
            className={cn(
              "py-2 px-4 rounded-md font-label-md text-label-md text-on-surface-variant transition-all duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 outline-none",
              value === 'PHD_SCHOLAR'
                ? "bg-primary text-on-primary font-semibold shadow-sm"
                : "hover:bg-surface-container-highest/30 text-on-surface-variant"
            )}
          >
            Research Scholar
          </div>
        </label>
      </div>
    </div>
  );
}
