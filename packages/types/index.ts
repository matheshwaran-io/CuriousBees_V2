export type UserRole = 'RESEARCH_SCHOLAR' | 'RESEARCH_SUPERVISOR' | 'INSTITUTE_ADMIN';

export interface User {
  id: string;
  clerkId: string | null;
  name: string | null;
  email: string;
  image: string | null;
  role: UserRole;
  department: string | null;
  departmentId: string | null;
  departmentRef?: Department | null;
  bio: string | null;
  onboardingCompleted: boolean;
  approved: boolean;
  status: string;
  approvedBy?: string | null;
  approvedAt?: Date | string | null;
  suspended: boolean;
  supervisorId: string | null;
  supervisorEmail: string | null;
  employeeId: string | null;
  createdAt: Date | string;
  interests?: UserInterest[];
  threads?: Thread[];
  comments?: Comment[];
  opportunities?: Opportunity[];
  supervisor?: User | null;
  scholars?: User[];
  publications?: Publication[];
  submittedReports?: Report[];
  reviewedReports?: Report[];
}

export interface ResearchInterest {
  id: string;
  name: string;
}

export interface UserInterest {
  userId: string;
  interestId: string;
  interest?: ResearchInterest;
}

export interface ThreadAttachment {
  id: string;
  threadId: string;
  name: string;
  url: string;
  size: number;
  type: 'PDF' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  createdAt: Date | string;
}

export interface ThreadLike {
  id: string;
  threadId: string;
  userId: string;
  createdAt: Date | string;
}

export interface ThreadShare {
  id: string;
  threadId: string;
  userId: string;
  platform?: string | null;
  createdAt: Date | string;
}

export interface ThreadReport {
  id: string;
  threadId: string;
  reporterId: string;
  reason: string;
  status: string;
  createdAt: Date | string;
}

export interface SavedThread {
  id: string;
  threadId: string;
  userId: string;
  createdAt: Date | string;
}

export interface ResearchConnection {
  id: string;
  requesterId: string;
  receiverId: string;
  status: 'PENDING' | 'CONNECTED' | 'REJECTED';
  createdAt: Date | string;
  updatedAt: Date | string;
  requester?: User;
  receiver?: User;
}

export interface Thread {
  id: string;
  title: string;
  content: string;
  type?: 'TEXT' | 'RESEARCH_UPDATE' | 'DISCUSSION' | 'QUESTION' | 'ANNOUNCEMENT';
  isPaper?: boolean;
  paperJournal?: string | null;
  authorId: string;
  author?: User;
  tags: string[];
  comments?: Comment[];
  attachments?: ThreadAttachment[];
  likes?: ThreadLike[];
  shares?: ThreadShare[];
  reports?: ThreadReport[];
  saves?: SavedThread[];
  _count?: { comments?: number, likes?: number, shares?: number, saves?: number };
  createdAt: Date | string;
}

export interface Comment {
  id: string;
  content: string;
  threadId: string;
  thread?: Thread;
  authorId: string;
  author?: User;
  parentId?: string | null;
  parent?: Comment | null;
  replies?: Comment[];
  createdAt: Date | string;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  department: string;
  researchDomain: string;
  authorId: string;
  author?: User;
  createdAt: Date | string;
}

// REST API Request / Response Types
export interface CreateThreadInput {
  title: string;
  content: string;
  tags: string[];
  type?: 'TEXT' | 'RESEARCH_UPDATE' | 'DISCUSSION' | 'QUESTION' | 'ANNOUNCEMENT' | 'PUBLICATION' | 'ACHIEVEMENT' | 'COLLABORATION_REQUEST';
  attachments?: { name: string; url: string; size: number; type: 'PDF' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' }[];
}

export interface CreateCommentInput {
  content: string;
  threadId: string;
  parentId?: string;
}

export interface CreateOpportunityInput {
  title: string;
  description: string;
  department: string;
  researchDomain: string;
}

export interface UpdateProfileInput {
  name?: string;
  role?: UserRole;
  department?: string;
  bio?: string;
  interests?: string[]; // Array of interest names
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  department?: string;
  venue: string;
  date: string;
  time: string;
  category?: string;
  organizerEmail?: string;
  posterUrl?: string;
  registrationLink?: string;
  createdByAi?: boolean;
  approvalStatus?: 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'NEEDS_INFO';
  tags?: string[];
  createdAt?: string;
}

export interface CreateEventInput {
  event: string;
  date: string;
  time: string;
  venue: string;
}

export interface CollaborationRequest {
  id: string;
  scholarId: string;
  opportunityId?: string | null;
  threadId?: string | null;
  status: 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'NEEDS_INFO';
  message: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  scholar?: User;
  opportunity?: Opportunity;
  thread?: Thread;
}

export interface Workspace {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  members?: WorkspaceMember[];
  files?: WorkspaceFile[];
  milestones?: WorkspaceMilestone[];
  announcements?: WorkspaceAnnouncement[];
}

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: 'OWNER' | 'MEMBER';
  joinedAt: Date | string;
  user?: User;
  workspace?: Workspace;
}

export interface WorkspaceFile {
  id: string;
  workspaceId: string;
  name: string;
  url: string;
  size: number;
  uploadedById: string;
  uploadedAt: Date | string;
  uploadedBy?: User;
}

export interface WorkspaceMilestone {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  dueDate: Date | string | null;
  completed: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface WorkspaceAnnouncement {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: Date | string;
  author?: User;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: Date | string;
}

export interface Faculty {
  id: string;
  name: string;
  code: string;
  description: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  departments?: Department[];
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  facultyId: string | null;
  faculty?: Faculty | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  users?: User[];
}

export interface Publication {
  id: string;
  title: string;
  authors: string;
  doi: string | null;
  publisher: string | null;
  year: number;
  status: string; // "DRAFT" | "SUBMITTED" | "PUBLISHED" | "UNDER_REVIEW"
  userId: string;
  user?: User;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Report {
  id: string;
  title: string;
  description: string | null;
  status: string; // "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_INFO"
  evidenceUrl: string | null;
  feedback: string | null;
  scholarId: string;
  scholar?: User;
  supervisorId: string;
  supervisor?: User;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Notification {
  id: string;
  userId: string;
  eventId: string | null;
  title: string;
  body: string;
  sentStatus: boolean;
  openedStatus: boolean;
  createdAt: Date | string;
}
