/**
 * ============================================================================
 * NCC 13th - CBT Olimpiade MIPA: Service Layer (Database Operations)
 * ============================================================================
 * Modul ini menangani semua operasi CRUD ke tabel CBT di Supabase.
 * Digunakan oleh API Routes dan komponen Admin untuk mengelola:
 * - Bank Soal (cbt_questions)
 * - Sesi Ujian (cbt_exams)
 * - Auto-Save Jawaban (cbt_answers)
 * - Kalkulasi & Penilaian (cbt_attempts)
 * ============================================================================
 */

import { createClient } from './client';

// ============================================================================
// TYPE DEFINITIONS (TypeScript Strict Mode)
// ============================================================================

export type CbtExam = {
  id?: string;
  title: string;
  token: string;
  duration_minutes: number;
  scoring_system: 'Fixed' | 'Custom' | 'Penalty';
  correct_point: number;
  penalty_point: number;
  is_active: boolean;
  created_at?: string;
};

export type CbtQuestion = {
  id?: string;
  exam_id: string;
  question_text: string;
  options: Record<string, string>; // {"A": "...", "B": "...", "C": "...", "D": "...", "E": "..."}
  correct_answer: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  weight: number;
  image_url?: string;
  status: 'Published' | 'Draft';
  created_at?: string;
};

export type CbtAttempt = {
  id?: string;
  user_id: string;
  exam_id: string;
  status: 'ongoing' | 'submitted' | 'timeout' | 'disqualified';
  final_score: number;
  warnings_count: number;
  started_at?: string;
  finished_at?: string;
};

export type CbtAnswer = {
  id?: string;
  attempt_id: string;
  question_id: string;
  selected_option: string;
  saved_at?: string;
};

// ============================================================================
// 1. EXAM MANAGEMENT (Manajemen Sesi Ujian)
// ============================================================================

/** Fetch semua sesi ujian */
export async function fetchCbtExams(): Promise<{ data: CbtExam[] | null; error: string | null }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('cbt_exams')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error('[CBT] Fetch exams error:', err);
    return { data: null, error: err.message };
  }
}

/** Buat sesi ujian baru */
export async function createCbtExam(exam: Omit<CbtExam, 'id' | 'created_at'>): Promise<{ data: CbtExam | null; error: string | null }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('cbt_exams')
      .insert([exam])
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error('[CBT] Create exam error:', err);
    return { data: null, error: err.message };
  }
}

/** Toggle status aktif/nonaktif sesi ujian */
export async function toggleCbtExamStatus(examId: string, isActive: boolean): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from('cbt_exams')
      .update({ is_active: isActive })
      .eq('id', examId);
    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    console.error('[CBT] Toggle exam status error:', err);
    return { success: false, error: err.message };
  }
}

/** Hapus sesi ujian beserta semua soal terkait (CASCADE) */
export async function deleteCbtExam(examId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from('cbt_exams')
      .delete()
      .eq('id', examId);
    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    console.error('[CBT] Delete exam error:', err);
    return { success: false, error: err.message };
  }
}

// ============================================================================
// 2. QUESTION MANAGEMENT (Manajemen Bank Soal MIPA)
// ============================================================================

/** Fetch semua soal untuk sesi ujian tertentu */
export async function fetchCbtQuestions(examId: string): Promise<{ data: CbtQuestion[] | null; error: string | null }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('cbt_questions')
      .select('*')
      .eq('exam_id', examId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error('[CBT] Fetch questions error:', err);
    return { data: null, error: err.message };
  }
}

/** Simpan soal baru ke bank soal */
export async function createCbtQuestion(question: Omit<CbtQuestion, 'id' | 'created_at'>): Promise<{ data: CbtQuestion | null; error: string | null }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('cbt_questions')
      .insert([question])
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error('[CBT] Create question error:', err);
    return { data: null, error: err.message };
  }
}

/** Simpan banyak soal sekaligus (batch insert) */
export async function batchCreateCbtQuestions(questions: Omit<CbtQuestion, 'id' | 'created_at'>[]): Promise<{ data: CbtQuestion[] | null; error: string | null }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('cbt_questions')
      .insert(questions)
      .select();
    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error('[CBT] Batch create questions error:', err);
    return { data: null, error: err.message };
  }
}

/** Hapus soal dari bank soal */
export async function deleteCbtQuestion(questionId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from('cbt_questions')
      .delete()
      .eq('id', questionId);
    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    console.error('[CBT] Delete question error:', err);
    return { success: false, error: err.message };
  }
}

/** Update bobot (weight) seluruh soal dalam 1 ujian sekaligus */
export async function updateAllQuestionsWeight(examId: string, weight: number): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from('cbt_questions')
      .update({ weight })
      .eq('exam_id', examId);
    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    console.error('[CBT] Update all weights error:', err);
    return { success: false, error: err.message };
  }
}

// ============================================================================
// 3. ATTEMPT MANAGEMENT (Sesi Peserta & Proctoring)
// ============================================================================

/** Mulai sesi ujian baru untuk peserta */
export async function startCbtAttempt(userId: string, examId: string): Promise<{ data: CbtAttempt | null; error: string | null }> {
  const supabase = createClient();
  try {
    // Cek apakah peserta sudah punya attempt untuk ujian ini
    const { data: existing } = await supabase
      .from('cbt_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('exam_id', examId)
      .single();

    if (existing) {
      // Resume attempt yang sudah ada
      return { data: existing, error: null };
    }

    // Buat attempt baru
    const { data, error } = await supabase
      .from('cbt_attempts')
      .insert([{ user_id: userId, exam_id: examId }])
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error('[CBT] Start attempt error:', err);
    return { data: null, error: err.message };
  }
}

/** Fetch semua attempt aktif untuk monitoring admin */
export async function fetchActiveCbtAttempts(examId: string): Promise<{ data: CbtAttempt[] | null; error: string | null }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('cbt_attempts')
      .select('*')
      .eq('exam_id', examId)
      .order('started_at', { ascending: false });
    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error('[CBT] Fetch active attempts error:', err);
    return { data: null, error: err.message };
  }
}

/** Tambah peringatan proctoring ke peserta */
export async function addProctoringWarning(attemptId: string): Promise<{ warnings: number; disqualified: boolean; error: string | null }> {
  const supabase = createClient();
  try {
    // Ambil jumlah warning saat ini
    const { data: attempt, error: fetchError } = await supabase
      .from('cbt_attempts')
      .select('warnings_count')
      .eq('id', attemptId)
      .single();
    if (fetchError) throw fetchError;

    const newCount = (attempt?.warnings_count || 0) + 1;
    const isDisqualified = newCount >= 3;

    const updates: any = { warnings_count: newCount };
    if (isDisqualified) {
      updates.status = 'disqualified';
      updates.finished_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('cbt_attempts')
      .update(updates)
      .eq('id', attemptId);
    if (updateError) throw updateError;

    return { warnings: newCount, disqualified: isDisqualified, error: null };
  } catch (err: any) {
    console.error('[CBT] Add proctoring warning error:', err);
    return { warnings: 0, disqualified: false, error: err.message };
  }
}

// ============================================================================
// 4. AUTO-SAVE ANSWERS (Sistem Anti-Kehilangan Data)
// ============================================================================

/** Auto-save jawaban peserta (UPSERT: insert atau update jika sudah ada) */
export async function saveCbtAnswer(answer: Omit<CbtAnswer, 'id' | 'saved_at'>): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from('cbt_answers')
      .upsert(
        {
          attempt_id: answer.attempt_id,
          question_id: answer.question_id,
          selected_option: answer.selected_option,
        },
        { onConflict: 'attempt_id,question_id' }
      );
    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    console.error('[CBT] Save answer error:', err);
    return { success: false, error: err.message };
  }
}

/** Batch auto-save: simpan banyak jawaban sekaligus (dari localStorage sync) */
export async function batchSaveCbtAnswers(answers: Omit<CbtAnswer, 'id' | 'saved_at'>[]): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from('cbt_answers')
      .upsert(
        answers.map(a => ({
          attempt_id: a.attempt_id,
          question_id: a.question_id,
          selected_option: a.selected_option,
        })),
        { onConflict: 'attempt_id,question_id' }
      );
    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    console.error('[CBT] Batch save answers error:', err);
    return { success: false, error: err.message };
  }
}

/** Fetch semua jawaban tersimpan untuk state recovery */
export async function fetchSavedAnswers(attemptId: string): Promise<{ data: CbtAnswer[] | null; error: string | null }> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('cbt_answers')
      .select('*')
      .eq('attempt_id', attemptId);
    if (error) throw error;
    return { data, error: null };
  } catch (err: any) {
    console.error('[CBT] Fetch saved answers error:', err);
    return { data: null, error: err.message };
  }
}

// ============================================================================
// 5. SCORING & GRADING (Kalkulasi Nilai Otomatis)
// ============================================================================

/** 
 * Submit jawaban peserta & hitung skor akhir secara otomatis.
 * Menggunakan fungsi SQL `calculate_cbt_score` di database untuk efisiensi maksimal.
 */
export async function submitAndGradeCbtAttempt(attemptId: string): Promise<{ score: number; error: string | null }> {
  const supabase = createClient();
  try {
    // Panggil fungsi SQL server-side untuk kalkulasi
    const { data, error } = await supabase
      .rpc('calculate_cbt_score', { p_attempt_id: attemptId });
    
    if (error) throw error;
    return { score: data || 0, error: null };
  } catch (err: any) {
    console.error('[CBT] Submit and grade error:', err);
    
    // Fallback: hitung manual di client jika RPC gagal
    try {
      return await calculateScoreClientSide(attemptId);
    } catch (fallbackErr: any) {
      return { score: 0, error: fallbackErr.message };
    }
  }
}

/**
 * Fallback: Kalkulasi skor di sisi client.
 * Digunakan jika fungsi SQL RPC tidak tersedia.
 */
async function calculateScoreClientSide(attemptId: string): Promise<{ score: number; error: string | null }> {
  const supabase = createClient();

  // 1. Ambil semua jawaban peserta
  const { data: answers, error: ansError } = await supabase
    .from('cbt_answers')
    .select('question_id, selected_option')
    .eq('attempt_id', attemptId);
  if (ansError) throw ansError;

  if (!answers || answers.length === 0) {
    return { score: 0, error: null };
  }

  // 2. Ambil kunci jawaban & bobot dari bank soal
  const questionIds = answers.map(a => a.question_id);
  const { data: questions, error: qError } = await supabase
    .from('cbt_questions')
    .select('id, correct_answer, weight')
    .in('id', questionIds);
  if (qError) throw qError;

  // 3. Hitung bobot total dan bobot yang diperoleh
  const questionMap = new Map(questions?.map(q => [q.id, q]) || []);
  let totalWeight = 0;
  let earnedWeight = 0;

  answers.forEach(answer => {
    const question = questionMap.get(answer.question_id);
    if (question) {
      totalWeight += question.weight;
      if (answer.selected_option === question.correct_answer) {
        earnedWeight += question.weight;
      }
    }
  });

  // 4. Normalisasi ke skala 100
  const normalizedScore = totalWeight > 0
    ? Math.round((earnedWeight / totalWeight) * 100 * 100) / 100
    : 0;

  // 5. Update skor di database
  const { error: updateError } = await supabase
    .from('cbt_attempts')
    .update({
      final_score: normalizedScore,
      status: 'submitted',
      finished_at: new Date().toISOString()
    })
    .eq('id', attemptId);

  if (updateError) {
    console.error('[CBT] Score update fallback error:', updateError);
  }

  return { score: normalizedScore, error: null };
}

/** Fetch leaderboard / ranking untuk admin */
export async function fetchCbtLeaderboard(examId: string): Promise<{ data: any[] | null; error: string | null }> {
  const supabase = createClient();
  try {
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
    }));

    return { data: ranked, error: null };
  } catch (err: any) {
    console.error('[CBT] Fetch leaderboard error:', err);
    return { data: null, error: err.message };
  }
}

/** Override skor peserta secara manual (hak istimewa admin) */
export async function adminOverrideCbtScore(
  attemptId: string, 
  newScore: number, 
  newStatus?: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  try {
    const updates: any = { final_score: newScore };
    if (newStatus) updates.status = newStatus;

    const { error } = await supabase
      .from('cbt_attempts')
      .update(updates)
      .eq('id', attemptId);
    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    console.error('[CBT] Admin override score error:', err);
    return { success: false, error: err.message };
  }
}
