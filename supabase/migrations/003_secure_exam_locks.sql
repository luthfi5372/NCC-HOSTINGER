-- ============================================================================
-- NCC 13th - CBT Olimpiade MIPA: Protokol Pengunci Ujian Ketat
-- Pengunci tingkat database untuk mencegah pembaruan jawaban setelah submit.
-- ============================================================================

-- 1. Membuat fungsi pelindung attempt yang sudah disubmit
CREATE OR REPLACE FUNCTION protect_submitted_attempts()
RETURNS TRIGGER AS $$
BEGIN
    -- Jika data lama (OLD) sudah memiliki submitted_at, tolak segala bentuk UPDATE
    IF OLD.submitted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Sesi ujian ini telah disubmit dan tidak dapat diubah lagi secara ilegal.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Memasang trigger ke tabel cbt_attempts
DROP TRIGGER IF EXISTS trigger_protect_submitted_attempts ON cbt_attempts;
CREATE TRIGGER trigger_protect_submitted_attempts
    BEFORE UPDATE ON cbt_attempts
    FOR EACH ROW
    EXECUTE FUNCTION protect_submitted_attempts();
