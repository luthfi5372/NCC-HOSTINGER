"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  Lock, 
  CheckCircle2, 
  ChevronRight,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { registerLocalUser } from "@/app/actions/auth";
import Link from "next/link";

export default function RegisterMinimalist() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const { getSession } = require("@/lib/localAuth");
      if (getSession()) {
        router.push("/dashboard");
      }
    }
  }, [router]);

  const update = (field: string, val: string) => {
    setForm(f => ({ ...f, [field]: val }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validation
    if (!form.username || !form.email || !form.password || !form.confirmPassword) {
      setError("Semua kolom wajib diisi.");
      return;
    }
    if (form.password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      // Create FormData exactly as expected by the Server Action
      const formData = new FormData();
      formData.append("fullName", form.username); // 'fullName' is the internal DB key for Identity
      formData.append("email", form.email);
      formData.append("password", form.password);

      const result = await registerLocalUser(formData);

      if (result.success) {
        setSubmitted(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        setError(result.error || "Gagal membuat akun. Mungkin email sudah terdaftar.");
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6 font-[family-name:var(--font-geist-sans)]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl text-center border border-slate-100"
        >
          <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Akun Berhasil Dibuat!</h2>
          <p className="text-slate-500 font-medium leading-relaxed mb-8 text-sm">
            Selamat datang di NCC. Tunggu sebentar, kami sedang mengalihkan Anda ke dashboard untuk melengkapi data lomba...
          </p>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
             <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5 }}
              className="h-full bg-emerald-500"
             />
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f9fc] flex items-center justify-center p-6 font-[family-name:var(--font-geist-sans)] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-indigo-100/30 blur-[150px] -mr-[10%] -mt-[10%] rounded-full opacity-60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-purple-100/30 blur-[120px] -ml-[10%] -mb-[10%] rounded-full opacity-60 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-[2px] text-indigo-600 shadow-sm mb-6"
          >
            <Sparkles size={12} />
            National Creativity Competition
          </motion.div>
          <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">Daftar Akun</h1>
          <p className="text-slate-400 font-medium max-w-sm mx-auto text-sm leading-relaxed">
            Buat akun baru untuk mengakses dashboard pendaftaran dan kompetisi NCC.
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-2xl rounded-[3.5rem] p-10 lg:p-14 shadow-2xl border border-white relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Username */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username / Nama Lengkap</label>
              <div className="relative group">
                <User size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => update("username", e.target.value)}
                  className="w-full pl-16 pr-6 py-5 bg-white border border-slate-100 rounded-[2rem] text-sm font-bold text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                  placeholder="Ketik username Anda..."
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Email Aktif</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="w-full pl-16 pr-6 py-5 bg-white border border-slate-100 rounded-[2rem] text-sm font-bold text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                  placeholder="nama@email.com"
                />
              </div>
            </div>

            {/* Password Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kata Sandi</label>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="password"
                      required
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      className="w-full pl-16 pr-6 py-5 bg-white border border-slate-100 rounded-[2rem] text-sm font-bold text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                      placeholder="••••••••"
                    />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Konfirmasi</label>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="password"
                      required
                      value={form.confirmPassword}
                      onChange={(e) => update("confirmPassword", e.target.value)}
                      className="w-full pl-16 pr-6 py-5 bg-white border border-slate-100 rounded-[2rem] text-sm font-bold text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                      placeholder="••••••••"
                    />
                  </div>
               </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[3px] shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>Daftar Sekarang <ChevronRight size={18} /></>
              )}
            </button>

            <div className="text-center pt-4">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                Sudah memiliki akun?{" "}
                <Link href="/login" className="text-indigo-600 hover:text-indigo-700 ml-1 transition-colors underline underline-offset-4">
                  Masuk Saja
                </Link>
              </p>
            </div>
          </form>

          {/* Secure Badge */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 text-slate-300 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
            <ShieldCheck size={14} className="text-emerald-500" />
            NCC Secure 256-Bit Authentication
          </div>
        </div>
      </motion.div>
    </main>
  );
}
