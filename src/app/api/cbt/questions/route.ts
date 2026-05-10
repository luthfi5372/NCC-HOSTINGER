/**
 * ============================================================================
 * API Route: /api/cbt/questions
 * ============================================================================
 * Endpoint CRUD untuk manajemen Bank Soal MIPA.
 * - GET:  Ambil semua soal berdasarkan exam_id
 * - POST: Simpan soal baru (single atau batch)
 * - DELETE: Hapus soal berdasarkan question_id
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

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
      .from('cbt_questions')
      .select('*')
      .eq('exam_id', examId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      data,
      count: data?.length || 0
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal mengambil data soal.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const supabase = createClient();

  // Support batch insert (array) atau single insert (object)
  const questions = Array.isArray(body) ? body : [body];

  // Validasi setiap soal
  for (const q of questions) {
    if (!q.exam_id || !q.question_text || !q.options || !q.correct_answer) {
      return NextResponse.json(
        { error: 'Setiap soal wajib memiliki exam_id, question_text, options, dan correct_answer.' },
        { status: 400 }
      );
    }
  }

  try {
    const payload = questions.map(q => ({
      exam_id: q.exam_id,
      question_text: q.question_text,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      correct_answer: q.correct_answer,
      difficulty: q.difficulty || 'Medium',
      weight: q.weight || 4,
      image_url: q.image_url || null,
      status: q.status || 'Published'
    }));

    const { data, error } = await supabase
      .from('cbt_questions')
      .insert(payload)
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `${data?.length} soal berhasil disimpan ke bank soal.`,
      data
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal menyimpan soal.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const questionId = searchParams.get('id');

  if (!questionId) {
    return NextResponse.json(
      { error: 'Parameter id (question_id) wajib diisi.' },
      { status: 400 }
    );
  }

  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('cbt_questions')
      .delete()
      .eq('id', questionId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Soal berhasil dihapus dari bank soal.'
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal menghapus soal.' },
      { status: 500 }
    );
  }
}
