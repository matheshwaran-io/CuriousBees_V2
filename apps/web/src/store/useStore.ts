import { create } from 'zustand';
import { User, Thread, Comment, Opportunity, UserRole, Event, CollaborationRequest, Workspace, WorkspaceFile, WorkspaceMilestone, WorkspaceAnnouncement, AuditLog, Publication, Report, Department, Notification } from '@curiousbees/types';
// Clerk is used for authentication
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
  notProvisioned: boolean;
  isSuspended: boolean;

  // UI states
  isLoading: boolean;
  showMobileSidebar: boolean;
  searchQuery: string;
  activeTag: string;
  theme: 'dark' | 'light';

  // Domain states
  threads: Thread[];
  feedCounts: Record<string, number>;
  opportunities: Opportunity[];
  events: Event[];

  pendingApprovals: User[];
  pendingSupervisors: User[];
  collaborationRequests: CollaborationRequest[];
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  adminUsers: User[];
  adminAuditLogs: AuditLog[];
  collaborators: User[];

  publications: Publication[];
  reports: Report[];
  departments: Department[];
  supervisors: User[];
  myScholars: User[];
  notifications: Notification[];
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[];

  // Setters & Actions
  setCurrentUser: (user: User | null) => void;
  setDashboardRoute: (route: string) => void;
  setMobileSidebar: (show: boolean) => void;
  setSearchQuery: (query: string) => void;
  setActiveTag: (tag: string) => void;
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;

  // Live REST API Actions (Integrates Clerk Bearer JWT)
  syncUserSession: (options?: { throwOnError?: boolean; force?: boolean }) => Promise<User | null>;
  fetchData: (skipThreads?: boolean) => Promise<void>;
  fetchFeedThreads: (search?: string, type?: string, sort?: 'latest' | 'top') => Promise<void>;
  fetchFeedCounts: (search?: string) => Promise<void>;
  fetchCollaborators: (search?: string, department?: string) => Promise<User[]>;
  createThread: (title: string, content: string, tags: string[], options?: { type?: any; isPaper?: boolean; paperJournal?: string | null; attachments?: any[] }) => Promise<Thread>;
  addComment: (threadId: string, content: string, parentId?: string) => Promise<Comment>;
  toggleLikeThread: (threadId: string) => Promise<{ liked: boolean }>;
  toggleSaveThread: (threadId: string) => Promise<{ saved: boolean }>;
  shareThread: (threadId: string, platform?: string) => Promise<void>;
  reportThread: (threadId: string, reason: string, description?: string) => Promise<void>;
  requestThreadCollaboration: (threadId: string, message?: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  updateThread: (threadId: string, data: Partial<{ title: string; content: string; tags: string[]; type: any; isPaper: boolean }>) => Promise<Thread>;
  getSavedThreads: () => Promise<Thread[]>;
  deleteThreadLocally: (threadId: string) => void;
  updateThreadLocally: (threadId: string, data: Thread) => void;
  toggleSaveThreadLocally: (threadId: string, saved: boolean, userId: string) => void;
  
  fetchTrendingResearch: () => Promise<Array<{tag: string, count: number}>>;
  fetchSuggestedPeers: () => Promise<any[]>;
  connectWithPeer: (peerId: string) => Promise<'connect' | 'pending' | 'connected' | null>;
  searchFeed: (query: string) => Promise<{ threads: Thread[], publications: Publication[], users: User[] }>;
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

  // Admin Supervisor Approvals
  fetchPendingSupervisors: () => Promise<User[]>;
  approveSupervisor: (supervisorId: string) => Promise<User>;
  declineSupervisor: (supervisorId: string) => Promise<User>;

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

  // Admin User CRUD & Import Actions
  createAdminUser: (data: { name: string; email: string; role: UserRole; departmentId?: string; supervisorId?: string }) => Promise<User>;
  updateAdminUser: (id: string, data: { name?: string; email?: string; role?: UserRole; status?: string; departmentId?: string; supervisorId?: string }) => Promise<User>;
  deleteAdminUser: (id: string) => Promise<void>;
  importAdminUsers: (formData: FormData) => Promise<any>;

  // Supervisor Actions (New flow)
  fetchPendingScholars: () => Promise<User[]>;
  supervisorApproveScholar: (scholarId: string) => Promise<User>;
  supervisorRejectScholar: (scholarId: string) => Promise<User>;

  // Publications
  fetchPublications: (userId?: string) => Promise<Publication[]>;
  createPublication: (data: { title: string; authors: string; doi?: string; publisher?: string; year: number; status: string }) => Promise<Publication>;
  updatePublication: (id: string, data: { title?: string; authors?: string; doi?: string; publisher?: string; year?: number; status?: string }) => Promise<Publication>;
  deletePublication: (id: string) => Promise<void>;

  // Reports
  fetchReports: () => Promise<Report[]>;
  submitReport: (data: { title: string; description?: string; evidenceUrl?: string; supervisorId: string }) => Promise<Report>;
  reviewReport: (id: string, status: string, feedback?: string) => Promise<Report>;

  // Notifications
  fetchNotifications: () => Promise<Notification[]>;

  // Departments
  fetchDepartments: () => Promise<Department[]>;
  createDepartment: (data: { name: string; code: string; facultyId: string; description?: string }) => Promise<Department>;
  updateDepartment: (id: string, data: { name?: string; code?: string; facultyId?: string; description?: string }) => Promise<Department>;
  deleteDepartment: (id: string) => Promise<void>;

  // Role details / Supervisors / Scholars
  fetchSupervisors: () => Promise<User[]>;
  fetchMyScholars: () => Promise<User[]>;
  suspendUserToggle: (userId: string, suspended: boolean) => Promise<User>;

  // Toasts
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
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

let activeSyncPromise: Promise<User | null> | null = null;

export const useStore = create<AppState>((set, get) => ({
  currentUser: null, // Default to null for strict live login checking
  roleOverride: 'RESEARCH_SCHOLAR',
  dashboardRoute: '/dashboard',
  interestsList: MOCK_INTERESTS,
  notProvisioned: false,
  isSuspended: false,

  isLoading: false,
  showMobileSidebar: false,
  searchQuery: '',
  activeTag: '',
  theme: 'light',

  threads: [],
  feedCounts: { ALL: 0 },
  opportunities: [],
  events: [],

  collaborators: [],
  pendingApprovals: [],
  pendingSupervisors: [],
  collaborationRequests: [],
  workspaces: [],
  activeWorkspace: null,
  adminUsers: [],
  adminAuditLogs: [],

  publications: [],
  reports: [],
  departments: [],
  supervisors: [],
  myScholars: [],
  notifications: [],
  toasts: [],

  setCurrentUser: (user) => {
    if (user) {
      const route = getDashboardRoute(user);
      setCookie(ROLE_COOKIE_NAME, user.role);
      set({ currentUser: user, roleOverride: user.role, dashboardRoute: route, notProvisioned: false, isSuspended: false });
    } else {
      deleteCookie(ROLE_COOKIE_NAME);
      set({ currentUser: null, roleOverride: 'RESEARCH_SCHOLAR', dashboardRoute: '/dashboard', notProvisioned: false, isSuspended: false });
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

  syncUserSession: async (options) => {
    console.info('[AuthStore] syncUserSession called with options:', options);

    // 1. Check if currentUser is already cached in Zustand (and bypass if force is true)
    if (!options?.force) {
      const cachedUser = get().currentUser;
      if (cachedUser) {
        console.info('[AuthStore] Returning cached user from Zustand:', cachedUser.email);
        return cachedUser;
      }
    }

    // 2. Check if a synchronization is already in progress
    if (activeSyncPromise) {
      console.info('[AuthStore] Reusing in-flight syncUserSession promise.');
      return activeSyncPromise;
    }

    // 3. Initiate synchronization and cache the promise
    activeSyncPromise = (async () => {
      set({ isLoading: true });
      try {
        console.info('[AuthStore] Starting auth headers check...');
        const headers = await getBearerHeader();
        if (Object.keys(headers).length === 0) {
          console.warn('[AuthStore] No auth headers returned, clearing session.');
          deleteCookie(ROLE_COOKIE_NAME);
          set({ currentUser: null });
          if (options?.throwOnError) {
            throw new Error('No Auth ID token is available. Complete sign-in before syncing with the backend.');
          }
          return null;
        }

        console.info('[AuthStore] Sending backend session sync request...');
        const res = await apiFetch('/api/auth/me');

        console.info('[AuthStore] Backend session sync response:', {
          status: res.status,
          ok: res.ok,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.access === false) {
            if (data.reason === 'USER_NOT_PROVISIONED') {
              console.warn('[AuthStore] User not provisioned, setting notProvisioned flag.');
              deleteCookie(ROLE_COOKIE_NAME);
              set({ currentUser: null, notProvisioned: true });
              return null;
            }
            if (data.reason === 'USER_SUSPENDED') {
              console.warn('[AuthStore] User suspended, setting isSuspended flag.');
              deleteCookie(ROLE_COOKIE_NAME);
              set({ currentUser: null, isSuspended: true });
              return null;
            }
          }
          if (data.success && data.user) {
            const user: User = data.user;
            console.info('[AuthStore] Session sync success:', {
              id: user.id,
              email: user.email,
              role: user.role,
              approved: user.approved,
            });
            const route = getDashboardRoute(user);
            setCookie(ROLE_COOKIE_NAME, user.role);
            set({ currentUser: user, roleOverride: user.role, dashboardRoute: route, notProvisioned: false, isSuspended: false });
            return user;
          }
          const errorMessage = 'Backend auth sync returned HTTP 200 without a user payload.';
          console.error('[AuthStore] Error:', errorMessage);
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
        console.error('[AuthStore] Error:', errorMessage);

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
        console.error('[AuthStore] Exception during session sync:', e);
        if (options?.throwOnError) {
          throw e;
        }
        return null;
      } finally {
        set({ isLoading: false });
        activeSyncPromise = null; // Clear promise cache when done
        console.info('[AuthStore] syncUserSession complete, cleared promise cache.');
      }
    })();

    return activeSyncPromise;
  },

  // 2. Fetch live Threads and Opportunities concurrently
  fetchData: async (skipThreads?: boolean) => {
    set({ isLoading: true });
    try {
      const promises = [apiFetch('/api/opportunities')];
      if (!skipThreads) {
        promises.push(apiFetch('/api/threads'));
      }

      const results = await Promise.all(promises);
      const oppsRes = results[0];
      const threadsRes = !skipThreads ? results[1] : null;

      if (oppsRes.ok) {
        const opportunities = await oppsRes.json();
        set({ opportunities });
      }

      if (threadsRes && threadsRes.ok) {
        const threads = await threadsRes.json();
        set({ threads });
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchFeedThreads: async (search?: string, type?: string, sort?: 'latest' | 'top') => {
    set({ isLoading: true });
    try {
      if (type === 'SAVED') {
        const res = await apiFetch('/api/threads/saved');
        if (res.ok) {
          const threads = await res.json();
          set({ threads });
        } else {
          const err = await readApiError(res);
          get().addToast(`Failed to load saved posts: ${err}`, 'error');
        }
        return;
      }

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (type && type !== 'ALL') params.append('type', type);
      if (sort) params.append('sort', sort);
      const res = await apiFetch(`/api/threads?${params.toString()}`);
      if (res.ok) {
        const threads = await res.json();
        set({ threads });
      } else {
        const err = await readApiError(res);
        get().addToast(`Failed to load feed: ${err}`, 'error');
      }
    } catch (e: any) {
      console.error('Failed to load feed threads:', e);
      get().addToast(`Network error: ${e.message}`, 'error');
    } finally {
      set({ isLoading: false });
    }
  },

  fetchFeedCounts: async (search?: string) => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const res = await apiFetch(`/api/threads/counts?${params.toString()}`);
      if (res.ok) {
        const feedCounts = await res.json();
        set({ feedCounts });
      }
    } catch (e) {
      console.error('Failed to load feed counts:', e);
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
  createThread: async (title, content, tags, options) => {
    set({ isLoading: true });
    try {
      const payload = { title, content, tags, ...options };
      const res = await apiFetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newThread = await res.json();
        set((state) => ({
          threads: [newThread, ...state.threads]
        }));
        return newThread;
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to publish thread.');
    } finally {
      set({ isLoading: false });
    }
  },

  // 5. Comment on an active thread
  addComment: async (threadId, content, parentId) => {
    set({ isLoading: true });
    try {
      const payload = { threadId, content, parentId };
      const res = await apiFetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newComment = await res.json();
        set(state => ({
          threads: state.threads.map(t => {
            if (t.id === threadId) {
              return {
                ...t,
                comments: [...(t.comments || []), newComment]
              };
            }
            return t;
          })
        }));
        return newComment;
      }
      throw new Error('Failed to publish comment.');
    } finally {
      set({ isLoading: false });
    }
  },

  toggleLikeThread: async (threadId) => {
    const res = await apiFetch(`/api/threads/${threadId}/like`, { method: 'POST' });
    if (res.ok) return await res.json();
    throw new Error('Failed to like thread');
  },

  toggleSaveThread: async (threadId) => {
    const res = await apiFetch(`/api/threads/${threadId}/save`, { method: 'POST' });
    if (res.ok) return await res.json();
    throw new Error('Failed to save thread');
  },

  shareThread: async (threadId, platform) => {
    const res = await apiFetch(`/api/threads/${threadId}/share`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform })
    });
    if (!res.ok) throw new Error('Failed to share thread');
  },

  reportThread: async (threadId, reason, description) => {
    const res = await apiFetch(`/api/threads/${threadId}/report`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, description })
    });
    if (!res.ok) throw new Error('Failed to report thread');
  },

  requestThreadCollaboration: async (threadId, message) => {
    const res = await apiFetch(`/api/threads/${threadId}/collaborate`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (!res.ok) throw new Error('Failed to request collaboration');
  },

  deleteThread: async (threadId) => {
    const res = await apiFetch(`/api/threads/${threadId}`, { method: 'DELETE' });
    if (res.ok) {
      set(state => ({ threads: state.threads.filter(t => t.id !== threadId) }));
    } else {
      throw new Error('Failed to delete thread');
    }
  },

  updateThread: async (threadId, data) => {
    const res = await apiFetch(`/api/threads/${threadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const updatedThread = await res.json();
      set(state => ({
        threads: state.threads.map(t => t.id === threadId ? updatedThread : t)
      }));
      return updatedThread;
    }
    throw new Error('Failed to update thread');
  },

  getSavedThreads: async () => {
    const res = await apiFetch('/api/threads/saved');
    if (res.ok) return await res.json();
    return [];
  },

  deleteThreadLocally: (threadId: string) => {
    set(state => ({ threads: state.threads.filter(t => t.id !== threadId) }));
  },

  updateThreadLocally: (threadId: string, data: Thread) => {
    set(state => ({ threads: state.threads.map(t => t.id === threadId ? data : t) }));
  },

  toggleSaveThreadLocally: (threadId: string, saved: boolean, userId: string) => {
    set(state => {
      const updatedThreads = state.threads.map(t => {
        if (t.id === threadId) {
          const newSaves = saved ? [{ userId, threadId, id: 'temp', createdAt: new Date() }] : [];
          return { ...t, saves: newSaves as any };
        }
        return t;
      });

      const newFeedCounts = state.feedCounts ? { ...state.feedCounts } : {};
      if (saved) {
        newFeedCounts.SAVED = (newFeedCounts.SAVED || 0) + 1;
        newFeedCounts.saved = newFeedCounts.SAVED;
      } else {
        newFeedCounts.SAVED = Math.max(0, (newFeedCounts.SAVED || 0) - 1);
        newFeedCounts.saved = newFeedCounts.SAVED;
      }

      return { threads: updatedThreads, feedCounts: newFeedCounts };
    });
  },

  fetchTrendingResearch: async () => {
    const res = await apiFetch('/api/feed/trending');
    if (res.ok) return await res.json();
    return [];
  },

  fetchSuggestedPeers: async () => {
    try {
      const res = await apiFetch('/api/users/collaborators');
      if (res.ok) {
        const data = await res.json();
        return data.map((u: any) => {
          let connected: 'connect' | 'pending' | 'connected' = 'connect';
          if (u.connectionStatus === 'PENDING') connected = 'pending';
          else if (u.connectionStatus === 'CONNECTED') connected = 'connected';
          return {
            id: u.id,
            name: u.name,
            role: u.role,
            department: u.department,
            connected
          };
        });
      }
      return [];
    } catch (e) {
      console.error('Failed to load peers:', e);
      return [];
    }
  },

  connectWithPeer: async (peerId: string) => {
    try {
      const res = await apiFetch(`/api/users/${peerId}/connect`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        return data.status as 'connect' | 'pending' | 'connected';
      }
      get().addToast('Failed to send connection request', 'error');
      return null;
    } catch (err) {
      get().addToast('Network error while connecting', 'error');
      return null;
    }
  },

  searchFeed: async (query) => {
    const res = await apiFetch(`/api/feed/search?q=${encodeURIComponent(query)}`);
    if (res.ok) return await res.json();
    return { threads: [], publications: [], users: [] };
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
      localStorage.removeItem('dev_role');
    }
    deleteCookie(ROLE_COOKIE_NAME);
    // Reset the auth promise singleton so re-login initializes a fresh auth listener
    resetAuthPromise();
    if (typeof window !== 'undefined' && window.Clerk) {
      window.Clerk.signOut().catch(() => { });
    }
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
      const headers = await getBearerHeader();
      const res = await apiFetch('/api/users/approve-scholar', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ scholarId })
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const updatedScholar = await res.json();
      set(state => ({
        pendingApprovals: state.pendingApprovals.filter(s => s.id !== scholarId),
        myScholars: [...state.myScholars, updatedScholar]
      }));
      get().addToast('Scholar approved successfully', 'success');
      return updatedScholar;
    } catch (err: any) {
      get().addToast(err.message, 'error');
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  declineScholar: async (scholarId: string) => {
    set({ isLoading: true });
    try {
      const headers = await getBearerHeader();
      const res = await apiFetch('/api/users/decline-scholar', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ scholarId })
      });
      if (!res.ok) throw new Error(await readApiError(res));
      set(state => ({
        pendingApprovals: state.pendingApprovals.filter(s => s.id !== scholarId)
      }));
      get().addToast('Scholar request declined', 'info');
      const declinedScholar = await res.json();
      return declinedScholar;
    } catch (err: any) {
      get().addToast(err.message, 'error');
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  requestSupervisor: async (supervisorId: string) => {
    set({ isLoading: true });
    try {
      const headers = await getBearerHeader();
      const res = await apiFetch('/api/users/request-supervisor', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ supervisorId })
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const updatedUser = await res.json();
      set({ currentUser: updatedUser });
      get().addToast('Supervisor requested successfully', 'success');
      return updatedUser;
    } catch (err: any) {
      get().addToast(err.message, 'error');
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPendingSupervisors: async () => {
    set({ isLoading: true });
    try {
      const headers = await getBearerHeader();
      const res = await apiFetch('/api/users/pending-supervisors', { headers });
      if (!res.ok) throw new Error(await readApiError(res));
      const supervisors = await res.json();
      set({ pendingSupervisors: supervisors });
      return supervisors;
    } catch (err: any) {
      get().addToast(err.message, 'error');
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  approveSupervisor: async (supervisorId: string) => {
    set({ isLoading: true });
    try {
      const headers = await getBearerHeader();
      const res = await apiFetch('/api/users/approve-supervisor', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ supervisorId })
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const updatedUser = await res.json();
      set(state => ({
        pendingSupervisors: state.pendingSupervisors.filter(s => s.id !== supervisorId),
        adminUsers: [...state.adminUsers.filter(u => u.id !== supervisorId), updatedUser]
      }));
      get().addToast('Supervisor approved successfully', 'success');
      return updatedUser;
    } catch (err: any) {
      get().addToast(err.message, 'error');
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  declineSupervisor: async (supervisorId: string) => {
    set({ isLoading: true });
    try {
      const headers = await getBearerHeader();
      const res = await apiFetch('/api/users/decline-supervisor', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ supervisorId })
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const rejectedUser = await res.json();
      set(state => ({
        pendingSupervisors: state.pendingSupervisors.filter(s => s.id !== supervisorId),
        adminUsers: state.adminUsers.filter(u => u.id !== supervisorId)
      }));
      get().addToast('Supervisor registration declined', 'info');
      return rejectedUser;
    } catch (err: any) {
      get().addToast(err.message, 'error');
      throw err;
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
      const res = await apiFetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        set({ adminUsers: data });
        return data;
      }
      const fallbackRes = await apiFetch('/api/users/all');
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
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
      const res = await apiFetch(`/api/admin/users/${userId}`, {
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
      const fallbackRes = await apiFetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        set(state => ({
          adminUsers: state.adminUsers.map(u => u.id === userId ? data : u)
        }));
        return data;
      }
      throw new Error('Failed to update user role.');
    } finally {
      set({ isLoading: false });
    }
  },

  createAdminUser: async (data) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const newUser = await res.json();
      set((state) => ({ adminUsers: [newUser, ...state.adminUsers] }));
      get().addToast('User provisioned successfully', 'success');
      return newUser;
    } catch (err: any) {
      get().addToast(err.message, 'error');
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  updateAdminUser: async (id, data) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const updatedUser = await res.json();
      set((state) => ({
        adminUsers: state.adminUsers.map((u) => (u.id === id ? updatedUser : u)),
      }));
      get().addToast('User updated successfully', 'success');
      return updatedUser;
    } catch (err: any) {
      get().addToast(err.message, 'error');
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAdminUser: async (id) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(await readApiError(res));
      set((state) => ({
        adminUsers: state.adminUsers.filter((u) => u.id !== id),
      }));
      get().addToast('User deleted successfully', 'success');
    } catch (err: any) {
      get().addToast(err.message, 'error');
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  importAdminUsers: async (formData) => {
    set({ isLoading: true });
    try {
      const headers = await getAuthHeaders();
      const cleanedHeaders = { ...headers };
      delete (cleanedHeaders as any)['Content-Type'];

      const res = await fetch(`${API_URL}/api/admin/users/import`, {
        method: 'POST',
        headers: cleanedHeaders,
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        let parsedError = errorText;
        try {
          const json = JSON.parse(errorText);
          parsedError = json.message || json.error || errorText;
        } catch { }
        throw new Error(parsedError);
      }

      const report = await res.json();
      get().addToast(`Bulk import complete. Success: ${report.successCount}, Failed: ${report.failedCount}`, 'info');
      return report;
    } catch (err: any) {
      get().addToast(err.message, 'error');
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPendingScholars: async () => {
    set({ isLoading: true });
    try {
      const res = await apiFetch('/api/supervisor/pending-scholars');
      if (res.ok) {
        const data = await res.json();
        set({ pendingApprovals: data });
        return data;
      }
      return [];
    } catch (e) {
      console.error(e);
      return [];
    } finally {
      set({ isLoading: false });
    }
  },

  supervisorApproveScholar: async (requestId) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch(`/api/supervisor/approve/${requestId}`, {
        method: 'PUT',
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const updatedScholar = await res.json();
      set((state) => ({
        pendingApprovals: state.pendingApprovals.filter((s: any) => s.requestId !== requestId),
        myScholars: [...state.myScholars, updatedScholar],
      }));
      get().addToast('Scholar approved successfully', 'success');
      return updatedScholar;
    } catch (err: any) {
      get().addToast(err.message, 'error');
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  supervisorRejectScholar: async (requestId) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch(`/api/supervisor/reject/${requestId}`, {
        method: 'PUT',
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const rejectedScholar = await res.json();
      set((state) => ({
        pendingApprovals: state.pendingApprovals.filter((s: any) => s.requestId !== requestId),
      }));
      get().addToast('Scholar rejected successfully', 'info');
      return rejectedScholar;
    } catch (err: any) {
      get().addToast(err.message, 'error');
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPublications: async (userId?: string) => {
    try {
      const url = userId ? `/api/publications?userId=${userId}` : '/api/publications';
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        set({ publications: data });
        return data;
      }
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  createPublication: async (data) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch('/api/publications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const pub = await res.json();
        set((state) => ({ publications: [pub, ...state.publications] }));
        return pub;
      }
      throw new Error('Failed to create publication.');
    } finally {
      set({ isLoading: false });
    }
  },

  updatePublication: async (id, data) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch(`/api/publications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const pub = await res.json();
        set((state) => ({
          publications: state.publications.map((p) => (p.id === id ? pub : p)),
        }));
        return pub;
      }
      throw new Error('Failed to update publication.');
    } finally {
      set({ isLoading: false });
    }
  },

  deletePublication: async (id) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch(`/api/publications/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        set((state) => ({
          publications: state.publications.filter((p) => p.id !== id),
        }));
        return;
      }
      throw new Error('Failed to delete publication.');
    } finally {
      set({ isLoading: false });
    }
  },

  fetchReports: async () => {
    try {
      const res = await apiFetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        set({ reports: data });
        return data;
      }
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  submitReport: async (data) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const report = await res.json();
        set((state) => ({ reports: [report, ...state.reports] }));
        return report;
      }
      throw new Error('Failed to submit report.');
    } finally {
      set({ isLoading: false });
    }
  },

  reviewReport: async (id, status, feedback) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch(`/api/reports/${id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, feedback }),
      });
      if (res.ok) {
        const report = await res.json();
        set((state) => ({
          reports: state.reports.map((r) => (r.id === id ? report : r)),
        }));
        return report;
      }
      throw new Error('Failed to review report.');
    } finally {
      set({ isLoading: false });
    }
  },

  fetchDepartments: async () => {
    try {
      const res = await apiFetch('/api/departments');
      if (res.ok) {
        const data = await res.json();
        set({ departments: data });
        return data;
      }
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  createDepartment: async (data) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const dept = await res.json();
        set((state) => ({ departments: [...state.departments, dept] }));
        return dept;
      }
      throw new Error('Failed to create department.');
    } finally {
      set({ isLoading: false });
    }
  },

  updateDepartment: async (id, data) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch(`/api/departments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const dept = await res.json();
        set((state) => ({
          departments: state.departments.map((d) => (d.id === id ? dept : d)),
        }));
        return dept;
      }
      throw new Error('Failed to update department.');
    } finally {
      set({ isLoading: false });
    }
  },

  deleteDepartment: async (id) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch(`/api/departments/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        set((state) => ({
          departments: state.departments.filter((d) => d.id !== id),
        }));
        return;
      }
      throw new Error('Failed to delete department.');
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSupervisors: async () => {
    try {
      const res = await apiFetch('/api/users/supervisors');
      if (res.ok) {
        const data = await res.json();
        set({ supervisors: data });
        return data;
      }
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  fetchMyScholars: async () => {
    try {
      const res = await apiFetch('/api/users/my-scholars');
      if (res.ok) {
        const data = await res.json();
        set({ myScholars: data });
        return data;
      }
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  fetchNotifications: async () => {
    try {
      const res = await apiFetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        set({ notifications: data });
        return data;
      }
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  suspendUserToggle: async (userId: string, suspended: boolean) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch(`/api/users/${userId}/suspend`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspended }),
      });
      if (res.ok) {
        const data = await res.json();
        set((state) => ({
          adminUsers: state.adminUsers.map((u) => (u.id === userId ? { ...u, suspended: data.suspended } : u)),
        }));
        return data;
      }
      throw new Error('Failed to suspend/unsuspend user.');
    } finally {
      set({ isLoading: false });
    }
  },

  addToast: (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  }
}));
