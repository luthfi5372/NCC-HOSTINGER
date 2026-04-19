import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Middleware untuk proteksi dashboard dan area admin.
 * Memverifikasi sesi dan role user langsung dari data Supabase (Server-Side Authority).
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isDashboard = path.startsWith("/dashboard");
  const isAdminArea = path.startsWith("/admin") || path.startsWith("/hq");

  // 1. Cek Area Admin (Prioritas Tertinggi)
  if (isAdminArea) {
    const isHardcodedAdmin = user?.email === "admin1@ncc.id";
    if (!user || (!isHardcodedAdmin && user.user_metadata?.role !== "admin")) {
      // Jika bukan admin, arahkan ke dashboard peserta atau login
      const url = request.nextUrl.clone();
      url.pathname = user ? "/dashboard" : "/login";
      return NextResponse.redirect(url);
    }
    return response;
  }

  // 2. Cek Dashboard Peserta Umum
  if (isDashboard && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", path);
    return NextResponse.redirect(url);
  }

  return response;
}


export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/hq/:path*"],
};
