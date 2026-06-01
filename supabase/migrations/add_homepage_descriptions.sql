-- ============================================================================
-- NCC 13th - HOMEPAGE DYNAMIC DESCRIPTIONS MIGRATION
-- Membuat Tabel 'homepage_descriptions' agar Admin Bisa Menambah, Mengedit,
-- dan Menghapus Konten Penjelasan/Benefit di Dashboard Depan Secara Dinamis.
-- ============================================================================

-- 1. Membuat tabel homepage_descriptions
CREATE TABLE IF NOT EXISTS public.homepage_descriptions (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL DEFAULT 'benefit', -- 'about' (untuk What is NCC) atau 'benefit' (untuk Benefits Card)
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    icon VARCHAR(100) NOT NULL DEFAULT 'Trophy', -- Trophy, Banknote, ScrollText, GraduationCap, dll.
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Mengaktifkan RLS (Row Level Security)
ALTER TABLE public.homepage_descriptions ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan RLS (SELECT):
-- Semua orang (anonim & peserta) dapat membaca penjelasan halaman depan.
CREATE POLICY "Allow public read access to homepage descriptions" ON public.homepage_descriptions
    FOR SELECT
    USING (true);

-- 4. Kebijakan RLS (ALL):
-- Hanya Admin Command Center ('admin@ncc.id', 'admin1@ncc.id', 'halo.ncc@gmail.com') yang bisa menambah, mengedit, dan menghapus.
CREATE POLICY "Allow admin full access to homepage descriptions" ON public.homepage_descriptions
    FOR ALL
    USING (auth.jwt()->>'email' IN ('admin@ncc.id', 'admin1@ncc.id', 'halo.ncc@gmail.com'))
    WITH CHECK (auth.jwt()->>'email' IN ('admin@ncc.id', 'admin1@ncc.id', 'halo.ncc@gmail.com'));

-- 5. Masukkan Data Default Awal (Seed Data)
-- Agar jika admin baru mengaktifkan database, halaman depan tidak kosong.
INSERT INTO public.homepage_descriptions (category, title, content, icon, order_index)
VALUES 
    ('about', 'Tingkat Nasional Sejak 1 Dekade', 'Penyelenggaraan kompetisi konsisten tingkat nasional selama 10 tahun.', 'CheckCircle2', 1),
    ('about', 'Mengasah Potensi Multidisiplin', 'Mengembangkan bakat dalam bidang riset, akademik, dan bahasa.', 'CheckCircle2', 2),
    ('about', 'Piala Bergilir Bergengsi', 'Memperebutkan piala bergilir kehormatan Kemenag RI & Gubernur Jatim.', 'CheckCircle2', 3),
    ('benefit', 'Trophies Of Award', 'Meraih piala eksklusif penghargaan kehormatan juara NCC ke-13.', 'Trophy', 4),
    ('benefit', 'Counseling Money', 'Uang pembinaan senilai jutaan rupiah untuk mendukung riset lanjutan.', 'Banknote', 5),
    ('benefit', 'Certificate Of Award', 'Sertifikat resmi tingkat nasional untuk mendukung portofolio prestasi.', 'ScrollText', 6),
    ('benefit', 'Get 25% Scholarship Senior High School', 'Beasiswa SPP 25% masuk SMA Darul Ulum 1 Unggulan Jombang.', 'GraduationCap', 7)
ON CONFLICT DO NOTHING;
