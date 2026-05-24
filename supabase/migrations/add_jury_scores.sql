-- ============================================================================
-- NCC 13th - Pembuatan Tabel Penilaian Juri (jury_scores)
-- SQL Migration Script
-- ============================================================================
-- Jalankan SQL ini di Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================================

-- 1. Buat Tabel jury_scores jika belum ada
CREATE TABLE IF NOT EXISTS public.jury_scores (
    id SERIAL PRIMARY KEY,
    entry_id INTEGER REFERENCES public.competition_entries(id) ON DELETE CASCADE,
    juri_email VARCHAR(255) NOT NULL,
    total_score NUMERIC(5, 2) NOT NULL,
    criteria_scores JSONB DEFAULT '{}',
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_entry_juri UNIQUE (entry_id, juri_email)
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.jury_scores ENABLE ROW LEVEL SECURITY;

-- 3. Hapus policy lama jika ada
DROP POLICY IF EXISTS "Allow public read access to jury scores" ON public.jury_scores;
DROP POLICY IF EXISTS "Allow authenticated judges to manage scores" ON public.jury_scores;

-- 4. Buat Kebijakan RLS
-- Semua orang bisa melihat nilai (untuk keperluan leaderboard & ranking)
CREATE POLICY "Allow public read access to jury scores" ON public.jury_scores
    FOR SELECT USING (true);

-- Hanya juri terdaftar yang bisa menambah/mengubah nilai
-- Kita mencocokkan email juri (auth.jwt()->>'email') dengan kolom juri_email
CREATE POLICY "Allow authenticated judges to manage scores" ON public.jury_scores
    FOR ALL 
    USING (auth.jwt()->>'email' = juri_email)
    WITH CHECK (auth.jwt()->>'email' = juri_email);
