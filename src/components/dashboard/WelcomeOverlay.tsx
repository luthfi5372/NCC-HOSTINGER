"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ShieldCheck, Rocket } from "lucide-react";

interface WelcomeOverlayProps {
  userEntry: any;
  currentUser: any;
}

export default function WelcomeOverlay({ userEntry, currentUser }: WelcomeOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!currentUser?.id) return;

    // Gunakan kunci unik per User ID agar saat ganti akun animasi tetap muncul
    const welcomeKey = `ncc_welcome_seen_${currentUser.id}`;
    const hasSeenWelcome = sessionStorage.getItem(welcomeKey);
    
    if (!hasSeenWelcome) {
      setIsVisible(true);
      sessionStorage.setItem(welcomeKey, "true");
      
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5500); // Sedikit lebih lama untuk membaca ucapan selamat
      return () => clearTimeout(timer);
    }
  }, []);

  // Deteksi Tahap dari notes
  let stage = 1;
  if (userEntry?.notes) {
    try {
      const notes = JSON.parse(userEntry.notes);
      if (notes.current_stage) stage = notes.current_stage;
    } catch (e) {}
  }

  const getContent = () => {
    switch(stage) {
      case 2:
        return {
          icon: <Sparkles size={48} className="text-white" />,
          title: "Selamat! Anda Lolos T2",
          desc: "Perjuanganmu membuahkan hasil. Selamat bertanding di Tahap Semi Final NCC 13th!",
          color: "from-blue-600 to-cyan-500",
          shadow: "shadow-cyan-500/20"
        };
      case 3:
        return {
          icon: <Rocket size={48} className="text-white" />,
          title: "🏆 MENUJU FINAL!",
          desc: "Luar biasa! Kamu terpilih sebagai Finalis Utama. Siapkan performa terbaikmu di Grand Final!",
          color: "from-amber-500 to-orange-600",
          shadow: "shadow-orange-500/20"
        };
      default:
        return {
          icon: <ShieldCheck size={48} className="text-white" />,
          title: "Misi Dimulai!",
          desc: "Selamat datang di NCC 13th Command Center. Siapkan karya terbaikmu dan jadilah juara masa depan!",
          color: "from-blue-600 to-indigo-700",
          shadow: "shadow-blue-500/20"
        };
    }
  };

  const content = getContent();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 1.1, y: -20, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="relative max-w-lg w-full bg-white/10 border border-white/20 rounded-[3rem] p-12 text-center shadow-2xl overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${content.color} opacity-10 pointer-events-none`}></div>
            
            <div className="relative z-10">
              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className={`w-24 h-24 bg-gradient-to-br ${content.color} rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl ${content.shadow} border border-white/20`}
              >
                {content.icon}
              </motion.div>

              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-4xl font-black text-white mb-4 tracking-tight uppercase"
              >
                {content.title}
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-blue-100 text-lg font-medium leading-relaxed"
              >
                {content.desc}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 }}
                className="mt-10"
              >
                <button
                  onClick={() => setIsVisible(false)}
                  className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg active:scale-95 flex items-center gap-2 mx-auto"
                >
                  Masuk Markas Besar
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
