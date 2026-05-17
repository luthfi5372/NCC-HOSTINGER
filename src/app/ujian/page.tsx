'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UjianRootRedirect() {
  const router = useRouter();

  useEffect(() => {
    // 1. Cek memori browser apakah peserta sudah melewati gerbang login baru
    const savedUser = localStorage.getItem('ncc_user');
    
    if (savedUser) {
      // 2. Jika sudah punya tiket masuk, langsung teleportasi ke Dashboard
      router.push('/ujian/dashboard');
    } else {
      // 3. Jika belum punya tiket masuk, tendang ke gerbang login resmi
      router.push('/ujian/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f4f7fe] flex items-center justify-center font-sans">
      <div className="flex flex-col items-center justify-center animate-pulse">
        {/* Animasi loading elegan saat proses pengalihan berlangsung */}
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-[#5145cd] rounded-full animate-spin mb-4 shadow-sm"></div>
        <p className="text-[10px] font-black text-[#5145cd] uppercase tracking-widest">
          Mengalihkan Rute Aman...
        </p>
      </div>
    </div>
  );
}
