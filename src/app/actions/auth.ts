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
          custom_password: password, // Save custom password in auth metadata!
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

      // Automatically link pre-existing competition_entries matching this email
      try {
        const { data: entries } = await supabase
          .from('competition_entries')
          .select('id, notes')
          .eq('email', email);
          
        if (entries && entries.length > 0) {
          for (const entry of entries) {
            let notesObj: any = {};
            if (entry.notes) {
              try { notesObj = JSON.parse(entry.notes); } catch (e) {}
            }
            notesObj.custom_password = password; // Save plain text custom password
            
            await supabase
              .from('competition_entries')
              .update({
                user_id: authData.user.id,
                notes: JSON.stringify(notesObj)
              })
              .eq('id', entry.id);
          }
        }
      } catch (err) {
        console.error("Gagal menautkan competition_entries pada registrasi:", err);
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { success: false, error: error.message || "Terjadi kesalahan saat pendaftaran." };
  }
}

/** Sinkronisasi data pendaftaran dan sandi kustom dari form client-side /daftar */
export async function syncEntryOnDaftar(email: string, userId: string, password: string) {
  try {
    const supabase = await createClient();
    const { data: entries } = await supabase
      .from('competition_entries')
      .select('id, notes')
      .eq('email', email);
      
    if (entries && entries.length > 0) {
      for (const entry of entries) {
        let notesObj: any = {};
        if (entry.notes) {
          try { notesObj = JSON.parse(entry.notes); } catch (e) {}
        }
        notesObj.custom_password = password; // Save plain text custom password
        
        await supabase
          .from('competition_entries')
          .update({
            user_id: userId,
            notes: JSON.stringify(notesObj)
          })
          .eq('id', entry.id);
      }
    }
    return { success: true };
  } catch (err) {
    console.error("Gagal sinkronisasi entry pada daftar client:", err);
    return { success: false };
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
        
        // If they already have a user_id linked in the database, they already have a Supabase Auth account.
        // If signInWithPassword failed, they entered a wrong password, so we do not re-register them.
        if (entry.user_id) {
          throw new Error("Email atau kata sandi salah. Jika Anda sudah mengaktifkan akun / membuat kata sandi kustom sebelumnya, silakan gunakan kata sandi kustom Anda (bukan NISN).");
        }

        console.log(`[Auth Fallback] Found matching verified participant for ${email}. Auto-registering...`);
        
        // Register the participant on-the-fly in Supabase Auth
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password, // NISN becomes their password
          options: {
            data: {
              full_name: entry.full_name,
              username: email.split('@')[0],
              custom_password: password, // NISN becomes custom password!
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
          const isAlreadyRegistered = 
            signUpError?.message?.toLowerCase().includes("already registered") || 
            signUpError?.message?.toLowerCase().includes("already exists") ||
            signUpError?.status === 422;

          if (isAlreadyRegistered) {
            throw new Error("Email ini sudah terdaftar dengan kata sandi kustom. Silakan masuk menggunakan kata sandi yang Anda buat saat pendaftaran pertama kali di portal ini (bukan NISN Anda), atau gunakan fitur Lupa Sandi.");
          }
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

    // 🚀 SELF-HEALING PASSWORD SYNC & LINKING:
    // Write the successful plain-text password to competition_entries.notes JSON and ensure user_id is linked.
    if (!isAdmin) {
      try {
        const { data: entries } = await supabase
          .from('competition_entries')
          .select('id, notes, user_id')
          .or(`user_id.eq.${authData.user.id},email.eq.${email}`);
          
        if (entries && entries.length > 0) {
          for (const entry of entries) {
            let notesObj: any = {};
            if (entry.notes) {
              try { notesObj = JSON.parse(entry.notes); } catch (e) {}
            }
            notesObj.custom_password = password; // Save plain text password
            
            const updatePayload: any = { notes: JSON.stringify(notesObj) };
            if (!entry.user_id) {
              updatePayload.user_id = authData.user.id; // Link user_id!
            }
            
            await supabase
              .from('competition_entries')
              .update(updatePayload)
              .eq('id', entry.id);
          }
        }
      } catch (err) {
        console.error("Gagal sinkronisasi sandi/link ke competition_entries:", err);
      }
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

/** Mengambil semua pendaftaran kompetisi khusus untuk halaman Admin HQ (Bypass RLS via Service Role) */
export async function getAdminCompetitionEntries() {
  try {
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // --- TAHAP 1: Gunakan Service Role Key (Bypass RLS 100%) ---
    if (serviceRoleKey) {
      console.log("[SA] Menggunakan Service Role Key...");
      const serviceClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      const { data, error } = await serviceClient
        .from('competition_entries')
        .select('*')
        .neq('email', 'admin1@ncc.id')
        .order('created_at', { ascending: false });

      console.log("[SA] Service Role hasil:", data?.length ?? 0, "baris, error:", error?.message);
      if (!error) return { data: data || [], error: null };
    }

    // --- TAHAP 2: Coba dengan sesi cookie server ---
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const adminEmails = ["admin@ncc.id", "admin1@ncc.id", "halo.ncc@gmail.com"];
    console.log("[SA] Sesi cookie:", user?.email || "tidak ada");

    if (user && adminEmails.includes(user.email?.toLowerCase() || "")) {
      const { data, error } = await supabase
        .from('competition_entries')
        .select('*')
        .neq('email', 'admin1@ncc.id')
        .order('created_at', { ascending: false });
      console.log("[SA] Cookie sesi hasil:", data?.length ?? 0, "baris");
      if (!error && data && data.length > 0) return { data, error: null };
    }

    // --- TAHAP 3: Coba login admin1, atau daftarkan dulu jika belum ada ---
    const authClient = createSupabaseClient(supabaseUrl, anonKey);

    let signInResult = await authClient.auth.signInWithPassword({
      email: 'admin1@ncc.id',
      password: '123456',
    });

    // Jika gagal login → coba daftarkan akun admin1 dulu
    if (signInResult.error) {
      console.log("[SA] Login gagal, coba daftar akun admin1...", signInResult.error.message);
      await authClient.auth.signUp({
        email: 'admin1@ncc.id',
        password: '123456',
        options: { data: { full_name: 'Admin NCC', username: 'admin1' } }
      });
      // Coba login lagi setelah daftar
      signInResult = await authClient.auth.signInWithPassword({
        email: 'admin1@ncc.id',
        password: '123456',
      });
    }

    console.log("[SA] Login admin1:", signInResult.error ? `GAGAL - ${signInResult.error.message}` : "BERHASIL");

    if (!signInResult.error) {
      const { data, error } = await authClient
        .from('competition_entries')
        .select('*')
        .neq('email', 'admin1@ncc.id')
        .order('created_at', { ascending: false });
      console.log("[SA] Login admin hasil:", data?.length ?? 0, "baris");
      if (!error) return { data: data || [], error: null };
    }

    // --- TAHAP 4: Last resort - query anonim (hanya berhasil jika RLS dinonaktifkan) ---
    const { data: anonData, error: anonError } = await authClient
      .from('competition_entries')
      .select('*')
      .order('created_at', { ascending: false });
    console.log("[SA] Anon query hasil:", anonData?.length ?? 0, "baris, error:", anonError?.message);
    return { data: anonData || [], error: anonError?.message || null };

  } catch (err: any) {
    console.error("[Server Action] Exception:", err);
    return { data: null, error: err.message || "Gagal mengambil data." };
  }
}

/** Mengambil list user yang sudah register (di profiles / auth.users) tapi belum memilih lomba */
export async function getUnregisteredUsers() {
  try {
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      console.warn("[SA] getUnregisteredUsers: Missing SUPABASE_SERVICE_ROLE_KEY. Falling back to anon client.");
    }

    // Gunakan service role client jika tersedia agar 100% bypass RLS, jika tidak gunakan anon client
    const client = serviceRoleKey
      ? createSupabaseClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        })
      : createSupabaseClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");

    // 1. Ambil semua entries dari competition_entries untuk disilang
    const { data: entries, error: entriesError } = await client
      .from('competition_entries')
      .select('user_id, email');

    if (entriesError) {
      console.error("[SA] Gagal mengambil competition_entries:", entriesError);
      return { data: [], error: entriesError.message };
    }

    const registeredUserIds = new Set<string>();
    const registeredEmails = new Set<string>();

    entries?.forEach(entry => {
      if (entry.user_id) registeredUserIds.add(entry.user_id);
      if (entry.email) registeredEmails.add(entry.email.toLowerCase().trim());
    });

    // 2. Ambil semua profiles
    const { data: profiles, error: profilesError } = await client
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error("[SA] Gagal mengambil profiles:", profilesError);
      return { data: [], error: profilesError.message };
    }

    // 3. Ambil data auth users dari admin list jika service role tersedia
    let authUsers: any[] = [];
    if (serviceRoleKey) {
      try {
        const { data: authData, error: authError } = await client.auth.admin.listUsers();
        if (!authError && authData?.users) {
          authUsers = authData.users;
        }
      } catch (err) {
        console.warn("[SA] Gagal melist auth users dari admin API:", err);
      }
    }

    const adminEmails = ["admin@ncc.id", "admin1@ncc.id", "halo.ncc@gmail.com"];
    const unregisteredMap = new Map<string, any>();

    // Masukkan data dari auth users terlebih dahulu
    authUsers.forEach(user => {
      const email = user.email?.toLowerCase().trim() || "";
      if (adminEmails.includes(email)) return; // Lewati admin

      const hasUserId = registeredUserIds.has(user.id);
      const hasEmail = registeredEmails.has(email);

      if (!hasUserId && !hasEmail) {
        unregisteredMap.set(user.id, {
          id: user.id,
          email: user.email || "",
          fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || "User Tanpa Nama",
          username: user.user_metadata?.username || "-",
          school: "-",
          phone: "-",
          createdAt: user.created_at || new Date().toISOString(),
          password: user.user_metadata?.custom_password || "-",
        });
      }
    });

    // Perkaya atau tambahkan data dari tabel profiles
    profiles?.forEach(profile => {
      const hasUserId = registeredUserIds.has(profile.id);
      const emailFromMeta = (profile as any).email || "";
      const hasEmail = emailFromMeta ? registeredEmails.has(emailFromMeta.toLowerCase().trim()) : false;

      if (!hasUserId && !hasEmail) {
        const existing = unregisteredMap.get(profile.id);
        if (existing) {
          // Update data yang ada dengan data profile yang lebih lengkap
          unregisteredMap.set(profile.id, {
            ...existing,
            fullName: profile.full_name || existing.fullName,
            username: profile.username || existing.username,
            school: (profile as any).school || existing.school,
            phone: (profile as any).phone || existing.phone,
            createdAt: (profile as any).created_at || existing.createdAt,
          });
        } else {
          // check email jika profiles ada email atau coba cari di authUsers jika ada
          const matchingAuth = authUsers.find(u => u.id === profile.id);
          const email = matchingAuth?.email || (profile as any).email || "";
          
          if (email && adminEmails.includes(email.toLowerCase().trim())) return; // Lewati admin
          if (email && registeredEmails.has(email.toLowerCase().trim())) return; // Lewati jika email sudah mendaftar

          unregisteredMap.set(profile.id, {
            id: profile.id,
            email: email,
            fullName: profile.full_name || "User Tanpa Nama",
            username: profile.username || "-",
            school: (profile as any).school || "-",
            phone: (profile as any).phone || "-",
            createdAt: (profile as any).created_at || new Date().toISOString(),
            password: matchingAuth?.user_metadata?.custom_password || "-",
          });
        }
      }
    });

    // Ubah ke array dan urutkan berdasarkan waktu registrasi terbaru
    const result = Array.from(unregisteredMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return { data: result, error: null };
  } catch (err: any) {
    console.error("[Server Action] Exception getUnregisteredUsers:", err);
    return { data: [], error: err.message || "Gagal mengambil data." };
  }
}

