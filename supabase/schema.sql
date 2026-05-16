-- ============================================================================
-- NCC 13th - CBT Olimpiade MIPA: Skema Database Standar Internasional
-- Fase 1: Pondasi Data (Bank Soal, Sesi Ujian, Auto-Save, Penilaian)
-- ============================================================================
-- Jalankan SQL ini di Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================================

-- 1. TABEL UJIAN (cbt_exams)
-- Menyimpan konfigurasi dasar per sesi olimpiade.
-- Setiap sesi memiliki durasi, token akses, dan sistem penilaian tersendiri.
CREATE TABLE IF NOT EXISTS cbt_exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,               -- "Penyisihan Olimpiade MIPA Gel. I"
    token VARCHAR(50) UNIQUE NOT NULL,          -- Token akses unik, e.g., "NCC13MIPA"
    duration_minutes INT NOT NULL DEFAULT 90,
    scoring_system VARCHAR(20) DEFAULT 'Custom' CHECK (scoring_system IN ('Fixed', 'Custom', 'Penalty')),
    correct_point INT DEFAULT 4,                -- Poin jawaban benar (untuk mode Fixed)
    penalty_point INT DEFAULT 0,                -- Poin penalti salah (untuk mode Penalty)
    empty_point FLOAT DEFAULT 0,                -- Poin jika tidak dijawab/kosong
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL BANK SOAL MIPA (cbt_questions)
-- Menyimpan setiap butir soal. Kolom question_text mendukung format LaTeX.
-- Opsi jawaban disimpan dalam JSONB agar fleksibel (teks, gambar, rumus).
CREATE TABLE IF NOT EXISTS cbt_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID REFERENCES cbt_exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,                -- Mendukung LaTeX: "$\int_0^\infty e^{-x^2} dx$"
    options JSONB NOT NULL,                     -- {"A": "Jawaban 1", "B": "$x^2$", ...}
    correct_answer VARCHAR(5) NOT NULL,         -- 'A', 'B', 'C', 'D', atau 'E'
    difficulty VARCHAR(10) DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    weight INT DEFAULT 4,                       -- Bobot nilai kustom per soal
    image_url TEXT,                             -- URL gambar/grafik opsional
    status VARCHAR(10) DEFAULT 'Published' CHECK (status IN ('Published', 'Draft')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL SESI PESERTA (cbt_attempts)
-- Mencatat siapa yang sedang mengerjakan ujian, statusnya, dan skor akhir.
-- Tabel ini akan dipantau secara real-time oleh Admin Command Center.
CREATE TABLE IF NOT EXISTS cbt_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,              -- NISN atau ID Tiket Peserta (e.g., "NCC-27")
    exam_id UUID REFERENCES cbt_exams(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'submitted', 'timeout', 'disqualified')),
    final_score FLOAT DEFAULT 0,
    warnings_count INT DEFAULT 0,               -- Akumulasi pelanggaran proctoring
    started_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    CONSTRAINT unique_user_exam UNIQUE (user_id, exam_id)
);

-- 4. TABEL AUTO-SAVE JAWABAN (cbt_answers)
-- Setiap kali peserta memilih A/B/C/D/E, data langsung masuk ke sini.
-- Constraint UNIQUE mencegah data jawaban ganda per soal per percobaan.
CREATE TABLE IF NOT EXISTS cbt_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attempt_id UUID REFERENCES cbt_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES cbt_questions(id) ON DELETE CASCADE,
    selected_option VARCHAR(5),                 -- 'A', 'B', 'C', 'D', 'E'
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(attempt_id, question_id)             -- Anti-duplikat: 1 jawaban per soal per sesi
);

-- ============================================================================
-- TRIGGER: Auto-update timestamp `saved_at` pada tabel cbt_answers
-- ============================================================================
CREATE OR REPLACE FUNCTION update_cbt_answer_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.saved_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cbt_answer_timestamp
    BEFORE UPDATE ON cbt_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_cbt_answer_timestamp();

-- ============================================================================
-- FUNCTION: Kalkulasi skor akhir peserta (dipanggil saat submit)
-- Menghitung berdasarkan bobot (weight) per soal yang dijawab benar.
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_cbt_score(p_attempt_id UUID)
RETURNS FLOAT AS $$
DECLARE
    total_weight FLOAT := 0;
    earned_weight FLOAT := 0;
    final_normalized FLOAT := 0;
BEGIN
    -- Hitung total bobot maksimal semua soal dalam ujian ini
    SELECT COALESCE(SUM(q.weight), 0) INTO total_weight
    FROM cbt_answers a
    JOIN cbt_questions q ON a.question_id = q.id
    WHERE a.attempt_id = p_attempt_id;

    -- Hitung bobot yang diperoleh (hanya jawaban benar)
    SELECT COALESCE(SUM(q.weight), 0) INTO earned_weight
    FROM cbt_answers a
    JOIN cbt_questions q ON a.question_id = q.id
    WHERE a.attempt_id = p_attempt_id
      AND a.selected_option = q.correct_answer;

    -- Normalisasi ke skala 100
    IF total_weight > 0 THEN
        final_normalized := ROUND((earned_weight / total_weight) * 100, 2);
    END IF;

    -- Update skor akhir di tabel attempts
    UPDATE cbt_attempts
    SET final_score = final_normalized,
        status = 'submitted',
        finished_at = NOW()
    WHERE id = p_attempt_id;

    RETURN final_normalized;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Keamanan Tingkat Baris
-- ============================================================================
ALTER TABLE cbt_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbt_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbt_answers ENABLE ROW LEVEL SECURITY;

-- Policy: Semua orang bisa membaca ujian yang aktif
CREATE POLICY "Public can read active exams" ON cbt_exams
    FOR SELECT USING (is_active = true);

-- Policy: Semua orang bisa membaca soal dari ujian yang aktif
CREATE POLICY "Public can read questions of active exams" ON cbt_questions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM cbt_exams WHERE id = cbt_questions.exam_id AND is_active = true)
        AND status = 'Published'
    );

-- Policy: User bisa membaca attempt miliknya sendiri
CREATE POLICY "Users can read own attempts" ON cbt_attempts
    FOR SELECT USING (true);

-- Policy: User bisa insert attempt baru
CREATE POLICY "Users can insert attempts" ON cbt_attempts
    FOR INSERT WITH CHECK (true);

-- Policy: User bisa update attempt miliknya
CREATE POLICY "Users can update own attempts" ON cbt_attempts
    FOR UPDATE USING (true);

-- Policy: User bisa membaca, insert, dan update jawaban miliknya
CREATE POLICY "Users can manage own answers" ON cbt_answers
    FOR ALL USING (true);

-- ============================================================================
-- INDEX: Optimasi performa query untuk operasi real-time
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_cbt_questions_exam_id ON cbt_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_cbt_attempts_user_id ON cbt_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_cbt_attempts_exam_id ON cbt_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_cbt_answers_attempt_id ON cbt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_cbt_answers_question_id ON cbt_answers(question_id);

-- ==========================================================
-- MODUL 2: REAL-TIME SCORING & LIVE LEADERBOARD
-- ==========================================================

-- 1. TABEL HASIL UJIAN & PROGRES PESERTA (CBT ATTEMPTS)
CREATE TABLE IF NOT EXISTS public.cbt_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,               -- ID Peserta (Relasi ke auth.users)
    exam_id UUID REFERENCES public.cbt_exams(id) ON DELETE CASCADE,
    current_score FLOAT DEFAULT 0,       -- Skor total real-time
    answers_json JSONB DEFAULT '{}',     -- Rekam jawaban, contoh: {"1": "A", "2": "C"}
    violations_count INTEGER DEFAULT 0,  -- Jumlah keluar tab / cheat radar
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE, -- Null jika masih mengerjakan
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. KEAMANAN: ROW LEVEL SECURITY (RLS)
ALTER TABLE public.cbt_attempts ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada agar tidak duplikat saat run ulang
DROP POLICY IF EXISTS "Access All Attempts" ON public.cbt_attempts;
CREATE POLICY "Access All Attempts" ON public.cbt_attempts FOR ALL USING (true) WITH CHECK (true);


-- 3. OTOMATISASI: FUNGSI UPDATE TIMESTAMPS
-- Mengupdate kolom updated_at secara otomatis setiap ada perubahan data
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_cbt_attempts ON public.cbt_attempts;
CREATE TRIGGER set_timestamp_cbt_attempts
BEFORE UPDATE ON public.cbt_attempts
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();
