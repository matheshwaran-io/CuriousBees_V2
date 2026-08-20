export interface ChatSpaceCreationParams {
  workspaceTitle: string;
  creatorEmail: string;
  memberEmails: string[];
}

export interface ChatSpaceResult {
  spaceId: string;
  spaceUrl: string;
  displayName: string;
}

export interface ChatProvider {
  createSpace(accessToken: string, params: ChatSpaceCreationParams): Promise<ChatSpaceResult>;
  addMember?(accessToken: string, spaceId: string, email: string): Promise<void>;
  removeMember?(accessToken: string, spaceId: string, email: string): Promise<void>;
}
