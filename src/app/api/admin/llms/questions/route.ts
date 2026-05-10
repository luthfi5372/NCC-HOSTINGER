// File: app/api/admin/llms/questions/route.ts
// ============================================================================
// API ADMIN: Pencipta Soal Olimpiade MIPA (CRUD Bank Soal)
// ============================================================================
// Endpoint ini eksklusif untuk admin HQ Command Center.
// Menggunakan Supabase SSR (server-side) untuk keamanan maksimal.
// ============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/llms/questions
 * Menyimpan soal baru ke bank soal database.
 * 
 * Ekspektasi bentuk payload:
 * {
 *   "exam_id": "uuid-dari-tabel-cbt_exams",
 *   "question_text": "Jika f(x) = x^2, maka turunan pertamanya adalah...",
 *   "options": {"A": "x", "B": "2x", "C": "x^2", "D": "2"},
 *   "correct_answer": "B",
 *   "weight": 4,
 *   "difficulty": "Medium",
 *   "image_url": null,
 *   "status": "Published"
 * }
 */
export async function POST(request: Request) {
  try {
    // 1. Tangkap data dari frontend admin
    const payload = await request.json();

    // 2. Validasi data dasar (Mencegah admin menyimpan soal kosong)
    if (!payload.exam_id || !payload.question_text || !payload.correct_answer) {
      return NextResponse.json(
        { success: false, error: "Data soal tidak lengkap. Teks soal dan Kunci Jawaban wajib diisi." },
        { status: 400 }
      );
    }

    // 3. Validasi format options (harus JSONB object, bukan array)
    if (!payload.options || typeof payload.options !== 'object' || Array.isArray(payload.options)) {
      return NextResponse.json(
        { success: false, error: "Format opsi jawaban tidak valid. Gunakan format: {\"A\": \"...\", \"B\": \"...\"}" },
        { status: 400 }
      );
    }

    // 4. Hubungkan ke Supabase dengan aman (Server-Side SSR Client)
    const supabase = await createClient();

    // 5. Masukkan soal ke database
    const { data, error } = await supabase
      .from('cbt_questions')
      .insert([
        {
          exam_id: payload.exam_id,
          question_text: payload.question_text,
          options: payload.options,
          correct_answer: payload.correct_answer,
          weight: payload.weight || 4,           // Default +4 poin jika admin lupa mengisi
          difficulty: payload.difficulty || 'Medium',
          image_url: payload.image_url || null,
          status: payload.status || 'Published'
        }
      ])
      .select()
      .single();

    // 6. Tangkap error Supabase (Silent Error prevention)
    if (error) throw error;

    // 7. Kembalikan respon sukses
    return NextResponse.json(
      { success: true, message: "Soal berhasil ditambahkan ke bank soal!", data },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("GAGAL SIMPAN SOAL:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Terjadi kesalahan internal server" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/llms/questions?exam_id=xxx
 * Mengambil semua soal untuk sesi ujian tertentu.
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

  } catch (error: any) {
    console.error("GAGAL AMBIL SOAL:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil data soal." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/llms/questions?id=xxx
 * Menghapus soal dari bank soal berdasarkan ID.
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('id');

    if (!questionId) {
      return NextResponse.json(
        { success: false, error: "Parameter id (question_id) wajib diisi." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('cbt_questions')
      .delete()
      .eq('id', questionId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Soal berhasil dihapus dari bank soal."
    });

  } catch (error: any) {
    console.error("GAGAL HAPUS SOAL:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus soal." },
      { status: 500 }
    );
  }
}
