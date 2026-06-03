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
    // Fetch attempt details and exam details
    const { data: attempt, error: attemptErr } = await supabase
      .from('cbt_attempts')
      .select('*, cbt_exams(*)')
      .eq('id', body.attempt_id)
      .single();

    if (attemptErr || !attempt) {
      return NextResponse.json(
        { error: attemptErr?.message || "Sesi ujian peserta tidak ditemukan." },
        { status: 404 }
      );
    }

    const exam = attempt.cbt_exams;
    const scoringSystem = exam?.scoring_system || 'Fixed';
    const fixedCorrectPoint = exam?.correct_point || 4;
    const penaltyPoint = exam?.penalty_point || 0;
    const emptyPoint = exam?.empty_point || 0;

    // Ambil semua jawaban peserta
    const { data: answers, error: ansError } = await supabase
      .from('cbt_answers')
      .select('question_id, selected_option')
      .eq('attempt_id', body.attempt_id);
    if (ansError) throw ansError;

    // Ambil semua soal dari bank soal yang diterbitkan untuk menghitung total & unanswered
    const { data: allQuestions, error: qAllErr } = await supabase
      .from('cbt_questions')
      .select('id, correct_answer, weight')
      .eq('exam_id', exam.id)
      .eq('status', 'Published');
    if (qAllErr) throw qAllErr;

    const totalQuestionsCount = allQuestions?.length || 0;

    // Buat lookup map
    const keyMap = new Map<string, { correct_answer: string; weight: number }>();
    (allQuestions || []).forEach(q => keyMap.set(q.id, q));

    let totalEarned = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let answeredQuestionsCount = 0;

    if (answers && answers.length > 0) {
      answers.forEach(answer => {
        const key = keyMap.get(answer.question_id);
        if (!key) return;

        if (answer.selected_option && answer.selected_option !== "") {
          answeredQuestionsCount++;
          const isCorrect = answer.selected_option === key.correct_answer;

          if (isCorrect) {
            correctCount++;
            switch (scoringSystem) {
              case 'Fixed':
                totalEarned += fixedCorrectPoint;
                break;
              case 'Custom':
                totalEarned += key.weight;
                break;
              case 'Penalty':
                totalEarned += fixedCorrectPoint;
                break;
            }
          } else {
            wrongCount++;
            if (scoringSystem === 'Penalty') {
              totalEarned += penaltyPoint < 0 ? penaltyPoint : -penaltyPoint;
            }
          }
        }
      });
    }

    const unanswered = totalQuestionsCount - answeredQuestionsCount;
    if (emptyPoint !== 0) {
      totalEarned += (unanswered * emptyPoint);
    }

    // Hitung skor akhir (floor di 0)
    const finalScore = Math.max(0, Math.round(totalEarned * 100) / 100);

    // Update di database
    const { error: updateError } = await supabase
      .from('cbt_attempts')
      .update({
        final_score: finalScore,
        status: 'submitted',
        finished_at: new Date().toISOString()
      })
      .eq('id', body.attempt_id);

    if (updateError) throw updateError;

    score = finalScore;
    usedRpc = false;

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
