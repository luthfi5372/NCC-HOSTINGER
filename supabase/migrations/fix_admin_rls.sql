-- ============================================================================
-- NCC 13th - ADMIN RLS & DATA PRIVACY CORRECTION MIGRATION
-- Memperbaiki Kebijakan RLS Agar Admin Command Center (admin1@ncc.id)
-- Dapat Melihat, Mengubah, dan Mengelola Seluruh Data Secara Real-Time
-- ============================================================================
-- Jalankan SQL ini di Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================================

-- 1. --- PERBAIKAN PADA TABEL 'competition_entries' ---
-- Pastikan RLS aktif pada tabel competition_entries
ALTER TABLE public.competition_entries ENABLE ROW LEVEL SECURITY;

-- Hapus kebijakan SELECT, UPDATE, dan DELETE lama agar tidak bentrok
DROP POLICY IF EXISTS "Users can select their own competition entries" ON public.competition_entries;
DROP POLICY IF EXISTS "Users can update their own competition entries" ON public.competition_entries;
DROP POLICY IF EXISTS "Admin has full access to competition entries" ON public.competition_entries;

-- A. Kebijakan SELECT untuk Peserta: Peserta hanya bisa melihat datanya sendiri
CREATE POLICY "Users can select their own competition entries" ON public.competition_entries
    FOR SELECT
    USING (
        user_id::text = auth.uid()::text 
        OR email = auth.jwt()->>'email'
    );

-- B. Kebijakan UPDATE untuk Peserta: Peserta hanya bisa mengubah profil mereka sendiri
CREATE POLICY "Users can update their own competition entries" ON public.competition_entries
    FOR UPDATE
    USING (user_id::text = auth.uid()::text)
    WITH CHECK (user_id::text = auth.uid()::text);

-- C. Kebijakan ALL (SELECT, INSERT, UPDATE, DELETE) untuk Admin Command Center:
-- Mengizinkan seluruh email admin ('admin@ncc.id', 'admin1@ncc.id', 'halo.ncc@gmail.com') mengelola seluruh pendaftaran
CREATE POLICY "Admin has full access to competition entries" ON public.competition_entries
    FOR ALL
    USING (auth.jwt()->>'email' IN ('admin@ncc.id', 'admin1@ncc.id', 'halo.ncc@gmail.com'))
    WITH CHECK (auth.jwt()->>'email' IN ('admin@ncc.id', 'admin1@ncc.id', 'halo.ncc@gmail.com'));


-- 2. --- PERBAIKAN PADA TABEL 'announcements' ---
-- Pastikan RLS aktif pada tabel announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Hapus kebijakan lama jika ada untuk mencegah konflik nama
DROP POLICY IF EXISTS "Public can select announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admin has full access to announcements" ON public.announcements;

-- A. Kebijakan SELECT (Read) untuk Publik: Siapa saja dapat melihat pengumuman (Landing Page, Dashboard)
CREATE POLICY "Public can select announcements" ON public.announcements
    FOR SELECT
    USING (true);

-- B. Kebijakan ALL (SELECT, INSERT, UPDATE, DELETE) untuk Admin Command Center:
-- Mengizinkan seluruh email admin ('admin@ncc.id', 'admin1@ncc.id', 'halo.ncc@gmail.com') membuat, mengubah, dan menghapus pengumuman / pengaturan portal
CREATE POLICY "Admin has full access to announcements" ON public.announcements
    FOR ALL
    USING (auth.jwt()->>'email' IN ('admin@ncc.id', 'admin1@ncc.id', 'halo.ncc@gmail.com'))
    WITH CHECK (auth.jwt()->>'email' IN ('admin@ncc.id', 'admin1@ncc.id', 'halo.ncc@gmail.com'));
