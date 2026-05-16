'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

interface CheatRadarProps {
  attemptId: string;
  onViolate: (count: number) => void;
  maxViolations?: number;
}

export default function CheatRadar({ attemptId, onViolate, maxViolations = 3 }: CheatRadarProps) {
  const supabase = createClient();
  const [localViolations, setLocalViolations] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  
  const violationCooldown = useRef(false);

  const reportViolation = async (reason: string) => {
    if (violationCooldown.current) return;
    
    violationCooldown.current = true;
    setTimeout(() => { violationCooldown.current = false; }, 2000); // 2s cooldown

    setLocalViolations(prev => {
      const next = prev + 1;
      
      // Update Database
      supabase
        .from('cbt_attempts')
        .update({ violations_count: next })
        .eq('id', attemptId)
        .then(({ error }) => {
          if (error) console.error('Gagal lapor pelanggaran:', error);
        });

      // Show Alert
      setAlertMessage(reason);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);

      onViolate(next);
      return next;
    });
  };

  useEffect(() => {
    if (!attemptId) return;

    const handleVisibility = () => {
      if (document.hidden) {
        reportViolation('Terdeteksi berpindah tab browser!');
      }
    };

    const handleBlur = () => {
      reportViolation('Terdeteksi membuka aplikasi lain atau window baru!');
    };

    const handleFullscreen = () => {
      if (!document.fullscreenElement) {
        reportViolation('Peringatan: Kamu keluar dari mode Fullscreen!');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        reportViolation('Akses Developer Tools diblokir!');
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
        e.preventDefault();
        reportViolation('Shortcut Inspect Element diblokir!');
      }
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        reportViolation('View Source diblokir!');
      }
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreen);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreen);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [attemptId]);

  if (!showAlert) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-10 duration-500">
      <div className="bg-white border-2 border-rose-500 rounded-3xl p-6 shadow-2xl flex items-center space-x-5 max-w-md">
        <div className="p-4 bg-rose-50 rounded-2xl">
          <ShieldAlert className="w-8 h-8 text-rose-600 animate-pulse" />
        </div>
        <div>
          <h4 className="font-black text-rose-600 text-sm uppercase tracking-widest">Cheat Radar Alert!</h4>
          <p className="text-slate-500 text-xs mt-1 font-medium leading-relaxed">{alertMessage}</p>
          <div className="mt-3 flex items-center">
            <div className="flex space-x-1.5">
              {[...Array(maxViolations)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-6 h-2 rounded-full transition-all duration-500 ${i < localViolations ? 'bg-rose-500 shadow-lg shadow-rose-200' : 'bg-slate-100'}`}
                />
              ))}
            </div>
            <span className="ml-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
              {localViolations} / {maxViolations}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
