// File: app/api/admin/llms/grading/route.ts
// ============================================================================
// API ADMIN: Kalkulator Penilai Otomatis (Auto-Grading Engine)
// ============================================================================
// Sistem penilaian fleksibel yang mendukung 3 mode:
//   1. Fixed:   Semua soal bernilai sama (+4 poin per benar)
//   2. Custom:  Setiap soal punya bobot berbeda (dari kolom weight)
//   3. Penalty: Benar mendapat poin, salah dikenai penalti minus
// ============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/llms/grading
 * Menghitung skor akhir peserta berdasarkan jawaban yang tersimpan.
 * 
 * Body: { "attempt_id": "uuid-dari-cbt_attempts" }
 * 
 * Alur kalkulasi:
 * 1. Ambil semua jawaban peserta dari cbt_answers
 * 2. Cocokkan dengan kunci jawaban di cbt_questions
 * 3. Hitung skor berdasarkan scoring_system ujian
 * 4. Update skor akhir di cbt_attempts
 */
export async function POST(request: Request) {
  try {
    const { attempt_id } = await request.json();

    if (!attempt_id) {
      return NextResponse.json(
        { success: false, error: "Parameter attempt_id wajib diisi." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // ── STEP 1: Ambil data attempt & konfigurasi ujian ──
    const { data: attempt, error: attemptErr } = await supabase
      .from('cbt_attempts')
      .select('*, cbt_exams(*)')
      .eq('id', attempt_id)
      .single();

    if (attemptErr || !attempt) {
      return NextResponse.json(
        { success: false, error: "Sesi ujian peserta tidak ditemukan." },
        { status: 404 }
      );
    }

    const exam = attempt.cbt_exams;
    const scoringSystem: string = exam?.scoring_system || 'Custom';
    const fixedCorrectPoint: number = exam?.correct_point || 4;
    const penaltyPoint: number = exam?.penalty_point || 0;
    const emptyPoint: number = exam?.empty_point || 0;

    // ── STEP 2: Ambil semua jawaban peserta ──
    const { data: answers, error: ansErr } = await supabase
      .from('cbt_answers')
      .select('question_id, selected_option')
      .eq('attempt_id', attempt_id);

    if (ansErr) throw ansErr;

    if (!answers || answers.length === 0) {
      // Peserta tidak menjawab sama sekali
      await supabase
        .from('cbt_attempts')
        .update({ final_score: 0, status: 'submitted', finished_at: new Date().toISOString() })
        .eq('id', attempt_id);

      return NextResponse.json({
        success: true,
        score: 0,
        detail: { correct: 0, wrong: 0, unanswered: 0, method: scoringSystem },
        message: "Peserta tidak menjawab satupun soal."
      });
    }

    // ── STEP 3: Ambil kunci jawaban & bobot dari bank soal ──
    const questionIds = answers.map(a => a.question_id);
    const { data: questions, error: qErr } = await supabase
      .from('cbt_questions')
      .select('id, correct_answer, weight')
      .in('id', questionIds);

    if (qErr) throw qErr;

    // Buat lookup map untuk O(1) access
    const keyMap = new Map<string, { correct_answer: string; weight: number }>();
    (questions || []).forEach(q => keyMap.set(q.id, q));

    // ── STEP 4: Hitung skor berdasarkan scoring_system ──
    let totalEarned = 0;
    let totalMaximum = 0;
    let correctCount = 0;
    let wrongCount = 0;

    // Hitung total bobot maksimum (semua soal dalam ujian, bukan hanya yang dijawab)
    const { data: allQuestions } = await supabase
      .from('cbt_questions')
      .select('weight')
      .eq('exam_id', exam.id)
      .eq('status', 'Published');

    const totalQuestionsCount = allQuestions?.length || 0;
    let answeredQuestionsCount = 0;

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
          // Penalty mode: kurangi poin untuk jawaban salah
          if (scoringSystem === 'Penalty') {
            totalEarned -= penaltyPoint;
          }
        }
      }
    });

    // Tambahkan empty point untuk soal yang tidak dijawab
    const unanswered = totalQuestionsCount - answeredQuestionsCount;
    if (emptyPoint !== 0) {
      totalEarned += (unanswered * emptyPoint);
    }

    // Hitung total bobot maksimum
    switch (scoringSystem) {
      case 'Fixed':
        totalMaximum = totalQuestionsCount * fixedCorrectPoint;
        break;
      case 'Custom':
        totalMaximum = (allQuestions || []).reduce((sum, q) => sum + (q.weight || 4), 0);
        break;
      case 'Penalty':
        totalMaximum = totalQuestionsCount * fixedCorrectPoint;
        break;
    }

    // Normalisasi ke skala 100, dengan floor 0 (tidak boleh minus)
    const normalizedScore = totalMaximum > 0
      ? Math.max(0, Math.round((totalEarned / totalMaximum) * 100 * 100) / 100)
      : 0;

    // ── STEP 5: Simpan skor akhir ke database ──
    const { error: updateErr } = await supabase
      .from('cbt_attempts')
      .update({
        final_score: normalizedScore,
        status: 'submitted',
        finished_at: new Date().toISOString()
      })
      .eq('id', attempt_id);

    if (updateErr) throw updateErr;

    // ── STEP 6: Kembalikan hasil lengkap ──

    return NextResponse.json({
      success: true,
      score: normalizedScore,
      detail: {
        correct: correctCount,
        wrong: wrongCount,
        unanswered,
        total_questions: totalQuestionsCount,
        raw_earned: totalEarned,
        raw_maximum: totalMaximum,
        method: scoringSystem,
        penalty_applied: scoringSystem === 'Penalty' ? wrongCount * penaltyPoint : 0
      },
      message: `Penilaian selesai dengan metode ${scoringSystem}. Skor: ${normalizedScore}/100`
    });

  } catch (error: any) {
    console.error("GAGAL MENILAI:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Terjadi kesalahan pada proses penilaian." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/llms/grading?exam_id=xxx
 * Mengambil leaderboard/ranking peserta untuk sesi ujian tertentu.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('exam_id');

    if (!examId) {
      return NextResponse.json(
        { success: false, error: "Parameter exam_id wajib diisi." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('cbt_attempts')
      .select('*')
      .eq('exam_id', examId)
      .in('status', ['submitted', 'disqualified'])
      .order('final_score', { ascending: false });

    if (error) throw error;

    // Tambahkan ranking
    const ranked = (data || []).map((item, idx) => ({
      ...item,
      rank: idx + 1,
      passed: item.final_score >= 70 // Passing grade standar olimpiade
    }));

    return NextResponse.json({
      success: true,
      data: ranked,
      stats: {
        total_participants: ranked.length,
        passed: ranked.filter(r => r.passed).length,
        failed: ranked.filter(r => !r.passed).length,
        disqualified: ranked.filter(r => r.status === 'disqualified').length,
        average_score: ranked.length > 0
          ? Math.round(ranked.reduce((sum, r) => sum + r.final_score, 0) / ranked.length * 100) / 100
          : 0
      }
    });

  } catch (error: any) {
    console.error("GAGAL AMBIL RANKING:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil data ranking." },
      { status: 500 }
    );
  }
}
