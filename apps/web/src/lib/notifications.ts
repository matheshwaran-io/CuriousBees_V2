import { Notification } from '@curiousbees/types';

export interface NotificationPreferences {
  researchPapers: boolean;
  collaborations: boolean;
  advisoryMilestones: boolean;
  opportunities: boolean;
  events: boolean;
  emailDigest?: string;
  soundEffects?: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  researchPapers: true,
  collaborations: true,
  advisoryMilestones: true,
  opportunities: true,
  events: true,
  emailDigest: 'instant',
  soundEffects: true,
};

export type NotificationCategory = 'RESEARCH' | 'COLLABORATION' | 'ADVISORY' | 'OPPORTUNITIES' | 'EVENTS' | 'SYSTEM';

export function getStoredNotificationPreferences(): NotificationPreferences {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_PREFERENCES;
  try {
    const saved = localStorage.getItem('cb_pref_notifications');
    if (saved) {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(saved) };
    }
  } catch (e) {
    // ignore json error
  }
  return DEFAULT_NOTIFICATION_PREFERENCES;
}

/**
 * Resolves the true semantic category of a notification from its type, title, and body
 */
export function resolveNotificationCategory(notif: Partial<Notification>): NotificationCategory {
  const type = (notif.type || '').toUpperCase();
  const title = (notif.title || '').toLowerCase();
  const body = (notif.body || '').toLowerCase();

  // 1. PhD Advisory & Supervision
  if (
    type === 'ADVISORY' ||
    type === 'SUPERVISION' ||
    type === 'SCHOLAR_REQUEST' ||
    type === 'SUPERVISOR_REQUEST' ||
    type === 'MILESTONE' ||
    title.includes('supervisor') ||
    title.includes('scholar') ||
    title.includes('advisory') ||
    title.includes('synopsis') ||
    title.includes('progress report') ||
    title.includes('thesis') ||
    title.includes('defense') ||
    title.includes('reassign') ||
    body.includes('supervisor') ||
    body.includes('scholar')
  ) {
    return 'ADVISORY';
  }

  // 2. Collaboration & Synergy
  if (
    type === 'COLLABORATION' ||
    type === 'COLLABORATION_REQUEST' ||
    type === 'COLLAB_REQUEST' ||
    type === 'WORKSPACE_INVITE' ||
    title.includes('collab') ||
    title.includes('synergy') ||
    title.includes('workspace') ||
    title.includes('proposal group') ||
    title.includes('peer connect') ||
    body.includes('collaborat') ||
    body.includes('synergy') ||
    body.includes('workspace')
  ) {
    return 'COLLABORATION';
  }

  // 3. Research Paper / Publication
  if (
    type === 'RESEARCH_PAPER' ||
    type === 'POST' ||
    type === 'PUBLICATION' ||
    title.includes('paper') ||
    title.includes('publication') ||
    title.includes('journal') ||
    title.includes('manuscript') ||
    title.includes('preprint') ||
    title.includes('doi') ||
    body.includes('published') ||
    body.includes('journal')
  ) {
    return 'RESEARCH';
  }

  // 4. Grant & Opportunities
  if (
    type === 'OPPORTUNITY' ||
    type === 'GRANT' ||
    title.includes('opportunity') ||
    title.includes('grant') ||
    title.includes('funding') ||
    title.includes('fellowship') ||
    title.includes('serb') ||
    title.includes('dst') ||
    title.includes('phd position') ||
    body.includes('grant') ||
    body.includes('funding')
  ) {
    return 'OPPORTUNITIES';
  }

  // 5. Events & Conferences
  if (
    type === 'EVENT' ||
    type === 'CONFERENCE' ||
    type === 'SEMINAR' ||
    title.includes('event') ||
    title.includes('conference') ||
    title.includes('seminar') ||
    title.includes('symposium') ||
    title.includes('workshop') ||
    title.includes('keynote') ||
    body.includes('conference') ||
    body.includes('seminar')
  ) {
    return 'EVENTS';
  }

  return 'SYSTEM';
}

/**
 * Evaluates whether a notification is allowed to be displayed based on active User Settings
 */
export function isNotificationAllowedByPreferences(
  notif: Notification,
  prefs: NotificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES
): boolean {
  const category = resolveNotificationCategory(notif);

  switch (category) {
    case 'RESEARCH':
      return prefs.researchPapers !== false;
    case 'COLLABORATION':
      return prefs.collaborations !== false;
    case 'ADVISORY':
      return prefs.advisoryMilestones !== false;
    case 'OPPORTUNITIES':
      return prefs.opportunities !== false;
    case 'EVENTS':
      return prefs.events !== false;
    case 'SYSTEM':
    default:
      return true;
  }
}

