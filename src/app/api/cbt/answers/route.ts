/**
 * ============================================================================
 * API Route: /api/cbt/answers
 * ============================================================================
 * Endpoint untuk Auto-Save jawaban peserta & Submit + Auto-Grading.
 * - POST:  Auto-save jawaban (single atau batch dari localStorage sync)
 * - PATCH: Submit ujian & trigger auto-grading
 * - GET:   Fetch jawaban tersimpan (untuk state recovery setelah disconnect)
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

/**
 * GET /api/cbt/answers?attempt_id=xxx
 * State Recovery: Ambil semua jawaban yang sudah tersimpan di database.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const attemptId = searchParams.get('attempt_id');

  if (!attemptId) {
    return NextResponse.json(
      { error: 'Parameter attempt_id wajib diisi.' },
      { status: 400 }
    );
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('cbt_answers')
      .select('question_id, selected_option, saved_at')
      .eq('attempt_id', attemptId);

    if (error) throw error;

    // Transform ke format map untuk kemudahan frontend
    const answersMap: Record<string, string> = {};
    data?.forEach(a => {
      answersMap[a.question_id] = a.selected_option;
    });

    return NextResponse.json({
      success: true,
      data: answersMap,
      rawData: data,
      count: data?.length || 0
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal mengambil jawaban tersimpan.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cbt/answers
 * Auto-Save: Simpan jawaban peserta secara instan.
 * Mendukung single answer atau batch (array) dari localStorage sync.
 * 
 * Body (single):  { attempt_id, question_id, selected_option }
 * Body (batch):   [{ attempt_id, question_id, selected_option }, ...]
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const supabase = createClient();

  const answers = Array.isArray(body) ? body : [body];

  // Validasi
  for (const a of answers) {
    if (!a.attempt_id || !a.question_id || !a.selected_option) {
      return NextResponse.json(
        { error: 'Setiap jawaban wajib memiliki attempt_id, question_id, dan selected_option.' },
        { status: 400 }
      );
    }
  }

  try {
    const payload = answers.map(a => ({
      attempt_id: a.attempt_id,
      question_id: a.question_id,
      selected_option: a.selected_option
    }));

    const { error } = await supabase
      .from('cbt_answers')
      .upsert(payload, { onConflict: 'attempt_id,question_id' });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `${payload.length} jawaban berhasil disimpan.`,
      saved_count: payload.length,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal menyimpan jawaban.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cbt/answers
 * Submit & Auto-Grade: Finalisasi ujian dan kalkulasi skor otomatis.
 * 
 * Body: { attempt_id }
 */
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const supabase = createClient();

  if (!body.attempt_id) {
    return NextResponse.json(
      { error: 'Parameter attempt_id wajib diisi.' },
      { status: 400 }
    );
  }

  try {
    // 1. Coba panggil fungsi SQL server-side untuk kalkulasi
    let score = 0;
    let usedRpc = false;

    try {
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('calculate_cbt_score', { p_attempt_id: body.attempt_id });
      
      if (!rpcError && rpcResult !== null) {
        score = rpcResult;
        usedRpc = true;
      }
    } catch {
      // RPC tidak tersedia, fallback ke kalkulasi client-side
    }

    // 2. Fallback: Hitung manual di API route
    if (!usedRpc) {
      // Ambil semua jawaban peserta
      const { data: answers, error: ansError } = await supabase
        .from('cbt_answers')
        .select('question_id, selected_option')
        .eq('attempt_id', body.attempt_id);
      if (ansError) throw ansError;

      if (answers && answers.length > 0) {
        // Ambil kunci jawaban & bobot
        const questionIds = answers.map(a => a.question_id);
        const { data: questions, error: qError } = await supabase
          .from('cbt_questions')
          .select('id, correct_answer, weight')
          .in('id', questionIds);
        if (qError) throw qError;

        const qMap = new Map(questions?.map(q => [q.id, q]) || []);
        let totalWeight = 0;
        let earnedWeight = 0;

        answers.forEach(ans => {
          const q = qMap.get(ans.question_id);
          if (q) {
            totalWeight += q.weight;
            if (ans.selected_option === q.correct_answer) {
              earnedWeight += q.weight;
            }
          }
        });

        score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100 * 100) / 100 : 0;

        // Update di database
        await supabase
          .from('cbt_attempts')
          .update({
            final_score: score,
            status: 'submitted',
            finished_at: new Date().toISOString()
          })
          .eq('id', body.attempt_id);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Ujian berhasil disubmit dan dinilai!',
      score,
      grading_method: usedRpc ? 'server_rpc' : 'client_fallback',
      submitted_at: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal memproses submit & penilaian.' },
      { status: 500 }
    );
  }
}
