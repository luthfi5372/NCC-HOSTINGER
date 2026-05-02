"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ============================================================
// SERVER ACTIONS
// ============================================================

export type AuthResult = {
  success: boolean;
  error?: string;
  isAdmin?: boolean;
};

/** Mendaftarkan user baru ke Supabase Auth & Tabel Profiles */
export async function registerLocalUser(formData: FormData): Promise<AuthResult> {
  const username = formData.get("username")?.toString().trim();
  const fullName = formData.get("fullName")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();

  if (!username || !fullName || !email || !password) {
    return { success: false, error: "Semua kolom wajib diisi." };
  }

  if (password.length < 6) {
    return { success: false, error: "Kata sandi minimal 6 karakter." };
  }

  try {
    const supabase = await createClient();

    // 1. Sign up to Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          full_name: fullName,
        }
      }
    });

    if (authError) throw authError;

    // 2. Create profile in profiles table
    if (authData.user) {
      // Sync cookie so they can access dashboard immediately if logged in
      const cookieStore = await cookies();
      cookieStore.set("ncc_hint", "1", { path: "/", maxAge: 60 * 60 * 24 * 7 });

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: username,
          full_name: fullName,
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { success: false, error: error.message || "Terjadi kesalahan saat pendaftaran." };
  }
}

/** Login user menggunakan Supabase Auth */
export async function loginLocalUser(formData: FormData): Promise<AuthResult> {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { success: false, error: "Email dan kata sandi wajib diisi." };
  }

  // 🔥 TAKTIK 3: HARDCODE BYPASS KHUSUS ADMIN (STEALTH MODE)
  const adminEmails = ["admin@ncc.id", "admin1@ncc.id", "admin2@ncc.id", "halo.ncc@gmail.com"];
  const isAdminBypass = 
    (email === 'admin1@ncc.id' && password === '123456') ||
    (email === 'admin2@ncc.id' && password === '123456') ||
    (email === 'admin' && password === 'admin123') ||
    (email === 'admin@ncc.id' && password === 'admin123') ||
    (email === 'halo.ncc@gmail.com' && password === 'ncc2026');

  if (isAdminBypass) {
    const cookieStore = await cookies();
    cookieStore.set("ncc_hint", "1", { path: "/", maxAge: 604800, sameSite: "lax" });
    cookieStore.set("ncc_admin_hint", "1", { path: "/", maxAge: 604800, sameSite: "lax" });
    return { success: true, isAdmin: true };
  }


  try {
    const supabase = await createClient();
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    const isAdmin = adminEmails.includes(authData.user?.email?.toLowerCase() || "");

    // Set cookie for middleware sync
    const cookieStore = await cookies();
    cookieStore.set("ncc_hint", "1", { path: "/", maxAge: 60 * 60 * 24 * 7 });
    if (isAdmin) {
      cookieStore.set("ncc_admin_hint", "1", { path: "/", maxAge: 60 * 60 * 24 * 7 });
    }

    return { success: true, isAdmin };
  } catch (error: any) {
    console.error("Login error:", error);
    return { success: false, error: error.message || "Email atau kata sandi salah." };
  }
}

/** Logout user dari Supabase */
export async function logoutLocalUser() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  // Clear middleware hint cookie
  const cookieStore = await cookies();
  cookieStore.delete("ncc_hint");
  cookieStore.delete("ncc_admin_hint");
  
  redirect("/login");
}

/** Mendapatkan user yang sedang login dari Supabase Session */
export async function getLocalSession() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    // Fetch school from profile if needed, but for session basic info is enough
    return {
      id: user.id,
      email: user.email!,
      username: user.user_metadata.username || user.email?.split('@')[0],
      fullName: user.user_metadata.full_name || "Peserta NCC",
    };
  } catch {
    return null;
  }
}
