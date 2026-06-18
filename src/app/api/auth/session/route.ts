import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value || cookieStore.get('ncc-auth-token')?.value;

    if (!token) {
      return NextResponse.json({ session: null });
    }

    return NextResponse.json({
      session: {
        access_token: token,
        user: {}
      }
    });
  } catch (err) {
    return NextResponse.json({ session: null });
  }
}
