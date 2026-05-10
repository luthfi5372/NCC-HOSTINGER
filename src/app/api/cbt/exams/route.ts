/**
 * ============================================================================
 * API Route: /api/cbt/exams
 * ============================================================================
 * Endpoint untuk manajemen Sesi Ujian CBT.
 * - GET:    Ambil semua sesi ujian
 * - POST:   Buat sesi ujian baru
 * - PATCH:  Toggle status aktif/nonaktif
 * - DELETE:  Hapus sesi ujian (CASCADE ke soal & attempt)
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET() {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('cbt_exams')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      count: data?.length || 0
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal mengambil data sesi ujian.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const supabase = createClient();

  if (!body.title || !body.token) {
    return NextResponse.json(
      { error: 'Judul sesi dan token akses wajib diisi.' },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('cbt_exams')
      .insert([{
        title: body.title,
        token: body.token,
        duration_minutes: body.duration_minutes || 90,
        scoring_system: body.scoring_system || 'Custom',
        correct_point: body.correct_point || 4,
        penalty_point: body.penalty_point || 0,
        empty_point: body.empty_point || 0,
        is_active: body.is_active || false
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Sesi ujian "${data.title}" berhasil dibuat.`,
      data
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal membuat sesi ujian.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const supabase = createClient();

  if (!body.id) {
    return NextResponse.json(
      { error: 'Parameter id (exam_id) wajib diisi.' },
      { status: 400 }
    );
  }

  try {
    const updates: any = {};
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.title) updates.title = body.title;
    if (body.token) updates.token = body.token;
    if (body.duration_minutes) updates.duration_minutes = body.duration_minutes;

    const { data, error } = await supabase
      .from('cbt_exams')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Sesi ujian berhasil diperbarui.`,
      data
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal memperbarui sesi ujian.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const examId = searchParams.get('id');

  if (!examId) {
    return NextResponse.json(
      { error: 'Parameter id (exam_id) wajib diisi.' },
      { status: 400 }
    );
  }

  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('cbt_exams')
      .delete()
      .eq('id', examId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Sesi ujian dan semua data terkait berhasil dihapus.'
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal menghapus sesi ujian.' },
      { status: 500 }
    );
  }
}
