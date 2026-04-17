"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ============================================================
// SERVER ACTIONS
// ============================================================

export type AuthResult = {
  success: boolean;
  error?: string;
};

/** Mendaftarkan user baru ke Supabase Auth & Tabel Profiles */
export async function registerLocalUser(formData: FormData): Promise<AuthResult> {
  const fullName = formData.get("fullName")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();

  if (!fullName || !email || !password) {
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
          full_name: fullName,
        }
      }
    });

    if (authError) throw authError;

    // 2. Create profile in profiles table
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: fullName,
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        // We don't fail registration if profile creation fails, 
        // as the user can update it later.
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

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error("Login error:", error);
    return { success: false, error: error.message || "Email atau kata sandi salah." };
  }
}

/** Logout user dari Supabase */
export async function logoutLocalUser() {
  const supabase = await createClient();
  await supabase.auth.signOut();
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
      fullName: user.user_metadata.full_name || "Peserta NCC",
    };
  } catch {
    return null;
  }
}
