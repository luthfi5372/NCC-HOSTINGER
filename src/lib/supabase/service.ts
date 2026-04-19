import { createClient } from './client';
import { submitCompetitionEntry } from '@/lib/localAuth';

export type CompetitionEntry = {
  fullName: string;
  email: string;
  phone: string;
  school: string;
  city: string;
  category: string;
  teamSize: string;
  notes: string;
  paymentStatus?: "Wait" | "Verified" | "Paid" | "None";
};

export async function submitCompetitionEntryToSupabase(entry: CompetitionEntry, userId?: string) {
  const supabase = createClient();
  
  // Check if Supabase is configured
  const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholder) {
    console.warn("Supabase not configured. Pure Supabase Mode enforcing rejection.");
    return { 
      data: null, 
      error: { message: "Database Supabase belum terkonfigurasi pada env variables." } 
    };
  }


  try {
    // [ADD] Kill Switch Check
    const { data: settings } = await supabase.from('site_settings').select('is_registration_open').eq('id', 1).single();
    if (settings && !settings.is_registration_open) {
      return { data: null, error: { message: "Pendaftaran NCC ke-13 saat ini sedang ditutup." }};
    }

    const { data, error } = await supabase
      .from('competition_entries')
      .insert([
        {
          full_name: entry.fullName,
          email: entry.email,
          phone: entry.phone,
          school: entry.school,
          city: entry.city,
          category: entry.category,
          team_size: entry.teamSize,
          notes: entry.notes,
          user_id: userId // CRITICAL: Fix for RLS Violation 42501
        }
      ])
      .select();

    if (error) {
      console.error("Supabase insert error details:", error);
      throw error;
    }
    return { data, error: null };
  } catch (err: any) {
    console.error("Supabase interaction failed:", err);
    // Explicitly check for RLS violation to inform the developer
    if (err.code === "42501") {
      console.error("CRITICAL: RLS Policy violation detected. Check Supabase 'competition_entries' insert policy.");
      return { data: null, error: { message: "Gagal: Akses Ditolak (RLS Policy). Pastikan sesi aktif." }};
    }
    
    return { 
      data: null, 
      error: { message: err.message || "Gagal menyimpan data ke server." } 
    };
  }
}


/** 
 * NEW: Hybrid fetcher that merges Supabase data with Local Storage data.
 * This is the critical fix for "Integration to ALL data".
 */
export async function fetchHybridEntries(email: string) {
  const supabase = createClient();
  let supabaseEntries: any[] = [];
  
  // 1. Try Supabase
  try {
    const { data } = await supabase
      .from('competition_entries')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false });
    supabaseEntries = data || [];
  } catch (err) {
    console.error("Supabase fetch failed, using local only:", err);
  }

  // 2. Try Local
  let localEntries: any[] = [];
  if (typeof window !== "undefined") {
    try {
      const { getCompetitionEntries } = await import('@/lib/localAuth');
      localEntries = getCompetitionEntries(email);
    } catch (err) {
      console.error("Local fetch failed:", err);
    }
  }

  // 3. Merge (Simple deduplication by category if both exist)
  const combined = [...supabaseEntries];
  localEntries.forEach(local => {
    const exists = combined.find(s => s.category === local.category);
    if (!exists) combined.push(local);
  });

  return { data: combined, error: null };
}

/** 
 * NEW: Hybrid fetcher for Admin to see EVERYTHING.
 */
export async function fetchAllEntriesHybrid() {
  const supabase = createClient();
  let supabaseEntries: any[] = [];
  
  try {
    const { data } = await supabase
      .from('competition_entries')
      .select('*')
      .order('created_at', { ascending: false });
    supabaseEntries = data || [];
  } catch (err) {
    console.error("Admin Supabase fetch failed:", err);
  }

  let localEntries: any[] = [];
  if (typeof window !== "undefined") {
    try {
      const { getAllCompetitionEntries } = await import('@/lib/localAuth');
      localEntries = getAllCompetitionEntries();
    } catch (err) {
      console.error("Admin Local fetch failed:", err);
    }
  }

  // Merge entries
  const combined = [...supabaseEntries];
  localEntries.forEach(local => {
    // Avoid duplicates if a user registered on both (rare but possible in hybrid mode)
    const exists = combined.find(s => s.email === local.email && s.category === local.category);
    if (!exists) combined.push(local);
  });

  return combined;
}

export async function getSupabaseStats() {
  const supabase = createClient();
  
  try {
    // 1. Get total entries count
    const { count: totalEntries, error: countError } = await supabase
      .from('competition_entries')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // 2. Get category distribution
    const { data: categories, error: catError } = await supabase
      .from('competition_entries')
      .select('category');

    if (catError) throw catError;

    const breakdown: Record<string, number> = {
      "Olimpiade MIPA": 0,
      "Speech Contest": 0,
      "LKTI Nasional": 0,
      "MTQ Nasional": 0
    };

    categories?.forEach(item => {
      if (breakdown[item.category] !== undefined) {
        breakdown[item.category]++;
      }
    });

    return {
      totalEntries: totalEntries || 0,
      breakdown
    };
  } catch (err) {
    console.error("Failed to fetch Supabase stats:", err);
    return null;
  }
}

export async function getLatestSupabaseLogs(limit = 5) {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('competition_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Failed to fetch logs:", err);
    return [];
  }
}

/** Mengambil semua pendaftaran berdasarkan email user dari Supabase */
export async function fetchCompetitionEntries(email: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('competition_entries')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error("Fetch entries error:", err);
    return { data: null, error: err.message };
  }
}

/** Mengambil profil profesional (sekolah, phone) dari tabel profiles */
export async function fetchProfile(userId: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error("Fetch profile error:", err);
    return { data: null, error: err.message };
  }
}

/** Memperbarui profil profesional (sekolah, phone) ke tabel profiles */
export async function updateProfileInSupabase(userId: string, updates: any) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        school: updates.school,
        phone: updates.phone,
        full_name: updates.fullName, // Sync full_name as well
      })
      .eq('id', userId)
      .select();
    
    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error("Update profile error:", err);
    return { data: null, error: err.message };
  }
}

/** TAHAP 5.A: Update Payment Status directly to Supabase */
export async function adminUpdatePaymentStatusToSupabase(entryId: number | string, status: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('competition_entries')
      .update({ payment_status: status })
      .eq('id', entryId)
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error("Supabase Admin Update Error:", err);
    return { success: false, error: err.message || "Gagal mengubah status." };
  }
}

/** TAHAP 8: Update Attendance via QR Scanner */
export async function adminMarkAttendance(entryId: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('competition_entries')
      .update({ is_attended: true })
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error("Attendance Scan Error:", err);
    return { success: false, error: err.message || "Gagal mencatat kehadiran." };
  }
}

/** HQ MODULE: Site Settings Management */
export async function fetchSiteSettings() {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error("Fetch settings error:", err);
    return { data: null, error: err.message };
  }
}

export async function updateSiteSettings(updates: any) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .update(updates)
      .eq('id', 1)
      .select();
    
    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error("Update settings error:", err);
    return { data: null, error: err.message };
  }
}

/** HQ MODULE: Dynamic Participant Update */
export async function adminUpdateCompetitionEntry(id: string | number, entry: any) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('competition_entries')
      .update({
        full_name: entry.fullName,
        email: entry.email,
        phone: entry.phone,
        school: entry.school,
        city: entry.city,
        category: entry.category,
        team_size: entry.teamSize,
        notes: entry.notes,
        payment_status: entry.payment_status || entry.paymentStatus,
        is_attended: entry.is_attended
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error("Admin Update Entry Error:", err);
    return { success: false, error: err.message || "Gagal memperbarui data." };
  }
}



