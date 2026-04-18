import { type NextRequest, NextResponse } from "next/server";

// Middleware minimal - proteksi dashboard via cookie hint
// Auth utama menggunakan localStorage (client-side)
export function proxy(request: NextRequest) {
  const isLoggedIn = request.cookies.get("ncc_hint")?.value === "1";
  const path = request.nextUrl.pathname;
  
  const isProtected = path.startsWith("/dashboard") || path.startsWith("/admin");

  if (isProtected && !isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", path);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
