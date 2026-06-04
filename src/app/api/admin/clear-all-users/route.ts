import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return NextResponse.json({ error: "Service role key missing on server environment." }, { status: 500 });
  }

  try {
    const serviceClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Ambil semua baris di competition_entries
    const { data: entries, error: fetchError } = await serviceClient
      .from('competition_entries')
      .select('id, user_id, email, full_name');

    if (fetchError) throw fetchError;

    let successCount = 0;
    let failCount = 0;
    const details = [];

    // 2. Loop dan hapus dari auth.users & competition_entries
    for (const entry of (entries || [])) {
      const emailLower = entry.email?.toLowerCase();
      // Proteksi akun admin penting agar tidak ikut terhapus
      if (emailLower === 'admin1@ncc.id' || emailLower === 'admin@ncc.id' || emailLower === 'halo.ncc@gmail.com') {
        continue;
      }

      try {
        // Hapus akun dari auth.users
        if (entry.user_id) {
          const { error: authError } = await serviceClient.auth.admin.deleteUser(entry.user_id);
          if (authError) {
            console.error(`Gagal menghapus user auth ${entry.user_id}:`, authError.message);
          }
        }

        // Hapus baris pendaftaran kompetisi
        const { error: dbError } = await serviceClient
          .from('competition_entries')
          .delete()
          .eq('id', entry.id);

        if (dbError) throw dbError;

        successCount++;
        details.push({ email: entry.email, status: 'deleted' });
      } catch (err: any) {
        failCount++;
        details.push({ email: entry.email, status: 'failed', error: err.message || err });
      }
    }

    // 3. Sapu bersih akun di auth.users yang mungkin tertinggal (tidak terdaftar di competition_entries)
    const { data: listData, error: listUsersError } = await serviceClient.auth.admin.listUsers();
    if (!listUsersError && listData && listData.users) {
      for (const u of listData.users) {
        const emailLower = u.email?.toLowerCase();
        if (emailLower === 'admin1@ncc.id' || emailLower === 'admin@ncc.id' || emailLower === 'halo.ncc@gmail.com') {
          continue;
        }
        try {
          await serviceClient.auth.admin.deleteUser(u.id);
        } catch (e) {}
      }
    }

    return NextResponse.json({
      message: "Database pendaftaran & akun user berhasil dibersihkan total!",
      successCount,
      failCount,
      details
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || err }, { status: 500 });
  }
}
