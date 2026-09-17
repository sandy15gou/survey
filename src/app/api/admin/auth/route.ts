import { NextResponse } from 'next/server';
import { getExpectedPasskey, createAdminToken, PASSKEY_COOKIE_NAME, isAuthenticatedAdmin } from '@/lib/auth';

export async function GET() {
  const isAuthed = isAuthenticatedAdmin();
  return NextResponse.json({ authenticated: isAuthed });
}

export async function POST(req: Request) {
  try {
    const { passkey } = await req.json();
    const expected = getExpectedPasskey();

    if (!passkey || passkey !== expected) {
      return NextResponse.json({ 
        success: false, 
        message: 'Passkey salah! Akses ditolak.' 
      }, { status: 401 });
    }

    const token = createAdminToken(passkey);
    const response = NextResponse.json({ 
      success: true, 
      message: 'Otentikasi berhasil' 
    });

    // Pasang cookie HTTP-only
    response.cookies.set(PASSKEY_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    });

    return response;
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Berhasil logout' });
  response.cookies.delete(PASSKEY_COOKIE_NAME);
  return response;
}
