-- ============================================================================
-- NCC 13th - Aktivasi Update Profil & Real-time Sinkronisasi Admin
-- SQL Migration Script
-- ============================================================================
-- Jalankan SQL ini di Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================================

-- 1. Pastikan Row Level Security (RLS) aktif pada tabel competition_entries
ALTER TABLE public.competition_entries ENABLE ROW LEVEL SECURITY;

-- 2. Hapus kebijakan UPDATE lama jika ada untuk mencegah duplikasi/bentrok
DROP POLICY IF EXISTS "Users can update their own competition entries" ON public.competition_entries;

-- 3. Buat kebijakan UPDATE baru: Peserta hanya bisa mengubah datanya sendiri
-- Menggunakan user_id::text = auth.uid()::text agar aman & kompatibel di semua skenario
CREATE POLICY "Users can update their own competition entries" ON public.competition_entries
    FOR UPDATE
    USING (user_id::text = auth.uid()::text)
    WITH CHECK (user_id::text = auth.uid()::text);

-- 4. Hapus kebijakan SELECT lama jika ada dan buat yang baru agar aman
DROP POLICY IF EXISTS "Users can select their own competition entries" ON public.competition_entries;

CREATE POLICY "Users can select their own competition entries" ON public.competition_entries
    FOR SELECT
    USING (user_id::text = auth.uid()::text OR email = auth.jwt()->>'email');

-- 5. Tambahkan tabel competition_entries ke publikasi Supabase Realtime secara aman (PL/pgSQL)
-- Ini sangat krusial agar perubahan data langsung terkirim secara instan ke layar Admin HQ (real-time)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr
        JOIN pg_publication p ON pr.prpubid = p.oid
        JOIN pg_class c ON pr.prrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE p.pubname = 'supabase_realtime' 
          AND n.nspname = 'public' 
          AND c.relname = 'competition_entries'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_entries;
    END IF;
END $$;
