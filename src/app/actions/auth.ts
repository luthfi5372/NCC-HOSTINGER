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
  const adminEmails = ["admin@ncc.id", "admin1@ncc.id", "halo.ncc@gmail.com"];
  const isAdminBypass = 
    (email === 'admin1@ncc.id' && password === '123456') ||
    (email === 'admin' && password === 'admin123') ||
    (email === 'admin@ncc.id' && password === 'admin123') ||
    (email === 'halo.ncc@gmail.com' && password === 'ncc2026');

  if (isAdminBypass) {
    const cookieStore = await cookies();
    cookieStore.set("ncc_hint", "1", { path: "/", maxAge: 604800, sameSite: "lax" });
    cookieStore.set("ncc_admin_hint", "1", { path: "/", maxAge: 604800, sameSite: "lax" });

    // 🚀 BRIDGE TO SUPABASE AUTH: Auto-register and login the admin to establish a valid Supabase Auth session
    // This allows the admin client to bypass the Row Level Security (RLS) policies and see the participant list.
    try {
      const supabase = await createClient();
      const authEmail = email === "admin" ? "admin@ncc.id" : email;
      const authPassword = password;

      console.log(`[Admin Bridge] Attempting to sign in admin to Supabase Auth: ${authEmail}...`);
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword
      });

      if (signInError) {
        console.warn(`[Admin Bridge] Admin sign-in failed: ${signInError.message}. Attempting auto-registration...`);
        
        // Register the admin account on the fly
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              full_name: "NCC Admin Command",
              username: authEmail.split('@')[0],
            }
          }
        });

        if (!signUpError && signUpData.user) {
          console.log(`[Admin Bridge] Successfully registered admin on-the-fly. Syncing profile...`);
          // Sync profile to profiles table
          await supabase
            .from('profiles')
            .insert({
              id: signUpData.user.id,
              username: authEmail.split('@')[0],
              full_name: "NCC Admin Command",
            });

          // Log in again to establish session cookies
          await supabase.auth.signInWithPassword({
            email: authEmail,
            password: authPassword
          });
          console.log(`[Admin Bridge] Admin successfully logged in after auto-registration!`);
        } else {
          console.error(`[Admin Bridge] Auto-registration failed:`, signUpError);
        }
      } else {
        console.log(`[Admin Bridge] Admin logged in successfully!`);
      }
    } catch (e) {
      console.error(`[Admin Bridge] Error bridging admin bypass to Supabase Auth:`, e);
    }

    return { success: true, isAdmin: true };
  }


  try {
    const supabase = await createClient();
    
    let signInResult = null;
    try {
      signInResult = await supabase.auth.signInWithPassword({
        email,
        password
      });
    } catch (e: any) {
      signInResult = { data: null, error: e };
    }

    let authData = signInResult.data;
    let authError = signInResult.error;

    if (authError) {
      // 🚨 FALLBACK: Check if this user exists in competition_entries and has verified status
      // where email = email and password (entered as password) matches their NISN
      const { data: entries, error: dbError } = await supabase
        .from('competition_entries')
        .select('*')
        .eq('email', email)
        .eq('nisn', password); // Password is their NISN!

      if (!dbError && entries && entries.length > 0) {
        const entry = entries[0];
        console.log(`[Auth Fallback] Found matching verified participant for ${email}. Auto-registering...`);
        
        // Register the participant on-the-fly in Supabase Auth
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password, // NISN becomes their password
          options: {
            data: {
              full_name: entry.full_name,
              username: email.split('@')[0],
            }
          }
        });

        if (!signUpError && signUpData.user) {
          // Sync profile to profiles table
          await supabase
            .from('profiles')
            .insert({
              id: signUpData.user.id,
              username: email.split('@')[0],
              full_name: entry.full_name,
            });

          // Link competition_entries user_id with the new Supabase Auth user ID
          await supabase
            .from('competition_entries')
            .update({ user_id: signUpData.user.id })
            .eq('id', entry.id);

          // Retry login
          const retryResult = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (!retryResult.error) {
            authData = retryResult.data;
            authError = null;
          } else {
            throw retryResult.error;
          }
        } else {
          throw signUpError || new Error("Failed to register participant on-the-fly.");
        }
      } else {
        throw authError; // Throw original login error
      }
    }

    if (!authData || !authData.user) {
      throw new Error("Sesi tidak valid.");
    }

    const isAdmin = adminEmails.includes(authData.user.email?.toLowerCase() || "");

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
