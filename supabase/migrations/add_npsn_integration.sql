-- ============================================================================
-- NCC 13th - Integrasi NPSN & Auto-Lock Sekolah
-- SQL Migration Script
-- ============================================================================
-- Jalankan SQL ini di Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================================

-- 1. Tambahkan kolom npsn ke tabel profiles jika belum ada
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS npsn VARCHAR(8);

-- 2. Tambahkan kolom npsn ke tabel competition_entries jika belum ada
ALTER TABLE public.competition_entries ADD COLUMN IF NOT EXISTS npsn VARCHAR(8);

-- 3. Tambahkan kolom npsn ke tabel school_messages jika belum ada
ALTER TABLE public.school_messages ADD COLUMN IF NOT EXISTS npsn VARCHAR(8);

-- 4. Buat indeks untuk mempercepat pencarian berdasarkan NPSN
CREATE INDEX IF NOT EXISTS idx_profiles_npsn ON public.profiles(npsn);
CREATE INDEX IF NOT EXISTS idx_competition_entries_npsn ON public.competition_entries(npsn);
CREATE INDEX IF NOT EXISTS idx_school_messages_npsn ON public.school_messages(npsn);

-- 5. Perbarui fungsi handle_new_user untuk menyinkronkan npsn dan school dari metadata auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, school, npsn)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'school', ''),
    COALESCE(new.raw_user_meta_data->>'npsn', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    school = EXCLUDED.school,
    npsn = EXCLUDED.npsn;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Pasang trigger ke auth.users jika belum ada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Perbarui kebijakan RLS school_messages agar menyaring berdasarkan npsn & mengizinkan Admin HQ
DROP POLICY IF EXISTS "Users can read own school messages" ON public.school_messages;
DROP POLICY IF EXISTS "Users can insert own school messages" ON public.school_messages;

CREATE POLICY "Users can read own school messages" ON public.school_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id::text = auth.uid()::text 
              AND (profiles.npsn = school_messages.npsn OR UPPER(TRIM(profiles.school)) = UPPER(TRIM(school_messages.school_name)))
        )
        OR EXISTS (
            SELECT 1 FROM public.competition_entries
            WHERE user_id::text = auth.uid()::text
              AND (competition_entries.npsn = school_messages.npsn OR UPPER(TRIM(competition_entries.school_name)) = UPPER(TRIM(school_messages.school_name)))
        )
        -- Izinkan Admin Command Center mengakses seluruh chat
        OR auth.jwt()->>'email' IN ('admin1@ncc.id', 'admin@ncc.id', 'halo.ncc@gmail.com')
    );

CREATE POLICY "Users can insert own school messages" ON public.school_messages
    FOR INSERT
    WITH CHECK (
        (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id::text = auth.uid()::text 
                  AND (profiles.npsn = school_messages.npsn OR UPPER(TRIM(profiles.school)) = UPPER(TRIM(school_messages.school_name)))
            )
            OR EXISTS (
                SELECT 1 FROM public.competition_entries
                WHERE user_id::text = auth.uid()::text
                  AND (competition_entries.npsn = school_messages.npsn OR UPPER(TRIM(competition_entries.school_name)) = UPPER(TRIM(school_messages.school_name)))
            )
            -- Izinkan Admin Command Center untuk mengirim pesan
            OR auth.jwt()->>'email' IN ('admin1@ncc.id', 'admin@ncc.id', 'halo.ncc@gmail.com')
        )
        AND (auth.uid()::text = sender_id OR sender_id = 'hq-admin')
    );
