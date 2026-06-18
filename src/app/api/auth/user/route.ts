import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ncc-super-secret-key';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value || cookieStore.get('ncc-auth-token')?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userObj = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      user_metadata: { role: decoded.role }
    };

    return NextResponse.json({ user: userObj });
  } catch (err) {
    return NextResponse.json({ user: null });
  }
}
