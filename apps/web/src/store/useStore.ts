import { create } from 'zustand';
import { User, Thread, Comment, Opportunity, UserRole, Event, CollaborationRequest, Workspace, WorkspaceFile, WorkspaceMilestone, WorkspaceAnnouncement, AuditLog } from '@curiousbees/types';
import { auth } from '@/lib/firebase';
import { getDashboardRoute } from '@/lib/auth/route-protection';
import { ROLE_COOKIE_NAME } from '@curiousbees/constants';
import { apiFetch, getAuthHeaders, readApiError, API_URL, resetAuthPromise } from '@/lib/api-client';

const MOCK_INTERESTS = [
  'Generative AI & LLMs',
  'Quantum Computing',
  'Silicon Photonics',
  'Nanomaterials & Thin Films',
  'Cancer Immunotherapy',
  '5G/6G Wireless Networks',
  'VLSI System Design',
  'Bioinformatics'
];

interface AppState {
  // Session & Profiles
  currentUser: User | null;
  roleOverride: UserRole; // Syncs to current user role
  dashboardRoute: string; // Role-based landing route
  interestsList: string[];

  // UI states
  isLoading: boolean;
  showMobileSidebar: boolean;
  searchQuery: string;
  activeTag: string;
  theme: 'dark' | 'light';

  // Domain states
  threads: Thread[];
  opportunities: Opportunity[];
  events: Event[];

  collaborators: User[];
  pendingApprovals: User[];
  collaborationRequests: CollaborationRequest[];
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  adminUsers: User[];
  adminAuditLogs: AuditLog[];

  // Setters & Actions
  setCurrentUser: (user: User | null) => void;
  setDashboardRoute: (route: string) => void;
  setMobileSidebar: (show: boolean) => void;
  setSearchQuery: (query: string) => void;
  setActiveTag: (tag: string) => void;
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;

  // Live REST API Actions (Integrates Firebase Bearer JWT)
  syncUserSession: (options?: { throwOnError?: boolean }) => Promise<User | null>;
  fetchData: () => Promise<void>;
  fetchCollaborators: (search?: string, department?: string) => Promise<User[]>;
  createThread: (title: string, content: string, tags: string[]) => Promise<Thread>;
  addComment: (threadId: string, content: string) => Promise<Comment>;
  createOpportunity: (title: string, description: string, department: string, researchDomain: string) => Promise<Opportunity>;
  updateProfile: (data: { name: string; department: string; bio: string; role: UserRole; interests: string[] }) => Promise<User>;
  fetchEvents: (showIndicator?: boolean) => Promise<Event[]>;

  createEvent: (title: string, date: string, time: string, venue: string) => Promise<Event>;
  updateEvent: (id: string, title: string, date: string, time: string, venue: string) => Promise<Event>;
  deleteEvent: (id: string) => Promise<Event>;
  logout: () => void;

  // Supervisor Approvals & Requests
  fetchPendingApprovals: () => Promise<User[]>;
  approveScholar: (scholarId: string) => Promise<User>;
  declineScholar: (scholarId: string) => Promise<User>;
  requestSupervisor: (supervisorId: string) => Promise<User>;

  // Collaboration Requests
  fetchCollaborationRequests: () => Promise<CollaborationRequest[]>;
  createCollaborationRequest: (opportunityId: string, message?: string) => Promise<CollaborationRequest>;
  updateCollaborationRequest: (requestId: string, status: 'PUBLISHED' | 'REJECTED' | 'NEEDS_INFO') => Promise<CollaborationRequest>;

  // Workspaces
  fetchWorkspaces: () => Promise<Workspace[]>;
  fetchWorkspaceDetails: (workspaceId: string) => Promise<Workspace>;
  addWorkspaceFile: (workspaceId: string, name: string, url: string, size: number) => Promise<WorkspaceFile>;
  addWorkspaceMilestone: (workspaceId: string, title: string, description?: string, dueDate?: string) => Promise<WorkspaceMilestone>;
  toggleWorkspaceMilestone: (workspaceId: string, milestoneId: string, completed: boolean) => Promise<WorkspaceMilestone>;
  addWorkspaceAnnouncement: (workspaceId: string, title: string, content: string) => Promise<WorkspaceAnnouncement>;

  // Admin / Governance
  fetchAdminUsers: () => Promise<User[]>;
  fetchAdminAuditLogs: () => Promise<AuditLog[]>;
  changeUserRole: (userId: string, role: UserRole) => Promise<User>;
}

// Auth header helper — delegates to centralized api-client
const getBearerHeader = getAuthHeaders;

// ─── Cookie helpers (client-side only) ──────────────────────────────────────
const setCookie = (name: string, value: string, days = 7) => {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const deleteCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

export const useStore = create<AppState>((set, get) => ({
  currentUser: null, // Default to null for strict live login checking
  roleOverride: 'RESEARCH_SCHOLAR',
  dashboardRoute: '/dashboard',
  interestsList: MOCK_INTERESTS,

  isLoading: false,
  showMobileSidebar: false,
  searchQuery: '',
  activeTag: '',
  theme: 'light',

  threads: [],
  opportunities: [],
  events: [],

  collaborators: [],
  pendingApprovals: [],
  collaborationRequests: [],
  workspaces: [],
  activeWorkspace: null,
  adminUsers: [],
  adminAuditLogs: [],

  setCurrentUser: (user) => {
    if (user) {
      const route = getDashboardRoute(user);
      setCookie(ROLE_COOKIE_NAME, user.role);
      set({ currentUser: user, roleOverride: user.role, dashboardRoute: route });
    } else {
      deleteCookie(ROLE_COOKIE_NAME);
      set({ currentUser: null, roleOverride: 'RESEARCH_SCHOLAR', dashboardRoute: '/dashboard' });
    }
  },
  setDashboardRoute: (route) => set({ dashboardRoute: route }),
  setMobileSidebar: (show) => set({ showMobileSidebar: show }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveTag: (tag) => set({ activeTag: tag }),

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(nextTheme);
  },

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
      localStorage.setItem('curiousbees-theme', theme);
    }
    set({ theme });
  },

  // 1. Sync User session from Firebase auth token with the backend
  syncUserSession: async (options) => {
    set({ isLoading: true });
    try {
      const headers = await getBearerHeader();
      if (Object.keys(headers).length === 0) {
        deleteCookie(ROLE_COOKIE_NAME);
        set({ currentUser: null });
        if (options?.throwOnError) {
          throw new Error('No Firebase ID token is available. Complete Google sign-in before syncing with the backend.');
        }
        return null;
      }

      console.info('[Auth] Sending backend session sync request:', {
        endpoint: `${API_URL}/api/auth/me`,
        hasAuthorizationHeader: Boolean(headers.Authorization),
      });

      const res = await apiFetch('/api/auth/me');

      console.info('[Auth] Backend session sync response:', {
        status: res.status,
        ok: res.ok,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          const user: User = data.user;
          console.info('[Auth] Backend session sync success:', {
            id: user.id,
            email: user.email,
            role: user.role,
            approved: user.approved,
          });
          const route = getDashboardRoute(user);
          setCookie(ROLE_COOKIE_NAME, user.role);
          set({ currentUser: user, roleOverride: user.role, dashboardRoute: route });
          return user;
        }
        const errorMessage = 'Backend auth sync returned HTTP 200 without a user payload.';
        console.error('[Auth] Backend session sync failed:', errorMessage);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('curiousbees-mock-token');
        }
        deleteCookie(ROLE_COOKIE_NAME);
        set({ currentUser: null });
        if (options?.throwOnError) {
          throw new Error(errorMessage);
        }
        return null;
      }

      const apiMessage = await readApiError(res);
      const errorMessage = apiMessage
        ? `Backend auth sync failed (${res.status}): ${apiMessage}`
        : `Backend auth sync failed with HTTP ${res.status}.`;
      console.error('[Auth] Backend session sync failed:', errorMessage);

      if (typeof window !== 'undefined') {
        localStorage.removeItem('curiousbees-mock-token');
      }
      deleteCookie(ROLE_COOKIE_NAME);
      set({ currentUser: null });
      if (options?.throwOnError) {
        throw new Error(errorMessage);
      }
      return null;
    } catch (e: any) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('curiousbees-mock-token');
      }
      deleteCookie(ROLE_COOKIE_NAME);
      set({ currentUser: null });
      console.error('[Auth] Session sync exception:', e);
      if (options?.throwOnError) {
        throw e;
      }
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  // 2. Fetch live Threads and Opportunities concurrently
  fetchData: async () => {
    set({ isLoading: true });
    try {
      const [threadsRes, oppsRes] = await Promise.all([
        apiFetch('/api/threads'),
        apiFetch('/api/opportunities'),
      ]);

      if (threadsRes.ok && oppsRes.ok) {
        const threads = await threadsRes.json();
        const opportunities = await oppsRes.json();
        set({ threads, opportunities });
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  // 3. Query directory of co-authors / research experts from database
  fetchCollaborators: async (search, department) => {
    try {
      let query = '';
      if (search) query += `search=${encodeURIComponent(search)}&`;
      if (department) query += `department=${encodeURIComponent(department)}`;

      const res = await apiFetch(`/api/users/collaborators?${query}`);
      if (res.ok) {
        const data = await res.json();
        set({ collaborators: data });
        return data;
      }
      return [];
    } catch (e) {
      console.error('Failed to query expert directory:', e);
      return [];
    }
  },

  // 4. Create a new discussion thread
  createThread: async (title, content, tags) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, tags }),
      });
      if (res.ok) {
        const newThread = await res.json();
        set((state) => ({
          threads: [newThread, ...state.threads]
        }));
        return newThread;
      }
      throw new Error('Failed to publish thread.');
    } finally {
      set({ isLoading: false });
    }
  },

  // 5. Comment on an active thread
  addComment: async (threadId, content) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, content }),
      });
      if (res.ok) {
        const newComment = await res.json();
        set((state) => {
          const updatedThreads = state.threads.map((t) => {
            if (t.id === threadId) {
              return {
                ...t,
                comments: [...(t.comments || []), newComment]
              };
            }
            return t;
          });
          return { threads: updatedThreads };
        });
        return newComment;
      }
      throw new Error('Failed to publish comment.');
    } finally {
      set({ isLoading: false });
    }
  },

  // 6. Publish a research opportunity (Hiring/Collaboration)
  createOpportunity: async (title, description, department, researchDomain) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, department, researchDomain }),
      });
      if (res.ok) {
        const newOpp = await res.json();
        set((state) => ({
          opportunities: [newOpp, ...state.opportunities]
        }));
        return newOpp;
      }
      throw new Error('Failed to publish opportunity.');
    } finally {
      set({ isLoading: false });
    }
  },

  // 7. Update logged-in Profile metadata
  updateProfile: async (data) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updatedUser = await res.json();
        set({ currentUser: updatedUser, roleOverride: updatedUser.role });
        return updatedUser;
      }
      throw new Error('Failed to update profile.');
    } finally {
      set({ isLoading: false });
    }
  },

  // 8. Event Operations (Calendar view hooks)
  fetchEvents: async (showIndicator = false) => {
    if (showIndicator) set({ isLoading: true });
    try {
      const res = await apiFetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        set({ events: data });
        return data;
      }
      throw new Error();
    } catch (e) {
      return get().events;
    } finally {
      set({ isLoading: false });
    }
  },



  createEvent: async (title, date, time, venue) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, date, time, venue }),
      });
      if (res.ok) {
        const data = await res.json();
        set(state => ({ events: [...state.events, data] }));
        return data;
      }
      throw new Error();
    } finally {
      set({ isLoading: false });
    }
  },

  updateEvent: async (id, title, date, time, venue) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title, date, time, venue }),
      });
      if (res.ok) {
        const data = await res.json();
        set(state => ({
          events: state.events.map(ev => ev.id === id ? data : ev)
        }));
        return data;
      }
      throw new Error();
    } finally {
      set({ isLoading: false });
    }
  },

  deleteEvent: async (id) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch('/api/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        const data = await res.json();
        set(state => ({
          events: state.events.filter(ev => ev.id !== id)
        }));
        return data;
      }
      throw new Error();
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('curiousbees-mock-token');
    }
    deleteCookie(ROLE_COOKIE_NAME);
    // Reset the auth promise singleton so re-login initializes a fresh auth listener
    resetAuthPromise();
    import('@/lib/firebase').then(({ auth }) => {
      auth.signOut().catch(() => { });
    });
    set({ currentUser: null, dashboardRoute: '/dashboard', roleOverride: 'RESEARCH_SCHOLAR' });
  },

  fetchPendingApprovals: async () => {
    try {
      const res = await apiFetch('/api/users/approvals');
      if (res.ok) {
        const data = await res.json();
        set({ pendingApprovals: data });
        return data;
      }
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  approveScholar: async (scholarId: string) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch('/api/users/approve-scholar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scholarId }),
      });
      if (res.ok) {
        const data = await res.json();
        set(state => ({
          pendingApprovals: state.pendingApprovals.filter(s => s.id !== scholarId)
        }));
        return data;
      }
      throw new Error('Failed to approve scholar.');
    } finally {
      set({ isLoading: false });
    }
  },

  declineScholar: async (scholarId: string) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch('/api/users/decline-scholar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scholarId }),
      });
      if (res.ok) {
        const data = await res.json();
        set(state => ({
          pendingApprovals: state.pendingApprovals.filter(s => s.id !== scholarId)
        }));
        return data;
      }
      throw new Error('Failed to decline scholar.');
    } finally {
      set({ isLoading: false });
    }
  },

  requestSupervisor: async (supervisorId: string) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch('/api/users/request-supervisor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supervisorId }),
      });
      if (res.ok) {
        const data = await res.json();
        set(state => ({
          currentUser: {
            ...state.currentUser,
            supervisorId,
            approved: false
          } as any
        }));
        return data;
      }
      throw new Error('Failed to submit supervisor request.');
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCollaborationRequests: async () => {
    try {
      const res = await apiFetch('/api/opportunities/requests');
      if (res.ok) {
        const data = await res.json();
        set({ collaborationRequests: data });
        return data;
      }
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  createCollaborationRequest: async (opportunityId: string, message?: string) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch(`/api/opportunities/${opportunityId}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (res.ok) {
        const data = await res.json();
        set(state => ({
          collaborationRequests: [data, ...state.collaborationRequests]
        }));
        return data;
      }
      throw new Error('Failed to submit collaboration request.');
    } finally {
      set({ isLoading: false });
    }
  },

  updateCollaborationRequest: async (requestId: string, status: 'PUBLISHED' | 'REJECTED' | 'NEEDS_INFO') => {
    set({ isLoading: true });
    try {
      const res = await apiFetch(`/api/opportunities/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        set(state => ({
          collaborationRequests: state.collaborationRequests.map(r => r.id === requestId ? data : r)
        }));
        return data;
      }
      throw new Error('Failed to update collaboration request.');
    } finally {
      set({ isLoading: false });
    }
  },

  fetchWorkspaces: async () => {
    try {
      const res = await apiFetch('/api/workspaces');
      if (res.ok) {
        const data = await res.json();
        set({ workspaces: data });
        return data;
      }
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  fetchWorkspaceDetails: async (workspaceId: string) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch(`/api/workspaces/${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        set({ activeWorkspace: data });
        return data;
      }
      throw new Error('Failed to load workspace details.');
    } finally {
      set({ isLoading: false });
    }
  },

  addWorkspaceFile: async (workspaceId: string, name: string, url: string, size: number) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch(`/api/workspaces/${workspaceId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, size }),
      });
      if (res.ok) {
        const fileData = await res.json();
        set(state => {
          if (state.activeWorkspace && state.activeWorkspace.id === workspaceId) {
            return {
              activeWorkspace: {
                ...state.activeWorkspace,
                files: [fileData, ...(state.activeWorkspace.files || [])]
              }
            };
          }
          return {};
        });
        return fileData;
      }
      throw new Error('Failed to add file.');
    } finally {
      set({ isLoading: false });
    }
  },

  addWorkspaceMilestone: async (workspaceId: string, title: string, description?: string, dueDate?: string) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch(`/api/workspaces/${workspaceId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, dueDate }),
      });
      if (res.ok) {
        const milestoneData = await res.json();
        set(state => {
          if (state.activeWorkspace && state.activeWorkspace.id === workspaceId) {
            return {
              activeWorkspace: {
                ...state.activeWorkspace,
                milestones: [...(state.activeWorkspace.milestones || []), milestoneData]
              }
            };
          }
          return {};
        });
        return milestoneData;
      }
      throw new Error('Failed to add milestone.');
    } finally {
      set({ isLoading: false });
    }
  },

  toggleWorkspaceMilestone: async (workspaceId: string, milestoneId: string, completed: boolean) => {
    try {
      const res = await apiFetch(`/api/workspaces/${workspaceId}/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      if (res.ok) {
        const milestoneData = await res.json();
        set(state => {
          if (state.activeWorkspace && state.activeWorkspace.id === workspaceId) {
            return {
              activeWorkspace: {
                ...state.activeWorkspace,
                milestones: (state.activeWorkspace.milestones || []).map(m => m.id === milestoneId ? milestoneData : m)
              }
            };
          }
          return {};
        });
        return milestoneData;
      }
      throw new Error('Failed to toggle milestone.');
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  addWorkspaceAnnouncement: async (workspaceId: string, title: string, content: string) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch(`/api/workspaces/${workspaceId}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      if (res.ok) {
        const announcementData = await res.json();
        set(state => {
          if (state.activeWorkspace && state.activeWorkspace.id === workspaceId) {
            return {
              activeWorkspace: {
                ...state.activeWorkspace,
                announcements: [announcementData, ...(state.activeWorkspace.announcements || [])]
              }
            };
          }
          return {};
        });
        return announcementData;
      }
      throw new Error('Failed to post announcement.');
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAdminUsers: async () => {
    try {
      const res = await apiFetch('/api/users/all');
      if (res.ok) {
        const data = await res.json();
        set({ adminUsers: data });
        return data;
      }
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  fetchAdminAuditLogs: async () => {
    try {
      const res = await apiFetch('/api/users/audit-logs');
      if (res.ok) {
        const data = await res.json();
        set({ adminAuditLogs: data });
        return data;
      }
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  changeUserRole: async (userId: string, role: UserRole) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        const data = await res.json();
        set(state => ({
          adminUsers: state.adminUsers.map(u => u.id === userId ? data : u)
        }));
        return data;
      }
      throw new Error('Failed to update user role.');
    } finally {
      set({ isLoading: false });
    }
  }
}));
