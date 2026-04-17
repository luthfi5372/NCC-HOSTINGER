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

export async function submitCompetitionEntryToSupabase(entry: CompetitionEntry) {
  const supabase = createClient();
  
  // Check if Supabase is configured
  const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (isPlaceholder) {
    console.warn("Supabase not configured. Falling back to Local Storage.");
    const result = submitCompetitionEntry({
      ...entry,
      paymentStatus: entry.paymentStatus || "None"
    });
    return { 
      data: result.success ? [entry] : null, 
      error: result.success ? null : { message: result.error || "Gagal menyimpan data lokal." } 
    };
  }

  try {
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
        }
      ])
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error("Supabase interaction failed, falling back to local:", err);
    const result = submitCompetitionEntry({
      ...entry,
      paymentStatus: entry.paymentStatus || "None"
    });
    return { 
      data: result.success ? [entry] : null, 
      error: result.success ? null : { message: "Gagal menyimpan data." } 
    };
  }
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
