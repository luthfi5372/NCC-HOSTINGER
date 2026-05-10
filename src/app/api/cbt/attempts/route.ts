/**
 * ============================================================================
 * API Route: /api/cbt/attempts
 * ============================================================================
 * Endpoint untuk manajemen sesi peserta & proctoring.
 * - GET:    Fetch semua attempt aktif (untuk admin monitoring)
 * - POST:   Mulai sesi ujian baru (atau resume yang sudah ada)
 * - PATCH:  Update status / tambah proctoring warning
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

/**
 * GET /api/cbt/attempts?exam_id=xxx
 * Admin: Fetch semua peserta yang sedang/sudah mengerjakan ujian.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const examId = searchParams.get('exam_id');

  if (!examId) {
    return NextResponse.json(
      { error: 'Parameter exam_id wajib diisi.' },
      { status: 400 }
    );
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('cbt_attempts')
      .select('*')
      .eq('exam_id', examId)
      .order('started_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      count: data?.length || 0,
      active: data?.filter(a => a.status === 'ongoing').length || 0
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal mengambil data sesi peserta.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cbt/attempts
 * Peserta: Mulai sesi ujian baru atau resume jika sudah ada.
 * 
 * Body: { user_id, exam_id, token }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const supabase = createClient();

  if (!body.user_id || !body.exam_id) {
    return NextResponse.json(
      { error: 'Parameter user_id dan exam_id wajib diisi.' },
      { status: 400 }
    );
  }

  try {
    // Validasi: Pastikan ujian aktif
    const { data: exam, error: examError } = await supabase
      .from('cbt_exams')
      .select('is_active, token')
      .eq('id', body.exam_id)
      .single();

    if (examError) throw examError;
    if (!exam?.is_active) {
      return NextResponse.json(
        { error: 'Sesi ujian ini belum diaktifkan oleh panitia.' },
        { status: 403 }
      );
    }

    // Validasi token (opsional, jika dikirim oleh frontend)
    if (body.token && exam.token !== body.token) {
      return NextResponse.json(
        { error: 'Token akses ujian tidak valid.' },
        { status: 403 }
      );
    }

    // Cek apakah sudah punya attempt
    const { data: existing } = await supabase
      .from('cbt_attempts')
      .select('*')
      .eq('user_id', body.user_id)
      .eq('exam_id', body.exam_id)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Sesi ujian dilanjutkan (state recovery).',
        data: existing,
        is_resume: true
      });
    }

    // Buat attempt baru
    const { data, error } = await supabase
      .from('cbt_attempts')
      .insert([{
        user_id: body.user_id,
        exam_id: body.exam_id
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Sesi ujian dimulai. Selamat mengerjakan!',
      data,
      is_resume: false
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal memulai sesi ujian.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cbt/attempts
 * Proctoring: Tambah warning atau update status attempt.
 * 
 * Body: { attempt_id, action: 'add_warning' | 'disqualify' | 'override_score', score? }
 */
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const supabase = createClient();

  if (!body.attempt_id || !body.action) {
    return NextResponse.json(
      { error: 'Parameter attempt_id dan action wajib diisi.' },
      { status: 400 }
    );
  }

  try {
    switch (body.action) {
      case 'add_warning': {
        // Ambil warning count saat ini
        const { data: attempt, error: fetchErr } = await supabase
          .from('cbt_attempts')
          .select('warnings_count')
          .eq('id', body.attempt_id)
          .single();
        if (fetchErr) throw fetchErr;

        const newCount = (attempt?.warnings_count || 0) + 1;
        const isDisqualified = newCount >= 3;
        const updates: any = { warnings_count: newCount };
        if (isDisqualified) {
          updates.status = 'disqualified';
          updates.finished_at = new Date().toISOString();
        }

        const { error: updateErr } = await supabase
          .from('cbt_attempts')
          .update(updates)
          .eq('id', body.attempt_id);
        if (updateErr) throw updateErr;

        return NextResponse.json({
          success: true,
          message: isDisqualified
            ? `Peserta didiskualifikasi setelah ${newCount} pelanggaran.`
            : `Peringatan proctoring ke-${newCount} dicatat.`,
          warnings: newCount,
          disqualified: isDisqualified
        });
      }

      case 'disqualify': {
        const { error } = await supabase
          .from('cbt_attempts')
          .update({ status: 'disqualified', finished_at: new Date().toISOString() })
          .eq('id', body.attempt_id);
        if (error) throw error;

        return NextResponse.json({
          success: true,
          message: 'Peserta berhasil didiskualifikasi oleh admin.'
        });
      }

      case 'override_score': {
        if (body.score === undefined) {
          return NextResponse.json(
            { error: 'Parameter score wajib diisi untuk override.' },
            { status: 400 }
          );
        }

        const { error } = await supabase
          .from('cbt_attempts')
          .update({ final_score: body.score })
          .eq('id', body.attempt_id);
        if (error) throw error;

        return NextResponse.json({
          success: true,
          message: `Skor peserta berhasil di-override menjadi ${body.score}.`
        });
      }

      default:
        return NextResponse.json(
          { error: `Action "${body.action}" tidak dikenali.` },
          { status: 400 }
        );
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal memproses aksi proctoring.' },
      { status: 500 }
    );
  }
}
