import { NextResponse } from 'next/server';
import { executePayload } from '@/lib/mysql-db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'ncc-super-secret-key';

export async function POST(request: Request) {
  try {
    const { email, password, username, full_name, school, npsn } = await request.json();

    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // 1. Check if user already exists
    const { data: existing } = await executePayload({
      table: 'profiles',
      action: 'select',
      filters: [{ type: 'eq', col: 'email', val: email }]
    });

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `u-${Math.random().toString(36).substring(2, 15)}-${Date.now().toString(36)}`;

    // 3. Create user profile in profiles table
    const profileData = {
      id: userId,
      username,
      email,
      password_hash: passwordHash,
      full_name,
      school: school || null,
      npsn: npsn || null,
      role: 'peserta' // Default role
    };

    const { error: insertErr } = await executePayload({
      table: 'profiles',
      action: 'insert',
      insertData: profileData
    });

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // 4. Generate JWT token
    const token = jwt.sign(
      {
        id: userId,
        email,
        username,
        role: 'peserta',
        user_metadata: { role: 'peserta' }
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. Set cookie
    const cookieStore = await cookies();
    cookieStore.set('sb-access-token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    // Fallback cookie
    cookieStore.set('ncc-auth-token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7
    });
    // ncc_hint for login indication
    cookieStore.set('ncc_hint', '1', { path: '/', maxAge: 60 * 60 * 24 * 7 });

    const userObj = {
      id: userId,
      email,
      role: 'peserta',
      user_metadata: { role: 'peserta' }
    };

    return NextResponse.json({ user: userObj });
  } catch (err: any) {
    console.error('[Signup API] Error:', err);
    return NextResponse.json({ error: err.message || 'Error occurred' }, { status: 500 });
  }
}
