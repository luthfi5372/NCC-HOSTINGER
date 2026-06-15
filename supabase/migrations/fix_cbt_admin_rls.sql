-- ============================================================================
-- NCC 13th - CBT / LLMS ADMIN RLS POLICIES & MISSING TABLES CREATION
-- Memperbaiki RLS agar Admin (admin@ncc.id, admin1@ncc.id, halo.ncc@gmail.com)
-- Dapat Mengelola (SELECT, INSERT, UPDATE, DELETE) Seluruh Data CBT & Ujian
-- Serta membuat tabel 'cbt_answers' jika belum ada di database.
-- ============================================================================
-- Jalankan SQL ini di Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================================

-- 0. --- PASTIKAN PRIMARY KEY TERPASANG PADA TABEL REFERENSI ---
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name='cbt_attempts' AND constraint_type='PRIMARY KEY'
    ) THEN
        ALTER TABLE public.cbt_attempts ADD CONSTRAINT cbt_attempts_pkey PRIMARY KEY (id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name='cbt_questions' AND constraint_type='PRIMARY KEY'
    ) THEN
        ALTER TABLE public.cbt_questions ADD CONSTRAINT cbt_questions_pkey PRIMARY KEY (id);
    END IF;
END $$;

-- --- PEMBUATAN TABEL cbt_answers JIKA BELUM ADA ---
CREATE TABLE IF NOT EXISTS public.cbt_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attempt_id UUID REFERENCES public.cbt_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.cbt_questions(id) ON DELETE CASCADE,
    selected_option VARCHAR(5),                 -- 'A', 'B', 'C', 'D', 'E'
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(attempt_id, question_id)             -- Anti-duplikat: 1 jawaban per soal per sesi
);

-- Trigger untuk update timestamp saved_at
CREATE OR REPLACE FUNCTION update_cbt_answer_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.saved_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_cbt_answer_timestamp ON public.cbt_answers;
CREATE TRIGGER trigger_update_cbt_answer_timestamp
    BEFORE UPDATE ON public.cbt_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_cbt_answer_timestamp();


-- 1. --- PERBAIKAN PADA TABEL 'cbt_exams' ---
ALTER TABLE public.cbt_exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin has full access to cbt_exams" ON public.cbt_exams;
CREATE POLICY "Admin has full access to cbt_exams" ON public.cbt_exams
    FOR ALL
    USING (auth.jwt()->>'email' IN ('admin@ncc.id', 'admin1@ncc.id', 'halo.ncc@gmail.com'))
    WITH CHECK (auth.jwt()->>'email' IN ('admin@ncc.id', 'admin1@ncc.id', 'halo.ncc@gmail.com'));

-- Tambahan: Izinkan admin untuk select semua exam (termasuk yang tidak aktif)
DROP POLICY IF EXISTS "Public can read active exams" ON public.cbt_exams;
CREATE POLICY "Public can read active exams" ON public.cbt_exams
    FOR SELECT USING (
        is_active = true 
        OR auth.jwt()->>'email' IN ('admin@ncc.id', 'admin1@ncc.id', 'halo.ncc@gmail.com')
    );


-- 2. --- PERBAIKAN PADA TABEL 'cbt_questions' ---
ALTER TABLE public.cbt_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin has full access to cbt_questions" ON public.cbt_questions;
CREATE POLICY "Admin has full access to cbt_questions" ON public.cbt_questions
    FOR ALL
    USING (auth.jwt()->>'email' IN ('admin@ncc.id', 'admin1@ncc.id', 'halo.ncc@gmail.com'))
    WITH CHECK (auth.jwt()->>'email' IN ('admin@ncc.id', 'admin1@ncc.id', 'halo.ncc@gmail.com'));


-- 3. --- PERBAIKAN PADA TABEL 'cbt_attempts' ---
ALTER TABLE public.cbt_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin has full access to cbt_attempts" ON public.cbt_attempts;
CREATE POLICY "Admin has full access to cbt_attempts" ON public.cbt_attempts
    FOR ALL
    USING (auth.jwt()->>'email' IN ('admin@ncc.id', 'admin1@ncc.id', 'halo.ncc@gmail.com'))
    WITH CHECK (auth.jwt()->>'email' IN ('admin@ncc.id', 'admin1@ncc.id', 'halo.ncc@gmail.com'));


-- 4. --- PERBAIKAN PADA TABEL 'cbt_answers' ---
ALTER TABLE public.cbt_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin has full access to cbt_answers" ON public.cbt_answers;
CREATE POLICY "Admin has full access to cbt_answers" ON public.cbt_answers
    FOR ALL
    USING (auth.jwt()->>'email' IN ('admin@ncc.id', 'admin1@ncc.id', 'halo.ncc@gmail.com'))
    WITH CHECK (auth.jwt()->>'email' IN ('admin@ncc.id', 'admin1@ncc.id', 'halo.ncc@gmail.com'));
