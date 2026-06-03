export type UserRole = 'RESEARCH_SCHOLAR' | 'RESEARCH_SUPERVISOR' | 'INSTITUTION_ADMIN';

export interface User {
  id: string;
  firebaseUid: string | null;
  name: string | null;
  email: string;
  image: string | null;
  role: UserRole;
  department: string | null;
  bio: string | null;
  approved: boolean;
  supervisorId: string | null;
  supervisorEmail: string | null;
  createdAt: Date | string;
  interests?: UserInterest[];
  threads?: Thread[];
  comments?: Comment[];
  opportunities?: Opportunity[];
  supervisor?: User | null;
  scholars?: User[];
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

export interface Thread {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author?: User;
  tags: string[];
  comments?: Comment[];
  _count?: { comments: number };
  createdAt: Date | string;
}

export interface Comment {
  id: string;
  content: string;
  threadId: string;
  thread?: Thread;
  authorId: string;
  author?: User;
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
}

export interface CreateCommentInput {
  content: string;
  threadId: string;
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
  opportunityId: string;
  status: 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'NEEDS_INFO';
  message: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  scholar?: User;
  opportunity?: Opportunity;
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
