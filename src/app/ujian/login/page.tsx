'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  User, 
  Key, 
  LogIn,
  ShieldAlert,
  Loader2,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function ParticipantLogin() {
  const router = useRouter();
  const supabase = createClient();

  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<{ title: string; desc: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Verifikasi Kredensial
      const { data: user, error } = await supabase
        .from('cbt_participants')
        .select('*')
        .eq('username', username)
        .eq('pin', pin)
        .single();

      if (error || !user) {
        setErrorMsg({
          title: 'Kredensial Tidak Dikenali',
          desc: 'Username atau PIN salah. Pastikan Anda mengetik sesuai kartu ujian.'
        });
        setLoading(false);
        return;
      }

      // 2. Security Gateway: Branch Locking (MIPA ONLY)
      if (user.branch !== 'MIPA') {
        setErrorMsg({
          title: 'Akses Dibatasi (Beda Cabang)',
          desc: `Akun Anda terdaftar di cabang ${user.branch}. Portal ini hanya melayani CBT cabang MIPA.`
        });
        setLoading(false);
        return;
      }

      // 3. Sukses: Simpan Sesi & Redirect
      localStorage.setItem('ncc_user', JSON.stringify(user));
      
      // Beri delay sedikit untuk efek visual sukses
      setTimeout(() => {
        router.push('/ujian'); // Redirect ke landing page ujian
      }, 800);

    } catch (err) {
      setErrorMsg({
        title: 'Koneksi Terputus',
        desc: 'Gagal terhubung ke Pusat Komando. Silakan lapor ke pengawas ruangan.'
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans select-none overflow-hidden relative">
      
      {/* 🧬 BACKGROUND ELEMENTS */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-emerald-100/50 rounded-full blur-3xl -z-10"></div>

      {/* 🔐 LOGIN CARD */}
      <div className="w-full max-w-md bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl shadow-indigo-100/50 relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Aksen Estetik */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[4rem] -z-10"></div>

        {/* Logo & Branding */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-xl shadow-indigo-200 mb-6 transform rotate-6 hover:rotate-0 transition-transform duration-500">
             <span className="text-white font-black text-4xl">N</span>
          </div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Portal Peserta NCC</h1>
          <p className="text-[10px] text-gray-400 mt-2 font-black uppercase tracking-[0.2em]">National Creativity Competition 13th</p>
        </div>

        {/* 🚨 ERROR NOTIFICATION */}
        {errorMsg && (
          <div className="mb-8 p-5 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-start space-x-4 animate-in zoom-in-95 duration-300">
            <div className="bg-rose-100 p-2 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
            </div>
            <div className="text-left">
              <h3 className="text-xs font-black text-rose-800 uppercase tracking-tight">{errorMsg.title}</h3>
              <p className="text-[10px] text-rose-600/80 mt-1 leading-relaxed font-medium">{errorMsg.desc}</p>
            </div>
          </div>
        )}

        {/* 📝 LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-2">Username / NISN</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="MIPA001..."
                className="w-full pl-14 pr-6 py-4.5 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] text-sm font-bold text-gray-700 placeholder-gray-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-2">PIN Rahasia</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="password"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••••"
                className="w-full pl-14 pr-6 py-4.5 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] text-sm font-bold text-gray-700 placeholder-gray-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 mt-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.97] text-white text-xs font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Footer Info */}
        <div className="mt-10 pt-6 border-t border-gray-50 flex items-center justify-center gap-2">
           <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
           <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Sistem Keamanan Berlapis Aktif</p>
        </div>

      </div>
    </div>
  );
}
