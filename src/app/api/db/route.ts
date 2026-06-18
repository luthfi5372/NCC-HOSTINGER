import { NextResponse } from 'next/server';
import { executePayload } from '@/lib/mysql-db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ncc-super-secret-key';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // Read user auth token from cookie to verify role if needed
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value || cookieStore.get('ncc-auth-token')?.value;
    
    let userContext: any = null;
    if (token) {
      try {
        userContext = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        // Invalid token
      }
    }

    const result = await executePayload(payload);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[API DB] Error handling request:', err);
    return NextResponse.json(
      { data: null, error: { message: err.message || 'Internal Server Error' } },
      { status: 500 }
    );
  }
}
