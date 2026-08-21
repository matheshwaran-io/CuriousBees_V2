export default function PortalLoading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 rounded-full border-3 border-[#0C4DA2] dark:border-[#3B82F6] border-t-transparent animate-spin" />
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[#718096]">Loading workspace...</p>
    </div>
  );
}
