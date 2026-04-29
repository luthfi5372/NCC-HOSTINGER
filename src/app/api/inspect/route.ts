import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET() {
  const supabase = createClient();
  const { data } = await supabase.from('site_settings').select('*').eq('id', 1).single();
  return NextResponse.json({ keys: Object.keys(data || {}), data });
}
