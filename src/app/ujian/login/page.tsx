'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Key, 
  ArrowRight,
  ShieldAlert,
  BadgeCheck,
  Loader2
} from 'lucide-react';

export default function ParticipantLogin() {
  const router = useRouter();
  const supabase = createClient();

  // State disesuaikan untuk NISN
  const [nisnInput, setNisnInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<{ title: string; desc: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. INTEGRASI DATABASE ASLI: Mencari peserta berdasarkan NISN
      // Disesuaikan secara otomatis ke tabel 'competition_entries' milik NCC 13th
      const namaTabelPendaftaran = 'competition_entries'; 
      const namaKolomNisn = 'nisn'; 

      const { data: user, error: userError } = await supabase
        .from(namaTabelPendaftaran)
        .select('*')
        .eq(namaKolomNisn, nisnInput)
        .single();

      if (userError || !user) {
        setErrorMsg({ title: 'Peserta Tidak Ditemukan', desc: 'NISN tidak terdaftar dalam sistem pendaftaran NCC 13th kami.' });
        setLoading(false); return;
      }

      // 2. CEK CABANG LOMBA
      const kolomCabang = user.competition_type || user.branch; 
      if (kolomCabang && !kolomCabang.toLowerCase().includes('mipa')) {
        setErrorMsg({ title: 'Akses Ditolak', desc: `Akun ini terdaftar di cabang ${kolomCabang}. Portal LLMS eksklusif untuk Olimpiade MIPA.` });
        setLoading(false); return;
      }

      // 3. TAMBAHAN KEAMANAN: Cek Status Verifikasi
      if (user.payment_status !== 'Verified') {
        setErrorMsg({ title: 'Peserta Belum Diverifikasi', desc: `Status pendaftaran masih ${user.payment_status}. Silakan selesaikan pembayaran dan verifikasi panitia.` });
        setLoading(false); return;
      }

      // 4. Ambil Sesi Ujian Aktif dari Database
      const { data: exams, error: examsError } = await supabase.from('cbt_exams').select('id, title');
      
      if (examsError || !exams || exams.length === 0) {
        setErrorMsg({ title: 'Tidak Ada Ujian Aktif', desc: 'Panitia belum membuka sesi ujian apapun saat ini.' });
        setLoading(false); return;
      }

      // 5. MESIN VALIDASI ROLLING TOKEN (10 Menit)
      const now = Math.floor(Date.now() / 1000);
      const interval10Min = 600;
      const currentInterval = Math.floor(now / interval10Min);
      const charPool = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      
      let matchedExam = null;
      const userToken = tokenInput.toUpperCase().trim();

      for (const exam of exams) {
        let expectedToken = "";
        let idSum = 0;
        for (let i = 0; i < exam.id.length; i++) {
          idSum += exam.id.charCodeAt(i);
        }
        let seed = (idSum + currentInterval) % 10000;
        for(let i=0; i<6; i++) {
           seed = (seed * 9301 + 49297) % 233280;
           expectedToken += charPool[Math.floor((seed / 233280) * charPool.length)];
        }

        if (userToken === expectedToken) {
          matchedExam = exam;
          break;
        }
      }

      if (!matchedExam) {
        setErrorMsg({ title: 'Token Ujian Tidak Valid', desc: 'Token salah atau sudah kedaluwarsa. Silakan lihat token terbaru di layar pengawas.' });
        setLoading(false); return;
      }

      // 6. Sukses! Masuk ke Dashboard Ujian
      localStorage.setItem('ncc_user', JSON.stringify({ ...user, active_exam_id: matchedExam.id, active_exam_title: matchedExam.title }));
      router.push('/ujian/dashboard');

    } catch (err) {
      setErrorMsg({ title: 'Gangguan Server', desc: 'Gagal terhubung ke pusat data. Lapor ke panitia.' });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fe] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[420px] bg-white p-10 rounded-[40px] shadow-[0_10px_40px_rgb(0,0,0,0.04)] relative">
        
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-[#5145cd] rounded-full mx-auto flex items-center justify-center shadow-lg shadow-indigo-200 mb-5 relative">
             <span className="text-white font-black text-4xl tracking-tighter">N</span>
             <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
               <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
             </div>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Portal Peserta NCC</h1>
          <p className="text-[9px] text-gray-400 mt-2 font-black uppercase tracking-widest">National Creativity Competition 13th</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start space-x-3">
            <ShieldAlert className="w-6 h-6 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-black text-rose-700">{errorMsg.title}</h3>
              <p className="text-[10px] text-rose-600/80 mt-1 font-semibold leading-relaxed">{errorMsg.desc}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 ml-2">Username / NISN</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                required
                value={nisnInput}
                onChange={(e) => setNisnInput(e.target.value)}
                placeholder="Masukkan NISN Anda..."
                className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-transparent rounded-[20px] text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#5145cd]/20 focus:border-[#5145cd] transition-all outline-none text-gray-800 placeholder-gray-400 shadow-inner shadow-gray-100/50"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 ml-2 flex items-center justify-between">
              <span>Token Ujian (Live)</span>
              <span className="text-[8px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full">Berubah tiap 10 mnt</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-[#5145cd]" />
              </div>
              <input
                type="text"
                required
                maxLength={6}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                placeholder="••••••"
                className="w-full pl-12 pr-5 py-4 bg-indigo-50/30 border border-indigo-100 rounded-[20px] text-lg tracking-[0.3em] font-black focus:bg-white focus:ring-2 focus:ring-[#5145cd]/20 focus:border-[#5145cd] transition-all outline-none text-[#5145cd] placeholder-indigo-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 bg-[#5145cd] hover:bg-[#3d32a8] active:scale-[0.98] text-white text-xs font-black uppercase tracking-widest rounded-[20px] transition-all shadow-lg shadow-indigo-200 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <span className="flex items-center">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memvalidasi...
              </span>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-center text-[9px] font-black text-emerald-500 uppercase tracking-widest">
           <BadgeCheck className="w-4 h-4 mr-1.5" />
           Sistem Keamanan Berlapis Aktif
        </div>
      </div>
    </div>
  );
}
