import { NextResponse } from 'next/server';
import { executePayload } from '@/lib/mysql-db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'ncc-super-secret-key';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 });
    }

    // 1. Fetch user by email
    const { data: users } = await executePayload({
      table: 'profiles',
      action: 'select',
      filters: [{ type: 'eq', col: 'email', val: email }]
    });

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'Kredensial tidak valid' }, { status: 400 });
    }

    const user = users[0];

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Kredensial tidak valid' }, { status: 400 });
    }

    // 3. Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        user_metadata: { role: user.role }
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 4. Set cookies
    const cookieStore = await cookies();
    cookieStore.set('sb-access-token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    cookieStore.set('ncc-auth-token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7
    });
    cookieStore.set('ncc_hint', '1', { path: '/', maxAge: 60 * 60 * 24 * 7 });

    const userObj = {
      id: user.id,
      email: user.email,
      role: user.role,
      user_metadata: { role: user.role }
    };

    return NextResponse.json({ user: userObj });
  } catch (err: any) {
    console.error('[Login API] Error:', err);
    return NextResponse.json({ error: err.message || 'Error occurred' }, { status: 500 });
  }
}
