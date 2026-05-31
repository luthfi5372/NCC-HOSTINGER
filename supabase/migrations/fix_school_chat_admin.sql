-- ============================================================================
-- NCC 13th - ADMIN ACCESS FOR SCHOOL CHAT MIGRATION
-- Memperbaiki Kebijakan RLS Pada Tabel 'school_messages' Agar Admin Command Center
-- Dapat Membaca, Mengirim, dan Memoderasi Seluruh Obrolan Sekolah Secara Real-Time.
-- ============================================================================
-- Jalankan SQL ini di Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================================

-- 1. Pastikan RLS aktif pada tabel school_messages
ALTER TABLE public.school_messages ENABLE ROW LEVEL SECURITY;

-- 2. Hapus kebijakan SELECT dan INSERT lama agar tidak bentrok
DROP POLICY IF EXISTS "Users can read own school messages" ON public.school_messages;
DROP POLICY IF EXISTS "Users can insert own school messages" ON public.school_messages;
DROP POLICY IF EXISTS "Admin has full access to school messages" ON public.school_messages;

-- 3. Kebijakan SELECT (Membaca):
-- Peserta hanya bisa membaca obrolan sekolahnya sendiri, sedangkan Admin Command Center
-- ('admin@ncc.id', 'admin1@ncc.id', 'halo.ncc@gmail.com') bisa membaca seluruh obrolan.
CREATE POLICY "Users can read own school messages" ON public.school_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.competition_entries 
            WHERE user_id::text = auth.uid()::text 
              AND UPPER(TRIM(school_name)) = UPPER(TRIM(school_messages.school_name))
        )
        OR auth.jwt()->>'email' IN ('admin@ncc.id', 'admin1@ncc.id', 'halo.ncc@gmail.com')
    );

-- 4. Kebijakan INSERT (Mengirim):
-- Peserta hanya bisa mengirim ke sekolahnya sendiri, sedangkan Admin Command Center
-- ('admin@ncc.id', 'admin1@ncc.id', 'halo.ncc@gmail.com') bisa mengirim ke sekolah mana saja.
CREATE POLICY "Users can insert own school messages" ON public.school_messages
    FOR INSERT
    WITH CHECK (
        (
            EXISTS (
                SELECT 1 FROM public.competition_entries 
                WHERE user_id::text = auth.uid()::text 
                  AND UPPER(TRIM(school_name)) = UPPER(TRIM(school_messages.school_name))
            )
            AND auth.uid()::text = sender_id
        )
        OR auth.jwt()->>'email' IN ('admin@ncc.id', 'admin1@ncc.id', 'halo.ncc@gmail.com')
    );

-- 5. Kebijakan ALL (SELECT, INSERT, UPDATE, DELETE) untuk Admin Command Center:
-- Memberikan hak penuh kepada Admin Command Center untuk moderasi (mengedit, menghapus, meneruskan) semua obrolan.
CREATE POLICY "Admin has full access to school messages" ON public.school_messages
    FOR ALL
    USING (auth.jwt()->>'email' IN ('admin@ncc.id', 'admin1@ncc.id', 'halo.ncc@gmail.com'))
    WITH CHECK (auth.jwt()->>'email' IN ('admin@ncc.id', 'admin1@ncc.id', 'halo.ncc@gmail.com'));
