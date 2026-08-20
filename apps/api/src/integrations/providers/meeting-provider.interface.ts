export interface CreateMeetingParams {
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number; // in minutes
  hostEmail: string;
  participantEmails?: string[];
}

export interface MeetingResult {
  externalMeetingId: string;
  meetingUrl: string;
  joinUrl: string;
  passcode?: string;
}

export interface MeetingProviderInterface {
  createMeeting(accessToken: string | null, params: CreateMeetingParams): Promise<MeetingResult>;
  cancelMeeting?(accessToken: string | null, meetingId: string): Promise<void>;
}
