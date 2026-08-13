'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Building2, MapPin, X } from 'lucide-react';
import { 
  SRMVenue, 
  SRM_MAJOR_VENUES, 
  SRM_TECH_PARK_2_VENUES, 
  ALL_SRM_VENUES,
  encodeVenueObject,
  formatVenueDisplay
} from '@/constants/srmVenues';

interface SRMVenueSelectorProps {
  value: string;
  onChange: (formattedVenue: string) => void;
  error?: string;
}

export function SRMVenueSelector({ value, onChange, error }: SRMVenueSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<SRMVenue | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDetails, setCustomDetails] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize or sync with string value
  useEffect(() => {
    if (!value) {
      setSelectedVenue(null);
      setIsCustom(false);
      setCustomName('');
      setCustomDetails('');
      return;
    }

    const formatted = formatVenueDisplay(value);
    const matched = ALL_SRM_VENUES.find(v => v.name.toLowerCase() === formatted.title.toLowerCase() || encodeVenueObject(v) === value);

    if (matched) {
      setSelectedVenue(matched);
      setIsCustom(false);
    } else {
      setSelectedVenue(null);
      setIsCustom(true);
      setCustomName(formatted.title !== 'Main Auditorium' ? formatted.title : value);
      setCustomDetails(formatted.subtitle ? `${formatted.subtitle}${formatted.details ? ' · ' + formatted.details : ''}` : '');
    }
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter venues based on search
  const filteredMajorVenues = useMemo(() => {
    if (!searchQuery.trim()) return SRM_MAJOR_VENUES;
    const q = searchQuery.toLowerCase();
    return SRM_MAJOR_VENUES.filter(v => 
      v.name.toLowerCase().includes(q) ||
      v.building.toLowerCase().includes(q) ||
      (v.floor && v.floor.toLowerCase().includes(q)) ||
      (v.capacity && v.capacity.toString().includes(q))
    );
  }, [searchQuery]);

  const filteredTechPark2Venues = useMemo(() => {
    if (!searchQuery.trim()) return SRM_TECH_PARK_2_VENUES;
    const q = searchQuery.toLowerCase();
    return SRM_TECH_PARK_2_VENUES.filter(v => 
      v.name.toLowerCase().includes(q) ||
      v.building.toLowerCase().includes(q) ||
      (v.floor && v.floor.toLowerCase().includes(q)) ||
      (v.room && v.room.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const handleSelectPredefined = (venue: SRMVenue) => {
    setSelectedVenue(venue);
    setIsCustom(false);
    setIsOpen(false);
    setSearchQuery('');
    const encoded = encodeVenueObject(venue);
    onChange(encoded);
  };

  const handleSelectCustom = () => {
    setSelectedVenue(null);
    setIsCustom(true);
    setIsOpen(false);
    setSearchQuery('');
    updateCustomValue(customName, customDetails);
  };

  const updateCustomValue = (name: string, details: string) => {
    setCustomName(name);
    setCustomDetails(details);
    if (!name.trim()) {
      onChange('');
    } else {
      const parts = [name.trim()];
      if (details.trim()) parts.push(details.trim());
      onChange(parts.join(' | '));
    }
  };

  const handleClearSelection = () => {
    setSelectedVenue(null);
    setIsCustom(false);
    setCustomName('');
    setCustomDetails('');
    onChange('');
  };

  const currentDisplay = useMemo(() => {
    if (selectedVenue) {
      return {
        title: selectedVenue.name,
        subtitle: [selectedVenue.building, selectedVenue.floor].filter(Boolean).join(' · '),
        details: selectedVenue.capacity ? `Capacity: ${selectedVenue.capacity}` : (selectedVenue.room ? `Room: ${selectedVenue.room}` : '')
      };
    }
    if (isCustom && customName.trim()) {
      return {
        title: customName,
        subtitle: customDetails || 'Custom Venue',
        details: 'Custom Location'
      };
    }
    return null;
  }, [selectedVenue, isCustom, customName, customDetails]);

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        VENUE / LOCATION
      </label>

      {/* Selected Card or Dropdown Trigger */}
      {currentDisplay && !isOpen ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between transition-all hover:border-[#0C4DA2]/50">
          <div className="flex items-start space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#0C4DA2]/10 border border-[#0C4DA2]/20 flex items-center justify-center shrink-0 mt-0.5">
              <Building2 className="w-4 h-4 text-[#0C4DA2]" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">{currentDisplay.title}</h4>
              {currentDisplay.subtitle && (
                <p className="text-[11px] font-medium text-slate-500 truncate">{currentDisplay.subtitle}</p>
              )}
              {currentDisplay.details && (
                <span className="inline-block mt-1 text-[10px] font-semibold text-[#0C4DA2] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {currentDisplay.details}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="px-2.5 py-1.5 text-[11px] font-bold text-[#0C4DA2] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            >
              Change
            </button>
            <button
              type="button"
              onClick={handleClearSelection}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3.5 py-2.5 bg-white border ${
            error ? 'border-red-400' : 'border-slate-200'
          } rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0C4DA2] focus:ring-1 focus:ring-[#0C4DA2] transition-all flex items-center justify-between cursor-pointer min-h-[44px]`}
        >
          <span className={selectedVenue || isCustom ? 'font-semibold text-slate-900' : 'text-slate-400'}>
            Select SRM KTR venue...
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Custom Venue Input Fields */}
      {isCustom && !isOpen && (
        <div className="space-y-3 pt-2 pl-1 border-l-2 border-[#0C4DA2]/30">
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              CUSTOM VENUE NAME <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => updateCustomValue(e.target.value, customDetails)}
              placeholder="E.g. Department Seminar Hall 3"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0C4DA2] focus:ring-1 focus:ring-[#0C4DA2]"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              OPTIONAL LOCATION DETAILS
            </label>
            <input
              type="text"
              value={customDetails}
              onChange={(e) => updateCustomValue(customName, e.target.value)}
              placeholder="E.g. Bio Engineering Block · 3rd Floor"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0C4DA2] focus:ring-1 focus:ring-[#0C4DA2]"
            />
          </div>
        </div>
      )}

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-80 text-left">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search venue, building, room or capacity..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0C4DA2]"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto divide-y divide-slate-100 p-1">
            
            {/* GROUP 1: MAJOR VENUES */}
            {filteredMajorVenues.length > 0 && (
              <div className="py-1">
                <div className="px-3 py-1.5 text-[9px] font-extrabold text-[#0C4DA2] uppercase tracking-widest bg-slate-50/80 rounded-md mb-1">
                  SRM KTR — MAJOR VENUES
                </div>
                {filteredMajorVenues.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelectPredefined(v)}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50/70 rounded-lg transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-[#0C4DA2] flex items-center gap-1.5">
                        <span>{v.name}</span>
                      </div>
                      <div className="text-[10px] font-medium text-slate-500 truncate mt-0.5">
                        {v.building}{v.floor ? ` · ${v.floor}` : ''}
                      </div>
                    </div>
                    {v.capacity && (
                      <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                        {v.capacity} seats
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* GROUP 2: TECH PARK 2 */}
            {filteredTechPark2Venues.length > 0 && (
              <div className="py-1">
                <div className="px-3 py-1.5 text-[9px] font-extrabold text-[#0C4DA2] uppercase tracking-widest bg-slate-50/80 rounded-md mb-1">
                  SRM KTR — TECH PARK 2
                </div>
                {filteredTechPark2Venues.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelectPredefined(v)}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50/70 rounded-lg transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-slate-800 group-hover:text-[#0C4DA2]">
                        {v.name}
                      </div>
                      <div className="text-[10px] font-medium text-slate-500 truncate mt-0.5">
                        {v.building}{v.floor ? ` · ${v.floor}` : ''}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                      {v.floor}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* NO MATCHES */}
            {filteredMajorVenues.length === 0 && filteredTechPark2Venues.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500 font-medium">
                No matching SRM venues found.
              </div>
            )}

            {/* GROUP 3: OTHER / CUSTOM VENUE */}
            <div className="py-1 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSelectCustom}
                className="w-full px-3 py-2.5 text-left hover:bg-amber-50/80 rounded-lg transition-colors flex items-center justify-between text-[#0C4DA2] font-bold text-xs cursor-pointer"
              >
                <span>OTHER / CUSTOM VENUE</span>
                <span className="text-[10px] font-medium text-slate-400">Enter manually →</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {error && (
        <p className="text-[10px] text-red-500 font-semibold">{error}</p>
      )}
    </div>
  );
}
