import { cookies } from 'next/headers';

const PASSKEY_COOKIE_NAME = 'survey_admin_session';

export function getExpectedPasskey(): string {
  return process.env.ADMIN_PASSKEY || 'admin123#';
}

export function isAuthenticatedAdmin(): boolean {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get(PASSKEY_COOKIE_NAME)?.value;
  const expectedKey = getExpectedPasskey();
  
  if (!sessionToken) return false;
  
  // Format token sederhana: base64(passkey)
  try {
    const decoded = Buffer.from(sessionToken, 'base64').toString('utf8');
    return decoded === expectedKey;
  } catch {
    return false;
  }
}

export function createAdminToken(passkey: string): string {
  return Buffer.from(passkey).toString('base64');
}

export { PASSKEY_COOKIE_NAME };
