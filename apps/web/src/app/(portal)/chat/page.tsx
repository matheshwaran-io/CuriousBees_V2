import { DashboardShell } from '@/components/shared/dashboard-shell';
import { MessageSquare } from 'lucide-react';

export default function SupervisorChatPage() {
  return (
    <DashboardShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <MessageSquare className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Chat & Collaboration</h1>
        <p className="text-gray-500 max-w-md">
          This feature is currently under development. Soon you'll be able to communicate and collaborate with other researchers directly.
        </p>
      </div>
    </DashboardShell>
  );
}
