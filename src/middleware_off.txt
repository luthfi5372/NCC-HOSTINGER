import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 1. Inisialisasi response dasar
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Cegah crash jika Environment Variables kosong di Vercel
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  // 3. Bangun jembatan ke Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 4. Ambil data user yang sedang login dengan aman
  const { data: { user } } = await supabase.auth.getUser();

  // 5. 🚦 LOGIKA POLISI LALU LINTAS (ROUTING)
  const pathname = request.nextUrl.pathname;

  // Proteksi Area Admin & Markas Besar (/hq)
  if (pathname.startsWith('/hq')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Cek apakah dia benar-benar Admin (Email atau Metadata)
    const adminEmails = ["admin@ncc.id", "admin1@ncc.id", "admin2@ncc.id", "halo.ncc@gmail.com"];
    const isAdmin = (user.email && adminEmails.includes(user.email.toLowerCase())) || user.user_metadata?.role === 'admin';
    
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Proteksi Area Juri (/juri)
  if (pathname.startsWith('/juri')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    const adminEmails = ["admin@ncc.id", "admin1@ncc.id", "admin2@ncc.id", "halo.ncc@gmail.com"];
    const juryEmails = ["juri1@ncc.id", "juri2@ncc.id", "juri3@ncc.id"];
    
    const isAdmin = (user.email && adminEmails.includes(user.email.toLowerCase())) || user.user_metadata?.role === 'admin';
    const isJury = (user.email && juryEmails.includes(user.email.toLowerCase())) || user.user_metadata?.role === 'juri';
    
    if (!isAdmin && !isJury) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Proteksi Dashboard Peserta (/dashboard)
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

// 6. Tentukan rute mana saja yang dijaga oleh Middleware ini
export const config = {
  matcher: [
    /*
     * Cocokkan semua request path kecuali:
     * - _next/static (file statis)
     * - _next/image (optimasi gambar)
     * - favicon.ico (ikon browser)
     * - Gambar dan aset publik lainnya (.svg, .png, dsb)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
