'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  Plus, 
  MessageSquare, 
  Cpu, 
  Activity, 
  Compass, 
  AlertTriangle,
  Loader2,
  Calendar,
  MapPin,
  ExternalLink,
  Info,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { apiFetch } from '@/lib/api-client';

async function fetchSessions() {
  const res = await apiFetch('/api/copilot/sessions');
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}

async function createNewSession(title?: string) {
  const res = await apiFetch('/api/copilot/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: title || 'Ask CuriousBees Conversation' }),
  });
  if (!res.ok) throw new Error('Failed to create session');
  return res.json();
}

async function fetchSessionHistory(sessionId: string) {
  if (!sessionId) return { messages: [] };
  const res = await apiFetch(`/api/copilot/sessions/${sessionId}`);
  if (!res.ok) throw new Error('Failed to fetch session history');
  return res.json();
}

export default function CopilotPage() {
  const queryClient = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState('');
  
  // Streaming states
  const [streamingContent, setStreamingContent] = useState('');
  const [activeCitations, setActiveCitations] = useState<any[]>([]);
  const [activeTelemetry, setActiveTelemetry] = useState<any | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch list of sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['copilot-sessions'],
    queryFn: fetchSessions,
  });

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: createNewSession,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['copilot-sessions'] });
      setActiveSessionId(data.session.id);
      setStreamingContent('');
      setActiveCitations([]);
      setActiveTelemetry(null);
    },
  });

  // Fetch past messages for selected session
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['copilot-history', activeSessionId],
    queryFn: () => fetchSessionHistory(activeSessionId!),
    enabled: !!activeSessionId,
  });

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [historyData?.messages, streamingContent, isStreaming]);

  // Set first session as active if none selected
  useEffect(() => {
    if (sessionsData?.sessions?.length > 0 && !activeSessionId) {
      setActiveSessionId(sessionsData.sessions[0].id);
    }
  }, [sessionsData, activeSessionId]);

  // Handle SSE manually using standard fetch-ReadableStream adapter (supports authorization perfectly!)
  const handleSendQuery = async (overrideQuery?: string) => {
    const textToSend = overrideQuery || queryInput;
    if (!textToSend.trim() || isStreaming) return;

    let targetSessionId = activeSessionId;

    // Create session first if none is active
    if (!targetSessionId) {
      try {
        const sessionData = await createSessionMutation.mutateAsync('Ask CuriousBees session');
        targetSessionId = sessionData.session.id;
      } catch (err) {
        setStreamError('Failed to initialize a chat session.');
        return;
      }
    }

    setQueryInput('');
    setStreamingContent('');
    setActiveCitations([]);
    setActiveTelemetry(null);
    setStreamError(null);
    setIsStreaming(true);

    try {
      // Trigger temporary optimistic add in query history cache if possible
      // But queryClient invalidation on complete is easier and cleaner
      const response = await apiFetch(
        `/api/copilot/chat?sessionId=${targetSessionId}&message=${encodeURIComponent(textToSend)}`
      );

      if (!response.ok) throw new Error('Generation pipeline failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Readable stream not supported');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        // Standard SSE separator is double newline
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() || ''; // Keep partial line in buffer

        for (const chunk of chunks) {
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const dataStr = line.substring(6).trim();
            if (!dataStr) continue;

            try {
              const payload = JSON.parse(dataStr);
              if (payload.type === 'token' && payload.text) {
                setStreamingContent(prev => prev + payload.text);
              } else if (payload.type === 'citations' && payload.citations) {
                setActiveCitations(payload.citations);
              } else if (payload.type === 'telemetry' && payload.telemetry) {
                setActiveTelemetry(payload.telemetry);
              } else if (payload.type === 'error' && payload.error) {
                setStreamError(payload.error);
              }
            } catch (err) {
              // Ignore partial parse failures
            }
          }
        }
      }

    } catch (err: any) {
      setStreamError(err.message || 'Stream connection error');
    } finally {
      setIsStreaming(false);
      queryClient.invalidateQueries({ queryKey: ['copilot-history', targetSessionId] });
      queryClient.invalidateQueries({ queryKey: ['copilot-sessions'] });
    }
  };

  const suggestedQueries = [
    'What workshops are happening this week?',
    'Trending research domains in SRMIST',
    'Upcoming PhD defense presentations',
    'Which engineering department is most active?',
    'Show interdisciplinary research clusters'
  ];

  return (
    <div className="min-h-screen bg-[#f5f3f1] flex">
      
      {/* Session panel Sidebar */}
      <aside className="w-64 bg-white border-r border-[#e8e5e1] flex flex-col shrink-0 select-none hidden md:flex">
        <div className="p-4 border-b border-[#e8e5e1]">
          <button
            onClick={() => createSessionMutation.mutate(undefined)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-black hover:bg-black/85 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat Session</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          <span className="text-[9px] font-extrabold text-[#a59f97] uppercase px-3 block tracking-widest mb-2">
            History Conversations
          </span>
          {sessionsLoading ? (
            <div className="py-6 text-center text-[#a59f97] flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#61b5db]" />
              <span className="text-xs">Loading sessions...</span>
            </div>
          ) : (
            sessionsData?.sessions?.map((session: any) => {
              const isActive = session.id === activeSessionId;
              const dateStr = new Date(session.updatedAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric'
              });
              return (
                <button
                  key={session.id}
                  onClick={() => {
                    setActiveSessionId(session.id);
                    setStreamingContent('');
                    setActiveCitations([]);
                    setActiveTelemetry(null);
                    setStreamError(null);
                  }}
                  className={`w-full flex items-start gap-2.5 p-3 rounded-xl text-left text-xs transition-all ${
                    isActive 
                      ? 'bg-black/5 text-black font-semibold border-l-[3px] border-black rounded-l-none'
                      : 'text-[#8c857b] hover:text-black hover:bg-[#f7f4f2]'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 mt-0.5 shrink-0 text-[#a59f97]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate leading-tight">{session.title || 'Conversation'}</p>
                    <span className="text-[9px] font-bold text-[#a59f97] block mt-1">{dateStr}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Main chat window */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f5f3f1] relative">
        
        {/* Chat top header */}
        <header className="h-[60px] bg-white border-b border-[#e8e5e1] px-6 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center text-white font-extrabold text-xs">
              RC
            </div>
            <div>
              <span className="text-xs font-bold text-black block leading-none">Ask CuriousBees AI</span>
              <span className="text-[9px] font-bold text-[#10b981] flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                <span>Qwen2.5 Local RAG Active</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-[#8c857b] border border-[#e8e5e1] bg-[#f7f4f2] px-2 py-0.5 rounded-md uppercase">
              RAG Engine v1.0
            </span>
          </div>
        </header>

        {/* Message logs area */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-6 py-8 space-y-6"
        >
          {/* History Messages */}
          {historyData?.messages?.map((msg: any) => {
            const isUser = msg.role === 'USER';
            const citations = msg.citations || [];
            return (
              <div 
                key={msg.id}
                className={`flex gap-4 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar Icon */}
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold border ${
                  isUser 
                    ? 'bg-gradient-to-tr from-amber-500 to-rose-400 text-white border-white/10' 
                    : 'bg-black text-white border-[#e8e5e1]'
                }`}>
                  {isUser ? 'U' : 'AI'}
                </div>

                <div className="space-y-3 min-w-0 flex-1">
                  <div className={`p-4 border rounded-2xl shadow-sm text-xs leading-relaxed ${
                    isUser 
                      ? 'bg-black text-white border-black/10' 
                      : 'bg-white text-black border-[#e8e5e1]'
                  }`}>
                    {/* Markdown rendering simulation (keeps styling clean and lightweight) */}
                    <div className="whitespace-pre-line prose max-w-none text-left">
                      {msg.content}
                    </div>
                  </div>

                  {/* Citations block for saved assistant messages */}
                  {!isUser && citations.length > 0 && (
                    <div className="space-y-1.5 pl-2">
                      <span className="text-[9px] font-extrabold text-[#a59f97] uppercase tracking-wider block">
                        Retrieved Campus References ({citations.length}):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {citations.slice(0, 4).map((cit: any, cIdx: number) => (
                          <div key={cIdx} className="bg-white border border-[#e8e5e1] p-3 rounded-xl hover:border-[#61b5db]/30 transition-all flex flex-col text-left">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[10px] font-bold text-black truncate max-w-[70%]">{cit.title}</span>
                              <span className="text-[9px] font-bold text-[#61b5db] bg-[#61b5db]/5 border border-[#61b5db]/10 px-1.5 py-0.2 rounded-md shrink-0">
                                {Math.round(cit.score * 100 || 85)}% Match
                              </span>
                            </div>
                            <span className="text-[8px] font-bold text-[#8c857b] uppercase mt-0.5 truncate">{cit.department || 'General'}</span>
                            <div className="flex items-center gap-1.5 text-[8px] text-[#a59f97] mt-1.5">
                              <Calendar className="w-2.5 h-2.5" />
                              <span>{new Date(cit.date).toLocaleDateString()} at {cit.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Telemetry observer */}
                  {!isUser && msg.telemetry && (
                    <div className="flex items-center gap-3 text-[9px] font-bold text-[#a59f97] pl-2 select-none uppercase">
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3 h-3" />
                        <span>Inference: {msg.telemetry.generationLatencyMs || 0}ms</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        <span>Retrieval: {msg.telemetry.retrievalLatencyMs || 0}ms</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        <span>Context: {msg.telemetry.contextSizeWords || 0} words</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Active Streaming Message */}
          {isStreaming && (
            <div className="flex gap-4 max-w-3xl">
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold bg-black text-white border border-[#e8e5e1] animate-pulse">
                AI
              </div>

              <div className="space-y-3 min-w-0 flex-1">
                <div className="p-4 bg-white text-black border border-[#e8e5e1] rounded-2xl shadow-sm text-xs leading-relaxed text-left">
                  <div className="whitespace-pre-line prose max-w-none">
                    {streamingContent || (
                      <span className="flex items-center gap-1.5 text-[#a59f97]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#61b5db]" />
                        <span>RAG pipeline assembling context...</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress citations list */}
                {activeCitations.length > 0 && (
                  <div className="space-y-1.5 pl-2">
                    <span className="text-[9px] font-extrabold text-[#a59f97] uppercase tracking-wider block">
                      Retrieved Campus References ({activeCitations.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeCitations.slice(0, 4).map((cit: any, cIdx: number) => (
                        <div key={cIdx} className="bg-white border border-[#e8e5e1] p-3 rounded-xl hover:border-[#61b5db]/30 transition-all flex flex-col text-left">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-bold text-black truncate max-w-[70%]">{cit.title}</span>
                            <span className="text-[9px] font-bold text-[#61b5db] bg-[#61b5db]/5 border border-[#61b5db]/10 px-1.5 py-0.2 rounded-md shrink-0">
                              {Math.round(cit.score * 100 || 85)}% Match
                            </span>
                          </div>
                          <span className="text-[8px] font-bold text-[#8c857b] uppercase mt-0.5 truncate">{cit.department || 'General'}</span>
                          <div className="flex items-center gap-1.5 text-[8px] text-[#a59f97] mt-1.5">
                            <Calendar className="w-2.5 h-2.5" />
                            <span>{new Date(cit.date).toLocaleDateString()} at {cit.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error notifications */}
          {streamError && (
            <div className="max-w-3xl mx-auto p-4 bg-red-50 border border-red-100 text-red-700 text-xs rounded-2xl flex items-center gap-2 text-left">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <div>
                <span className="font-bold block mb-0.5">Copilot Pipeline Alert</span>
                <span className="font-medium text-[11px] leading-relaxed">{streamError}</span>
              </div>
            </div>
          )}

          {/* Empty Conversation Welcome block */}
          {(!historyData?.messages || historyData.messages.length === 0) && !isStreaming && (
            <div className="max-w-xl mx-auto py-12 text-center select-none">
              <Sparkles className="w-10 h-10 text-[#61b5db] mx-auto mb-4 animate-pulse" />
              <h2 className="text-xl font-extrabold text-black tracking-tight mb-2">
                Ask CuriousBees AI Copilot
              </h2>
              <p className="text-xs text-[#a59f97] font-semibold leading-relaxed mb-6">
                Query structured event metadata, department activity growth rates, semantic pgvector clusters, or host CPU telemetry using natural language.
              </p>

              <div className="grid grid-cols-1 gap-2.5 text-left">
                {suggestedQueries.map((q, qIdx) => (
                  <button
                    key={qIdx}
                    onClick={() => handleSendQuery(q)}
                    className="flex items-center justify-between p-3.5 bg-white border border-[#e8e5e1] hover:border-black/15 text-xs text-[#8c857b] hover:text-black font-semibold rounded-2xl transition-all shadow-sm"
                  >
                    <span>"{q}"</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#a59f97]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input box area */}
        <div className="p-4 border-t border-[#e8e5e1] bg-white shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-center bg-[#f7f4f2] border border-[#e8e5e1] rounded-2xl shadow-sm focus-within:border-black/30 focus-within:shadow-md transition-all duration-200">
              <input
                id="copilot-query-input"
                type="text"
                value={queryInput}
                onChange={e => setQueryInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendQuery()}
                placeholder="Ask CuriousBees about events, trends, clusters or statistics..."
                disabled={isStreaming}
                className="flex-1 py-3.5 pl-4 pr-12 text-xs text-black placeholder-[#a59f97] bg-transparent outline-none disabled:opacity-50"
              />
              <button
                onClick={() => handleSendQuery()}
                disabled={!queryInput.trim() || isStreaming}
                className="absolute right-2 p-2 bg-black hover:bg-black/85 text-white rounded-xl shadow-md transition-all disabled:opacity-30 disabled:hover:bg-black cursor-pointer"
              >
                {isStreaming ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            
            {/* Context limitation warnings */}
            <div className="flex items-center justify-center gap-1.5 text-[8px] font-bold text-[#a59f97] uppercase mt-2 select-none">
              <Info className="w-3 h-3" />
              <span>Grounded Context. Answers are generated locally and fully cited.</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
