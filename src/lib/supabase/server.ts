import { cookies } from 'next/headers';
import { createMySQLServerClient } from '../mysql-client';

export async function createClient(url?: string, key?: string, options?: any) {
  let cookieStore: any = null;
  try {
    cookieStore = await cookies();
  } catch (e) {
    // Suppress cookie access error in middleware
  }

  const getCookies = options?.cookies || {
    getAll() {
      return cookieStore ? cookieStore.getAll() : [];
    }
  };

  return createMySQLServerClient({ cookies: getCookies });
}
