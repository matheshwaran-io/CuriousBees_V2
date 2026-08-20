/**
 * Resolves the primary profile image url using authenticated Supabase/Google data fallback.
 * 
 * Image Priority:
 * 1. Supabase / Google OAuth user image / DB synced image
 * 2. Fallback to ui-avatars initials generator (never broken)
 */
export function getProfileImageUrl(user: {
  image?: string | null;
  imageUrl?: string | null;
  avatarUrl?: string | null;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
} | null | undefined): string {
  if (!user) {
    return 'https://ui-avatars.com/api/?name=User&background=0C4DA2&color=fff&size=128';
  }

  // Supabase / Google OAuth dynamic imageUrl / DB cached image
  const primaryUrl = user.imageUrl || user.image || user.avatarUrl;
  if (primaryUrl) {
    return primaryUrl;
  }

  // Fallback to initials avatar using first name & last name / name
  const nameParts: string[] = [];
  if (user.firstName) nameParts.push(user.firstName);
  if (user.lastName) nameParts.push(user.lastName);
  
  let displayName = nameParts.join(' ').trim();
  if (!displayName && user.name) {
    displayName = user.name;
  }
  if (!displayName && user.email) {
    displayName = user.email.split('@')[0];
  }
  if (!displayName) {
    displayName = 'Researcher';
  }

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0C4DA2&color=fff&size=128`;
}
