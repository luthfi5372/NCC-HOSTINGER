import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    const { cleanData } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    // 1. Cari data lama
    const { data: existing } = await supabase
      .from('announcements')
      .select('id')
      .eq('title', 'SYSTEM_TIMELINE_CONFIG')
      .single();

    if (existing) {
      // 2. Update
      const { error: updateError } = await supabase
        .from('announcements')
        .update({ content: JSON.stringify(cleanData) })
        .eq('id', existing.id);
      if (updateError) throw updateError;
    } else {
      // 3. Insert
      const { error: insertError } = await supabase
        .from('announcements')
        .insert([{ 
          title: 'SYSTEM_TIMELINE_CONFIG', 
          content: JSON.stringify(cleanData),
          target_audience: 'All'
        }]);
      if (insertError) throw insertError;
    }

    // ⚡ KUNCI UTAMA: Hapus cache dashboard user secara instan!
    revalidatePath('/dashboard');
    revalidatePath('/hq');

    return NextResponse.json({ message: 'Sync Success' });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
