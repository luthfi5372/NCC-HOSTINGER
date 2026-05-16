'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ProctoringProps {
  examId: string;
  userId: string;
  attemptId: string;
  maxViolations?: number;
  onBlock?: () => void;
}

export function useAdvancedProctoring({ examId, userId, attemptId, maxViolations = 3, onBlock }: ProctoringProps) {
  const supabase = createClient();
  const [violations, setViolations] = useState(0);
  const [warningMessage, setWarningMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Fungsi sinkronisasi angka pelanggaran ke Supabase
  const updateViolationInDB = async (newCount: number) => {
    try {
      await supabase
        .from('cbt_attempts')
        .update({ violations_count: newCount })
        .eq('id', attemptId);
    } catch (err) {
      console.error('Gagal mengirim data telemetri:', err);
    }
  };

  const triggerViolation = (msg: string) => {
    setWarningMessage(msg);
    setShowModal(true);
    setViolations((prev) => {
      const currentCount = prev + 1;
      updateViolationInDB(currentCount);
      if (currentCount >= maxViolations && onBlock) {
        onBlock();
      }
      return currentCount;
    });
  };

  useEffect(() => {
    if (!examId || !attemptId) return;

    // 1. DETEKSI PINDAH TAB / MINIMIZE
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation('Anda terdeteksi meninggalkan tab ujian atau meminimalkan browser.');
      }
    };

    const handleWindowBlur = () => {
      triggerViolation('Anda terdeteksi membuka aplikasi lain di luar jendela ujian.');
    };

    // 2. DETEKSI KELUAR FULLSCREEN
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        triggerViolation('Anda keluar dari mode layar penuh (Fullscreen). Ujian wajib dikerjakan dalam mode fullscreen.');
      }
    };

    // 3. BLOKIR INSPECT ELEMENT & SHORTCUTS KECURANGAN
    const handleKeyDown = (e: KeyboardEvent) => {
      // Blokir F12
      if (e.key === 'F12') {
        e.preventDefault();
        triggerViolation('Akses pintas F12 (Developer Tools) telah diblokir.');
      }
      // Blokir Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U (Source Code)
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        triggerViolation('Kombinasi tombol inspeksi sistem telah diblokir oleh sistem.');
      }
    };

    // Blokir Klik Kanan (Context Menu)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      // triggerViolation('Fitur klik kanan telah dinonaktifkan demi keamanan sistem ujian.');
    };

    // Daftarkan semua event pengamanan ke browser
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [examId, attemptId]);

  return {
    violationsCount: violations,
    setViolations, // Exporting to allow initial load sync
    showModal,
    setShowModal,
    warningMessage,
  };
}
