-- ============================================================================
-- NCC 13th - SKEMA DATABASE MYSQL HOSTINGER
-- Jalankan skrip SQL ini di phpMyAdmin Hostinger Anda.
-- ============================================================================

-- 1. TABEL PROFILES (Akun Pengguna / Peserta & Admin)
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    school VARCHAR(255) DEFAULT NULL,
    npsn VARCHAR(8) DEFAULT NULL,
    role VARCHAR(50) DEFAULT 'peserta', -- 'peserta', 'admin', 'juri'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. TABEL BUKU INDUK PESERTA (competition_entries)
CREATE TABLE IF NOT EXISTS competition_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) DEFAULT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    school VARCHAR(255) DEFAULT NULL,
    city VARCHAR(255) DEFAULT NULL,
    category VARCHAR(100) DEFAULT NULL,
    team_size INT DEFAULT 1,
    notes TEXT DEFAULT NULL,
    payment_status VARCHAR(50) DEFAULT 'Wait', -- 'Wait', 'Verified', 'Paid', 'None', 'Rejected'
    payment_proof_url VARCHAR(500) DEFAULT NULL,
    nisn VARCHAR(20) DEFAULT NULL,
    school_name VARCHAR(255) DEFAULT NULL,
    province VARCHAR(255) DEFAULT NULL,
    competition_type VARCHAR(100) DEFAULT NULL,
    mentor_name VARCHAR(255) DEFAULT NULL,
    npsn VARCHAR(8) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ce_user_id (user_id),
    INDEX idx_ce_email (email),
    INDEX idx_ce_npsn (npsn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. TABEL PENGATURAN SITE (site_settings)
CREATE TABLE IF NOT EXISTS site_settings (
    id INT PRIMARY KEY,
    is_registration_open TINYINT(1) DEFAULT 1,
    result_visible TINYINT(1) DEFAULT 0,
    maintenance_mode TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. TABEL PENGATURAN CBT (cbt_settings)
CREATE TABLE IF NOT EXISTS cbt_settings (
    id INT PRIMARY KEY,
    strict_mode TINYINT(1) DEFAULT 0,
    auto_save TINYINT(1) DEFAULT 1,
    maintenance_mode TINYINT(1) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. TABEL PENGUMUMAN & SYSTEM CONFIG (announcements)
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) DEFAULT NULL,
    message TEXT DEFAULT NULL,
    content TEXT DEFAULT NULL,
    target_audience VARCHAR(100) DEFAULT 'All',
    type VARCHAR(50) DEFAULT 'info',
    exam_id VARCHAR(36) DEFAULT NULL,
    image_url TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. TABEL UJIAN (cbt_exams)
CREATE TABLE IF NOT EXISTS cbt_exams (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    token VARCHAR(50) UNIQUE NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 90,
    scoring_system VARCHAR(20) DEFAULT 'Custom', -- 'Fixed', 'Custom', 'Penalty'
    correct_point INT DEFAULT 4,
    penalty_point INT DEFAULT 0,
    empty_point FLOAT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. TABEL BANK SOAL (cbt_questions)
CREATE TABLE IF NOT EXISTS cbt_questions (
    id VARCHAR(36) PRIMARY KEY,
    exam_id VARCHAR(36) NOT NULL,
    question_text TEXT NOT NULL,
    options JSON NOT NULL, -- Format JSON: {"A": "Jawaban A", "B": "..."}
    correct_answer VARCHAR(5) NOT NULL,
    difficulty VARCHAR(10) DEFAULT 'Medium', -- 'Easy', 'Medium', 'Hard'
    weight INT DEFAULT 4,
    image_url TEXT DEFAULT NULL,
    status VARCHAR(10) DEFAULT 'Published', -- 'Published', 'Draft'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES cbt_exams(id) ON DELETE CASCADE,
    INDEX idx_q_exam_id (exam_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. TABEL SESI PERCOBAAN UJIAN (cbt_attempts)
CREATE TABLE IF NOT EXISTS cbt_attempts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    exam_id VARCHAR(36) NOT NULL,
    status VARCHAR(50) DEFAULT 'ongoing', -- 'ongoing', 'submitted', 'timeout', 'disqualified'
    final_score FLOAT DEFAULT 0,
    warnings_count INT DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP NULL DEFAULT NULL,
    current_score FLOAT DEFAULT 0,
    answers_json JSON DEFAULT NULL,
    violations_count INT DEFAULT 0,
    status_passing VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'PASSED', 'FAILED'
    submitted_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_exam (user_id, exam_id),
    FOREIGN KEY (exam_id) REFERENCES cbt_exams(id) ON DELETE CASCADE,
    INDEX idx_a_exam_id (exam_id),
    INDEX idx_a_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. TABEL AUTO-SAVE JAWABAN (cbt_answers)
CREATE TABLE IF NOT EXISTS cbt_answers (
    id VARCHAR(36) PRIMARY KEY,
    attempt_id VARCHAR(36) NOT NULL,
    question_id VARCHAR(36) NOT NULL,
    selected_option VARCHAR(5) DEFAULT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_attempt_question (attempt_id, question_id),
    FOREIGN KEY (attempt_id) REFERENCES cbt_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES cbt_questions(id) ON DELETE CASCADE,
    INDEX idx_ans_attempt_id (attempt_id),
    INDEX idx_ans_question_id (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. TABEL OBROLAN SEKOLAH (school_messages)
CREATE TABLE IF NOT EXISTS school_messages (
    id VARCHAR(36) PRIMARY KEY,
    school_name VARCHAR(255) NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    npsn VARCHAR(8) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sm_school_name (school_name),
    INDEX idx_sm_npsn (npsn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. TABEL PENILAIAN JURI (jury_scores)
CREATE TABLE IF NOT EXISTS jury_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entry_id INT NOT NULL,
    juri_email VARCHAR(255) NOT NULL,
    total_score DECIMAL(5, 2) NOT NULL,
    criteria_scores JSON DEFAULT NULL,
    comments TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_entry_juri (entry_id, juri_email),
    FOREIGN KEY (entry_id) REFERENCES competition_entries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- VIEW & SEED DATA INITIALIZATION
-- ============================================================================

-- 12. VIEW CBT PARTICIPANTS
CREATE OR REPLACE VIEW cbt_participants AS
SELECT 
    p.username AS username, 
    p.full_name AS full_name, 
    COALESCE(p.school, ce.school, ce.school_name, '-') AS school_origin, 
    COALESCE(ce.category, ce.competition_type, 'MIPA') AS branch
FROM profiles p
LEFT JOIN competition_entries ce ON p.id = ce.user_id OR p.email = ce.email;

-- 13. SEED SETTINGS DEFAULT
INSERT INTO site_settings (id, is_registration_open, result_visible, maintenance_mode) 
VALUES (1, 1, 0, 0)
ON DUPLICATE KEY UPDATE id=1;

INSERT INTO cbt_settings (id, strict_mode, auto_save, maintenance_mode) 
VALUES (1, 0, 1, 0)
ON DUPLICATE KEY UPDATE id=1;

-- 14. SEED ADMIN UTAMA DEFAULT
-- Username: admin1
-- Email: admin1@ncc.id
-- Password (hash): $2b$10$RT5qrRj7SaERCOU6BmVYzuWL8VPxlPQzuZO3T0u7tHS3botiet8fq (Yaitu "123456")
-- Peran: admin
INSERT INTO profiles (id, username, email, password_hash, full_name, role) 
VALUES (
    'admin1-uuid-0000-0000-000000000000', 
    'admin1', 
    'admin1@ncc.id', 
    '$2b$10$RT5qrRj7SaERCOU6BmVYzuWL8VPxlPQzuZO3T0u7tHS3botiet8fq', 
    'Admin Command Center', 
    'admin'
)
ON DUPLICATE KEY UPDATE id='admin1-uuid-0000-0000-000000000000';

-- Tambahkan Admin cadangan jika diperlukan
-- Email: admin@ncc.id
-- Password (hash): $2b$10$q/JZO0GWs9UiLdxCE9wWIemb4FSK9M7RdGwX5hzhp5RTUiBlSyFte (Yaitu "admin123")
INSERT INTO profiles (id, username, email, password_hash, full_name, role) 
VALUES (
    'admin2-uuid-0000-0000-000000000000', 
    'admin', 
    'admin@ncc.id', 
    '$2b$10$q/JZO0GWs9UiLdxCE9wWIemb4FSK9M7RdGwX5hzhp5RTUiBlSyFte', 
    'Admin Utama', 
    'admin'
)
ON DUPLICATE KEY UPDATE id='admin2-uuid-0000-0000-000000000000';
