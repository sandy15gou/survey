import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getExpectedPasskey, createAdminToken, PASSKEY_COOKIE_NAME, isAuthenticatedAdmin } from '@/lib/auth';

export async function GET() {
  const isAuthed = isAuthenticatedAdmin();
  return NextResponse.json({ authenticated: isAuthed });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const passkey = (body?.passkey || '').toString().trim();
    const expected = getExpectedPasskey();

    if (!passkey || passkey !== expected) {
      return NextResponse.json({ 
        success: false, 
        message: 'Passkey salah! Akses ditolak.' 
      }, { status: 401 });
    }

    const token = createAdminToken(passkey);
    
    const cookieStore = cookies();
    cookieStore.set(PASSKEY_COOKIE_NAME, token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Otentikasi berhasil' 
    });
  } catch (error: any) {
    console.error('Auth API POST error:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = cookies();
    cookieStore.delete(PASSKEY_COOKIE_NAME);
  } catch {}
  return NextResponse.json({ success: true, message: 'Berhasil logout' });
}
