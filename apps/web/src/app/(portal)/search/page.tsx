'use client';
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import EventResultCard from '@/components/search/EventResultCard';
import RecommendationFeed from '@/components/search/RecommendationFeed';
import SearchBar from '@/components/search/SearchBar';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

async function fetchSearchResults(query: string, filters: Record<string, string>) {
  if (!query.trim()) return { results: [], total: 0 };
  const params = new URLSearchParams({ q: query, ...filters });
  const res = await apiFetch(`/api/search?${params}`);
  if (!res.ok) return { results: [], total: 0 };
  return res.json();
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ department: '', eventType: '', limit: '12' });
  const debouncedQuery = useDebounce(query, 350);

  const activeFilters: Record<string, string> = {};
  if (filters.department) activeFilters.department = filters.department;
  if (filters.eventType) activeFilters.eventType = filters.eventType;
  if (filters.limit) activeFilters.limit = filters.limit;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['semantic-search', debouncedQuery, activeFilters],
    queryFn: () => fetchSearchResults(debouncedQuery, activeFilters),
    enabled: debouncedQuery.trim().length > 1,
    staleTime: 30000,
  });

  const hasQuery = debouncedQuery.trim().length > 1;
  const results = data?.results ?? [];
  const isSearching = isLoading || isFetching;

  const clearQuery = useCallback(() => setQuery(''), []);

  return (
    <div className="min-h-screen bg-[#f5f3f1]">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#61b5db]" />
            <span className="text-xs font-medium text-[#61b5db] tracking-wider uppercase">Semantic Search</span>
          </div>
          <h1 className="text-3xl font-bold text-black mb-1">Campus Intelligence</h1>
          <p className="text-[#6e6e6e] text-sm">
            AI-powered search across all SRM events. Ask anything — <em>"AI workshops next month"</em>, <em>"Mechanical research talks"</em>
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative mb-6"
        >
          <SearchBar
            query={query}
            setQuery={setQuery}
            placeholder="Search events semantically — AI research, workshops, seminars..."
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            isSearching={isSearching}
            hasQuery={hasQuery}
            clearQuery={clearQuery}
          />

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-4 bg-white border border-[#e8e5e1] rounded-2xl grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-medium text-[#6e6e6e] uppercase tracking-wider mb-1.5 block">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Mechanical Engineering"
                      value={filters.department}
                      onChange={e => setFilters(f => ({ ...f, department: e.target.value }))}
                      className="w-full text-xs px-3 py-2 bg-[#f7f4f2] border border-[#e8e5e1] rounded-lg outline-none focus:border-black/30 text-black placeholder-[#a59f97]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-[#6e6e6e] uppercase tracking-wider mb-1.5 block">Event Type</label>
                    <select
                      value={filters.eventType}
                      onChange={e => setFilters(f => ({ ...f, eventType: e.target.value }))}
                      className="w-full text-xs px-3 py-2 bg-[#f7f4f2] border border-[#e8e5e1] rounded-lg outline-none focus:border-black/30 text-black"
                    >
                      <option value="">All types</option>
                      <option>Seminar</option>
                      <option>Workshop</option>
                      <option>Pre-Ph.D. Talk</option>
                      <option>Conference</option>
                      <option>FDP</option>
                      <option>Guest Lecture</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Search Results */}
        <AnimatePresence mode="wait">
          {hasQuery ? (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Result count */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-[#6e6e6e]">
                  {isSearching ? 'Searching semantically...' : `${results.length} results for "${debouncedQuery}"`}
                </p>
                {results.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#61b5db] animate-pulse" />
                    <span className="text-[10px] text-[#61b5db] font-medium">Vector Search Active</span>
                  </div>
                )}
              </div>

              {/* Results grid */}
              {results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {results.map((r: any, i: number) => (
                    <EventResultCard key={r.id} result={r} index={i} showScore={true} />
                  ))}
                </div>
              ) : !isSearching ? (
                <div className="text-center py-16 border border-dashed border-[#e8e5e1] rounded-2xl">
                  <Search className="w-8 h-8 text-[#e8e5e1] mx-auto mb-3" />
                  <p className="text-sm text-[#a59f97] mb-1">No semantic matches found</p>
                  <p className="text-xs text-[#a59f97]">Try different keywords or check spelling</p>
                </div>
              ) : null}
            </motion.div>
          ) : (
            <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RecommendationFeed />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
