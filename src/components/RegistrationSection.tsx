"use client";

import { motion } from "framer-motion";
import { UserPlus, Send, CheckCircle, ArrowRight } from "lucide-react";

import Link from "next/link";

export default function RegistrationSection() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const { getSession } = require("@/lib/localAuth");
      setUser(getSession());
    }
  }, []);

  return (
    <section id="daftar" className="relative z-10 py-24 px-6 sm:px-10 bg-transparent">
      {/* ... previous content ... */}
      <div className="text-center mb-16 max-w-2xl mx-auto">
        <h2
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-slate-900"
          style={{ fontFamily: "var(--font-display, var(--font-space-grotesk))" }}
        >
          Proses Pendaftaran
        </h2>
        <p className="text-slate-600 text-lg">
          Tiga langkah mudah untuk bergabung di panggung nasional.
        </p>
      </div>

      {/* Steps omitted for brevity - keeping them in the actual file */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {[
          {
            step: 1,
            icon: UserPlus,
            title: "Buat Akun",
            desc: "Daftarkan diri dengan Username, Email, dan Password dalam sekejap.",
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-100",
          },
          {
            step: 2,
            icon: Send,
            title: "Pilih Lomba",
            desc: "Masuk ke dashboard dan pilih kategori kompetisi yang ingin kamu ikuti.",
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            border: "border-indigo-100",
          },
          {
            step: 3,
            icon: CheckCircle,
            title: "Konfirmasi",
            desc: "Lengkapi data sekolah dan WhatsApp di dashboard untuk verifikasi pendaftaran.",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-emerald-100",
          },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, scale: 0.90, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ 
                delay: i * 0.1, 
                duration: 0.6, 
                type: "spring", 
                stiffness: 100, 
                damping: 15 
              }}
              whileHover={{ 
                y: -10, 
                scale: 1.03,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              className="bg-white border border-slate-200 rounded-3xl p-8 text-center relative shadow-sm cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 transition-shadow"
            >
              <div className={`absolute -top-4 -right-2 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border bg-white ${item.border} ${item.color}`} style={{ fontFamily: "var(--font-display)" }}>
                {item.step}
              </div>

              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 border ${item.bg} ${item.border}`}>
                <Icon size={26} className={item.color} />
              </div>

              <h3 className={`text-lg font-bold mb-3 ${item.color}`} style={{ fontFamily: "var(--font-display)" }}>
                {item.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* NEW CTA BUTTON (Replaces old form) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="max-w-lg mx-auto text-center"
      >
        <div className="relative inline-block group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <Link 
            href={user ? "/dashboard" : "/daftar"}
            className="relative flex items-center gap-3 px-12 py-6 bg-indigo-600 text-white rounded-[2.2rem] font-black text-xs uppercase tracking-[3px] shadow-2xl hover:bg-slate-900 transition-all active:scale-95"
          >
            {user ? "Buka Dashboard" : "Daftar Sekarang"} <ArrowRight size={20} />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
    </section>
  );
}
