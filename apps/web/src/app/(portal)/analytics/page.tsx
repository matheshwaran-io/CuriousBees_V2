'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Download, 
  RefreshCw, 
  Database, 
  Activity, 
  Cpu, 
  Layers, 
  ArrowUpRight, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Compass,
  FileText
} from 'lucide-react';
import { apiFetch } from '@/lib/api-client';

async function fetchAnalyticsData(endpoint: string) {
  const res = await apiFetch(`/api/analytics/${endpoint}`);
  if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
  return res.json();
}

async function triggerClustering() {
  const res = await apiFetch('/api/analytics/trigger-clustering', {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to run semantic clustering');
  return res.json();
}

export default function AnalyticsPage() {
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedDept, setSelectedDept] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'observability' | 'clusters' | 'research'>('overview');

  // Query overview stats (polled every 5 seconds for live dashboard feeling!)
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics-overview', timeRange, selectedDept],
    queryFn: () => fetchAnalyticsData(`overview?timeRange=${timeRange}&department=${selectedDept}`),
    refetchInterval: 5000,
  });

  // Query AI trends and insights
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['analytics-trends'],
    queryFn: () => fetchAnalyticsData('trends'),
    refetchInterval: 10000,
  });

  // Query pgvector semantic clusters
  const { data: clusters, isLoading: clustersLoading } = useQuery({
    queryKey: ['analytics-clusters'],
    queryFn: () => fetchAnalyticsData('clusters'),
  });

  // Query interdisciplinary collaboration
  const { data: research, isLoading: researchLoading } = useQuery({
    queryKey: ['analytics-research'],
    queryFn: () => fetchAnalyticsData('research'),
  });

  // Query AI observability (latency, Redis, host stats)
  const { data: telemetry, isLoading: telemetryLoading, isFetching: telemetryFetching } = useQuery({
    queryKey: ['analytics-observability'],
    queryFn: () => fetchAnalyticsData('observability'),
    refetchInterval: 3000, // rapid live refresh for observability!
  });

  // Mutation to manual-trigger semantic clustering
  const clusterMutation = useMutation({
    mutationFn: triggerClustering,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics-clusters'] });
    },
  });

  const handleDownloadCsv = async (type: string) => {
    try {
      const res = await apiFetch(`/api/analytics/export?type=${type}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `curiousbees-analytics-${type}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error('Failed to download CSV:', e);
    }
  };

  // Safe loading check
  const isLoading = overviewLoading || trendsLoading || clustersLoading || researchLoading || telemetryLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f3f1] flex flex-col items-center justify-center gap-3">
        <Activity className="w-8 h-8 text-[#61b5db] animate-spin" />
        <span className="text-xs text-[#a59f97] font-sans font-medium uppercase tracking-widest">
          Assembling campus intelligence...
        </span>
      </div>
    );
  }

  // Calculate dynamic SVG Area Chart parameters for Event Growth
  const timeline = overview?.growthTimeline || [];
  const maxTimelineVal = Math.max(...timeline.map((t: any) => t.count), 5);
  const chartHeight = 120;
  const chartWidth = 500;
  const padding = 15;
  const points = timeline.map((t: any, index: number) => {
    const x = padding + (index * (chartWidth - padding * 2)) / Math.max(timeline.length - 1, 1);
    const y = chartHeight - padding - (t.count * (chartHeight - padding * 2)) / maxTimelineVal;
    return { x, y };
  });
  const pathData = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p: any) => `L ${p.x} ${p.y}`).join(' ')
    : '';
  const areaData = points.length > 0
    ? `${pathData} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`
    : '';

  return (
    <div className="min-h-screen bg-[#f5f3f1] pb-16">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Dashboard Title & Meta */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-[#61b5db]" />
              <span className="text-[10px] font-bold text-[#61b5db] tracking-wider uppercase">
                Institutional Intelligence Dashboard
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-black tracking-tight leading-none">
              SRM Campus Insights
            </h1>
            <p className="text-xs text-[#8c857b] mt-1.5 font-sans max-w-xl">
              Real-time analytics, vector-based interdisciplinary research clustering, semantic telemetry, and AI statistical intelligence logs.
            </p>
          </div>

          {/* Time & Department filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-xs px-3 py-2 bg-white border border-[#e8e5e1] rounded-xl outline-none focus:border-black/30 font-semibold text-black"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <input
              type="text"
              placeholder="Filter by Dept (e.g. CSE)"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs px-3 py-2 bg-white border border-[#e8e5e1] rounded-xl outline-none focus:border-black/30 font-semibold text-black placeholder-[#a59f97] w-36"
            />
            <button
              onClick={() => queryClient.invalidateQueries()}
              className="p-2 rounded-xl bg-white border border-[#e8e5e1] hover:bg-[#f7f4f2] text-[#8c857b] hover:text-black transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Insight Cards (Step 12: AI Inferences) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {trends?.insights?.map((insight: string, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-4 bg-white border border-[#e8e5e1] rounded-2xl relative overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="absolute top-0 left-0 w-[4px] h-full bg-gradient-to-b from-[#61b5db] to-[#f472b6]" />
              <div className="pl-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#61b5db]" />
                  <span className="text-[9px] font-extrabold uppercase text-[#61b5db] tracking-wider font-display">
                    AI Auto-Insight
                  </span>
                </div>
                <p className="text-xs font-semibold text-black leading-relaxed">
                  {insight}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Executive Core Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Published Events', value: overview?.totalEvents, desc: 'Overall active listings', icon: Layers, color: '#61b5db' },
            { label: 'AI Extraction Confidence', value: `${overview?.avgConfidence}%`, desc: 'SLM validation baseline', icon: Compass, color: '#f472b6' },
            { label: 'Engagement Rate', value: `${overview?.notificationEngagement?.ratePercent}%`, desc: 'User open frequency', icon: Users, color: '#10b981' },
            { label: 'Average SLM Latency', value: `${telemetry?.latencies?.slmExtraction?.avg || 0} ms`, desc: 'qwen2.5:7b local inference', icon: Cpu, color: '#f59e0b' }
          ].map((card, idx) => (
            <div key={idx} className="bg-white border border-[#e8e5e1] rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-black/10 transition-all duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-[#8c857b] uppercase tracking-wider">{card.label}</span>
                <card.icon className="w-4 h-4 text-[#a59f97]" style={{ color: card.color }} />
              </div>
              <h2 className="text-3xl font-extrabold text-black tracking-tight mb-1">{card.value}</h2>
              <p className="text-[10px] text-[#a59f97] font-semibold">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Interactive View Tabs */}
        <div className="flex border-b border-[#e8e5e1] mb-6 gap-2 overflow-x-auto pb-1.5">
          {[
            { id: 'overview', label: 'Executive Metrics', icon: Layers },
            { id: 'research', label: 'Research Heatmap', icon: Compass },
            { id: 'clusters', label: 'Semantic Clusters', icon: Sparkles },
            { id: 'observability', label: 'AI Observability', icon: Activity }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-black text-white'
                  : 'text-[#8c857b] hover:text-black hover:bg-white border border-transparent hover:border-[#e8e5e1]'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Event Growth Chart */}
              <div className="bg-white border border-[#e8e5e1] rounded-2xl p-6 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">Event Volume Growth</h3>
                    <p className="text-[10px] text-[#a59f97] font-semibold">Weekly publishing frequencies</p>
                  </div>
                  <span className="text-[9px] font-bold text-[#61b5db] bg-[#61b5db]/5 border border-[#61b5db]/10 px-2 py-0.5 rounded-full">
                    Auto-Aggregated
                  </span>
                </div>
                
                {/* SVG Area Chart */}
                <div className="w-full overflow-hidden mt-6">
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
                    <defs>
                      <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#61b5db" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#61b5db" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Gridlines */}
                    <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#f0ede9" strokeWidth="1" />
                    <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#f0ede9" strokeWidth="1" strokeDasharray="3" />

                    {/* Area fill */}
                    {areaData && <path d={areaData} fill="url(#chart-area-grad)" />}
                    {/* Stroke line */}
                    {pathData && <path d={pathData} fill="none" stroke="#61b5db" strokeWidth="2" strokeLinecap="round" />}

                    {/* Points and labels */}
                    {points.map((p: any, idx: number) => (
                      <g key={idx}>
                        <circle cx={p.x} cy={p.y} r="3" fill="#61b5db" stroke="white" strokeWidth="1.5" />
                        <text x={p.x} y={p.y - 8} textAnchor="middle" className="text-[8px] font-bold fill-black">
                          {timeline[idx].count}
                        </text>
                        <text x={p.x} y={chartHeight - 2} textAnchor="middle" className="text-[7px] font-bold fill-[#a59f97]">
                          {timeline[idx].week}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              {/* Departmental Comparison Engine (Step 13) */}
              <div className="bg-white border border-[#e8e5e1] rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-extrabold text-black uppercase tracking-wider mb-2">Department Activity</h3>
                <p className="text-[10px] text-[#a59f97] font-semibold mb-4">Total published listings split</p>
                <div className="space-y-4">
                  {overview?.departmentsActivity?.slice(0, 5).map((dept: any, idx: number) => {
                    const total = Math.max(...overview.departmentsActivity.map((d: any) => d.count), 1);
                    const pct = Math.round((dept.count / total) * 100);
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-black">
                          <span>{dept.name}</span>
                          <span>{dept.count}</span>
                        </div>
                        <div className="w-full h-2 bg-[#f7f4f2] rounded-full overflow-hidden border border-[#e8e5e1]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.1 }}
                            className="h-full bg-gradient-to-r from-[#61b5db] to-[#f472b6] rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                  {(!overview?.departmentsActivity || overview.departmentsActivity.length === 0) && (
                    <p className="text-xs text-[#a59f97] italic py-4 text-center">No department activity logged yet</p>
                  )}
                </div>
              </div>

              {/* Data Exports (Step 14) */}
              <div className="bg-white border border-[#e8e5e1] rounded-2xl p-6 shadow-sm lg:col-span-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">Dean-Level Data Exports</h3>
                    <p className="text-[10px] text-[#a59f97] font-semibold">Download raw campus intelligence summaries for administrative compilation.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleDownloadCsv('overview')}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#e8e5e1] hover:bg-[#f7f4f2] text-xs font-semibold text-black rounded-xl transition-all shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-[#8c857b]" />
                      <span>Overview Summary CSV</span>
                    </button>
                    <button
                      onClick={() => handleDownloadCsv('departments')}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#e8e5e1] hover:bg-[#f7f4f2] text-xs font-semibold text-black rounded-xl transition-all shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-[#8c857b]" />
                      <span>Department Activity CSV</span>
                    </button>
                    <button
                      onClick={() => handleDownloadCsv('engagement')}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#e8e5e1] hover:bg-[#f7f4f2] text-xs font-semibold text-black rounded-xl transition-all shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-[#8c857b]" />
                      <span>Engagement Ranks CSV</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'research' && (
            <motion.div
              key="research"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white border border-[#e8e5e1] rounded-2xl p-6 shadow-sm"
            >
              <div className="mb-6">
                <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">Interdisciplinary Collaboration Matrix</h3>
                <p className="text-[10px] text-[#a59f97] font-semibold">Visualizing tag overlap and cross-departmental collaboration frequency based on semantic indices.</p>
              </div>

              {/* Heatmap Grid */}
              <div className="w-full overflow-x-auto">
                {research?.collaborationMatrix && research.collaborationMatrix.length > 0 ? (
                  <div className="min-w-[600px] grid grid-cols-6 gap-2 p-4 bg-[#f7f4f2] rounded-2xl border border-[#e8e5e1]">
                    {research.collaborationMatrix.map((item: any, idx: number) => {
                      // Normalize value for colors
                      const maxVal = Math.max(...research.collaborationMatrix.map((m: any) => m.value), 1);
                      const opacity = item.value > 0 ? 0.15 + (item.value / maxVal) * 0.85 : 0.05;
                      const hasCollab = item.value > 0;
                      return (
                        <div
                          key={idx}
                          className="flex flex-col items-center justify-center p-4 rounded-xl border border-black/5 aspect-video relative group transition-all"
                          style={{
                            backgroundColor: hasCollab ? `rgba(97, 181, 219, ${opacity})` : 'rgba(255, 255, 255, 0.4)',
                          }}
                        >
                          <span className="text-[8px] font-bold text-[#8c857b] uppercase truncate max-w-full">{item.source}</span>
                          <span className="text-xs font-extrabold text-black mt-1">{item.value}</span>
                          <span className="text-[8px] font-semibold text-[#a59f97] truncate max-w-full">to {item.target}</span>
                          
                          {/* Tooltip */}
                          <div className="absolute opacity-0 group-hover:opacity-100 bg-black text-white text-[9px] rounded-lg p-2 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 shadow-lg pointer-events-none transition-all z-20 whitespace-nowrap">
                            {item.source} ➔ {item.target}: {item.value} Collaborations
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <Compass className="w-8 h-8 text-[#e8e5e1] mx-auto mb-3" />
                    <p className="text-xs text-[#a59f97] italic">No departmental collaborations recorded yet this period</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'clusters' && (
            <motion.div
              key="clusters"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="bg-white border border-[#e8e5e1] rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">Semantic Event Clustering (pgvector)</h3>
                    <p className="text-[10px] text-[#a59f97] font-semibold">Dynamic K-Means grouping computed directly inside PostgreSQL based on cosine distance proximity.</p>
                  </div>
                  <button
                    onClick={() => clusterMutation.mutate()}
                    disabled={clusterMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-xs font-semibold rounded-xl shadow-md hover:bg-black/80 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${clusterMutation.isPending ? 'animate-spin' : ''}`} />
                    <span>{clusterMutation.isPending ? 'Clustering...' : 'Trigger Semantic Clustering'}</span>
                  </button>
                </div>

                {clusterMutation.isSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Dynamic clustering finished! Synced thematic groups inside pgvector index.</span>
                  </div>
                )}

                {/* Clusters Visual Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clusters?.map((cluster: any, idx: number) => (
                    <div key={idx} className="p-5 bg-[#f7f4f2] border border-[#e8e5e1] rounded-2xl shadow-sm hover:border-[#61b5db]/30 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-[#61b5db]/10 text-[#61b5db] border border-[#61b5db]/10 rounded-full tracking-wider">
                          {cluster.name}
                        </span>
                        <span className="text-xs font-bold text-black">{cluster.eventCount} Events</span>
                      </div>
                      <p className="text-xs text-[#8c857b] font-medium leading-relaxed mb-4">
                        {cluster.description}
                      </p>

                      <div className="space-y-2 border-t border-[#e8e5e1]/60 pt-4">
                        <span className="text-[9px] font-bold text-[#a59f97] uppercase block tracking-wider">Cluster Core Members:</span>
                        {cluster.members?.slice(0, 4).map((member: any, mIdx: number) => (
                          <div key={mIdx} className="flex items-center justify-between text-xs py-1.5 border-b border-[#e8e5e1]/40 last:border-0">
                            <span className="font-semibold text-black truncate max-w-[70%]">{member.event.title}</span>
                            <span className="text-[10px] font-bold text-[#61b5db] shrink-0 bg-white px-2 py-0.5 border border-[#e8e5e1] rounded-lg">
                              {member.similarityPercent}% Match
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {(!clusters || clusters.length === 0) && (
                    <div className="p-8 text-center border border-dashed border-[#e8e5e1] rounded-2xl col-span-2">
                      <Sparkles className="w-8 h-8 text-[#e8e5e1] mx-auto mb-3" />
                      <p className="text-xs text-[#a59f97] italic mb-2">No active semantic clusters computed yet.</p>
                      <p className="text-[10px] text-[#a59f97]">Click the trigger button above to initiate pgvector clustering.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'observability' && (
            <motion.div
              key="observability"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="bg-white border border-[#e8e5e1] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-extrabold text-black uppercase tracking-wider">AI Observability Telemetry</h3>
                    <p className="text-[10px] text-[#a59f97] font-semibold">Active processing metrics, SLM response delay, and BullMQ ingestion throughput.</p>
                  </div>
                  {telemetryFetching && (
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#61b5db] bg-[#61b5db]/5 border border-[#61b5db]/10 px-2.5 py-1 rounded-full animate-pulse">
                      <Activity className="w-3.5 h-3.5 animate-spin" />
                      <span>Live Telemetry Refresh Active</span>
                    </div>
                  )}
                </div>

                {/* Host Diagnostics / Observability Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* SLM extraction speed gauge */}
                  <div className="p-5 bg-[#f7f4f2] border border-[#e8e5e1] rounded-2xl flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-[#8c857b] uppercase tracking-wider mb-4">SLM Ingestion Delay</span>
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="48" fill="none" stroke="#e8e5e1" strokeWidth="6" />
                        <circle
                          cx="56"
                          cy="56"
                          r="48"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="6"
                          strokeDasharray="301.6"
                          strokeDashoffset={Math.max(0, 301.6 - (301.6 * Math.min(telemetry?.latencies?.slmExtraction?.avg || 0, 15000)) / 15000)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-sm font-extrabold text-black">
                          {((telemetry?.latencies?.slmExtraction?.avg || 0) / 1000).toFixed(2)}s
                        </span>
                        <span className="text-[8px] font-bold text-[#a59f97] uppercase">Avg Speed</span>
                      </div>
                    </div>
                  </div>

                  {/* Embedding Latency */}
                  <div className="p-5 bg-[#f7f4f2] border border-[#e8e5e1] rounded-2xl flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-[#8c857b] uppercase tracking-wider mb-4">Vector Generation</span>
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="48" fill="none" stroke="#e8e5e1" strokeWidth="6" />
                        <circle
                          cx="56"
                          cy="56"
                          r="48"
                          fill="none"
                          stroke="#61b5db"
                          strokeWidth="6"
                          strokeDasharray="301.6"
                          strokeDashoffset={Math.max(0, 301.6 - (301.6 * Math.min(telemetry?.latencies?.embeddingGeneration?.avg || 0, 3000)) / 3000)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-sm font-extrabold text-black">
                          {telemetry?.latencies?.embeddingGeneration?.avg || 0}ms
                        </span>
                        <span className="text-[8px] font-bold text-[#a59f97] uppercase">Nomic Embed</span>
                      </div>
                    </div>
                  </div>

                  {/* Host RAM usages */}
                  <div className="p-5 bg-[#f7f4f2] border border-[#e8e5e1] rounded-2xl flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-[#8c857b] uppercase tracking-wider mb-4">Host Host RAM</span>
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="48" fill="none" stroke="#e8e5e1" strokeWidth="6" />
                        <circle
                          cx="56"
                          cy="56"
                          r="48"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="6"
                          strokeDasharray="301.6"
                          strokeDashoffset={301.6 - (301.6 * (telemetry?.system?.memory?.percent || 0)) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-sm font-extrabold text-black">
                          {telemetry?.system?.memory?.percent}%
                        </span>
                        <span className="text-[8px] font-bold text-[#a59f97] uppercase">
                          {telemetry?.system?.memory?.usedGb} / {telemetry?.system?.memory?.totalGb} GB
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BullMQ Queues and CPU Telemetry */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Queue throughputs */}
                  <div className="p-5 bg-[#f7f4f2] border border-[#e8e5e1] rounded-2xl space-y-4">
                    <span className="text-[10px] font-bold text-[#8c857b] uppercase tracking-wider block mb-2">Ingestion Queue Loads</span>
                    {[
                      { name: 'Ollama Ingestion Pipeline', key: 'slm', color: 'bg-[#f59e0b]' },
                      { name: 'pgvector Embedding Generator', key: 'embedding', color: 'bg-[#61b5db]' },
                      { name: 'FCM Notification Dispatcher', key: 'notification', color: 'bg-[#10b981]' }
                    ].map((q, qIdx) => {
                      const qStats = telemetry?.queues?.[q.key] || { active: 0, total: 0, waiting: 0, failed: 0 };
                      const activePct = qStats.total > 0 ? (qStats.active / qStats.total) * 100 : 0;
                      return (
                        <div key={qIdx} className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-black">{q.name}</span>
                            <span className="text-[#8c857b] font-semibold">{qStats.active} Active / {qStats.waiting} Queue</span>
                          </div>
                          <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#e8e5e1]">
                            <div className={`h-full ${q.color} rounded-full`} style={{ width: `${Math.max(qStats.active > 0 ? 10 : 0, activePct)}%` }} />
                          </div>
                          <div className="flex justify-between text-[8px] font-bold text-[#a59f97] uppercase">
                            <span>Waiting: {qStats.waiting}</span>
                            <span className={qStats.failed > 0 ? 'text-red-500 font-extrabold' : ''}>Failed Jobs: {qStats.failed}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* CPU / Host information */}
                  <div className="p-5 bg-[#f7f4f2] border border-[#e8e5e1] rounded-2xl space-y-3">
                    <span className="text-[10px] font-bold text-[#8c857b] uppercase tracking-wider block mb-2">Host Diagnostics</span>
                    <div className="flex justify-between text-xs py-1.5 border-b border-[#e8e5e1]/60">
                      <span className="font-bold text-[#8c857b]">Host Processor</span>
                      <span className="font-semibold text-black max-w-[60%] truncate">{telemetry?.system?.cpu?.model}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1.5 border-b border-[#e8e5e1]/60">
                      <span className="font-bold text-[#8c857b]">CPU Load average</span>
                      <span className="font-semibold text-black">
                        {telemetry?.system?.cpu?.load1Min} (1m) / {telemetry?.system?.cpu?.load5Min} (5m)
                      </span>
                    </div>
                    <div className="flex justify-between text-xs py-1.5 border-b border-[#e8e5e1]/60">
                      <span className="font-bold text-[#8c857b]">Node process memory</span>
                      <span className="font-semibold text-black">{telemetry?.system?.process?.memoryHeapUsedMb} MB</span>
                    </div>
                    <div className="flex justify-between text-xs py-1.5">
                      <span className="font-bold text-[#8c857b]">System runtime uptime</span>
                      <span className="font-semibold text-black">{Math.floor((telemetry?.system?.process?.uptimeSeconds || 0) / 3600)} Hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
