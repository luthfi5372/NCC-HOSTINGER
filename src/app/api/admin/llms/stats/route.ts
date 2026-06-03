import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();

  try {
    // 1. Get Live Participants (ongoing status)
    const { count: liveParticipants, error: liveErr } = await supabase
      .from('cbt_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ongoing');

    if (liveErr) throw liveErr;

    // 2. Get Total Questions
    const { count: totalQuestions, error: qErr } = await supabase
      .from('cbt_questions')
      .select('*', { count: 'exact', head: true });

    if (qErr) throw qErr;

    // 3. Get Average Score & Passing Rate
    const { data: attempts, error: attErr } = await supabase
      .from('cbt_attempts')
      .select('final_score, status, exam_id');

    if (attErr) throw attErr;

    // Ambil semua ujian & soal untuk menghitung max score per ujian secara dinamis
    const { data: exams } = await supabase
      .from('cbt_exams')
      .select('id, scoring_system, correct_point');

    const { data: allQuestions } = await supabase
      .from('cbt_questions')
      .select('exam_id, weight')
      .eq('status', 'Published');

    const examMaxScores: Record<string, number> = {};
    if (exams) {
      exams.forEach(ex => {
        const questions = (allQuestions || []).filter(q => q.exam_id === ex.id);
        const count = questions.length;
        const scoringSystem = ex.scoring_system || 'Fixed';
        const fixedCorrectPoint = ex.correct_point || 4;

        let maxScore = 0;
        if (scoringSystem === 'Fixed' || scoringSystem === 'Penalty') {
          maxScore = count * fixedCorrectPoint;
        } else if (scoringSystem === 'Custom') {
          maxScore = questions.reduce((sum, q) => sum + (q.weight || 4), 0);
        }
        examMaxScores[ex.id] = maxScore;
      });
    }

    let totalScore = 0;
    let submittedCount = 0;
    let passedCount = 0;

    attempts?.forEach(att => {
      if (att.status === 'submitted') {
        totalScore += att.final_score || 0;
        submittedCount++;
        const maxScore = examMaxScores[att.exam_id] || 0;
        const passingThreshold = maxScore > 0 ? 0.7 * maxScore : 70;
        if ((att.final_score || 0) >= passingThreshold) {
          passedCount++;
        }
      }
    });

    const averageScore = submittedCount > 0 ? (totalScore / submittedCount).toFixed(1) : 0;
    const passingRate = submittedCount > 0 ? Math.round((passedCount / submittedCount) * 100) : 0;

    console.log("[STATS API] Data dikirim:", {
      liveParticipants: liveParticipants || 0,
      totalQuestions: totalQuestions || 0,
      averageScore: averageScore || 0,
      passingRate: passingRate || 0
    });

    return NextResponse.json({
      success: true,
      data: {
        liveParticipants: liveParticipants || 0,
        totalQuestions: totalQuestions || 0,
        averageScore: averageScore || 0,
        passingRate: passingRate || 0
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal mengambil statistik CBT.' },
      { status: 500 }
    );
  }
}
