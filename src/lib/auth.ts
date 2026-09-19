import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

const PASSKEY_COOKIE_NAME = 'survey_admin_session';

export function getExpectedPasskey(): string {
  if (process.env.ADMIN_PASSKEY) {
    return process.env.ADMIN_PASSKEY.trim().replace(/^[\"']|[\"']$/g, '');
  }
  try {
    const envFile = path.join(process.cwd(), '.env');
    if (fs.existsSync(envFile)) {
      const text = fs.readFileSync(envFile, 'utf8');
      const match = text.match(/ADMIN_PASSKEY\s*=\s*[\"']?([^\"\'\r\n]+)[\"']?/);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  } catch {}
  return 'admin123#';
}

export function isAuthenticatedAdmin(): boolean {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get(PASSKEY_COOKIE_NAME)?.value;
    const expectedKey = getExpectedPasskey();
    
    if (!sessionToken) return false;
    
    const decoded = Buffer.from(sessionToken, 'base64').toString('utf8');
    return decoded.trim() === expectedKey.trim();
  } catch {
    return false;
  }
}

export function createAdminToken(passkey: string): string {
  return Buffer.from(passkey.trim()).toString('base64');
}

export { PASSKEY_COOKIE_NAME };
