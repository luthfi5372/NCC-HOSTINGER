import { Megaphone, Bell, AlertCircle, AlertTriangle, Trophy, Calendar, CreditCard, Info } from "lucide-react";
import { motion } from "framer-motion";

interface AnnouncementBoardProps {
  announcements: any[];
  isLoading: boolean;
}

const getAnnouncementConfig = (title: string, content: string) => {
  const normalizedText = `${title || ""} ${content || ""}`.toLowerCase();
  
  // 1. Red Alert Theme
  if (title.includes("🚨") || normalizedText.includes("darurat") || normalizedText.includes("bahaya") || normalizedText.includes("urgent")) {
    return {
      icon: AlertCircle,
      colorClass: "text-rose-600 bg-rose-50 border-rose-100/80 shadow-rose-100/50",
      accentBorder: "border-l-rose-500",
      bgHoverClass: "hover:border-rose-200/80 hover:shadow-[0_8px_30px_rgb(244,63,94,0.03)]",
      gradientGlow: "from-rose-500/[0.04] to-transparent",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200/50",
      titleColor: "text-rose-950"
    };
  }
  
  // 2. Yellow Warning Theme
  if (title.includes("⚠️") || normalizedText.includes("perhatian") || normalizedText.includes("penting") || normalizedText.includes("warning")) {
    return {
      icon: AlertTriangle,
      colorClass: "text-amber-600 bg-amber-50 border-amber-100/80 shadow-amber-100/50",
      accentBorder: "border-l-amber-500",
      bgHoverClass: "hover:border-amber-200/80 hover:shadow-[0_8px_30px_rgb(245,158,11,0.03)]",
      gradientGlow: "from-amber-500/[0.04] to-transparent",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200/50",
      titleColor: "text-amber-950"
    };
  }

  // 3. Green Success/Trophy Theme
  if (title.includes("🏆") || title.includes("🥇") || normalizedText.includes("juara") || normalizedText.includes("pemenang") || normalizedText.includes("lolos") || normalizedText.includes("sukses") || normalizedText.includes("berhasil")) {
    return {
      icon: Trophy,
      colorClass: "text-emerald-600 bg-emerald-50 border-emerald-100/80 shadow-emerald-100/50",
      accentBorder: "border-l-emerald-500",
      bgHoverClass: "hover:border-emerald-200/80 hover:shadow-[0_8px_30px_rgb(16,185,129,0.03)]",
      gradientGlow: "from-emerald-500/[0.04] to-transparent",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
      titleColor: "text-emerald-950"
    };
  }

  // 4. Purple Calendar Theme
  if (title.includes("📅") || title.includes("🗓️") || normalizedText.includes("jadwal") || normalizedText.includes("timeline") || normalizedText.includes("tanggal")) {
    return {
      icon: Calendar,
      colorClass: "text-violet-600 bg-violet-50 border-violet-100/80 shadow-violet-100/50",
      accentBorder: "border-l-violet-500",
      bgHoverClass: "hover:border-violet-200/80 hover:shadow-[0_8px_30px_rgb(139,92,246,0.03)]",
      gradientGlow: "from-violet-500/[0.04] to-transparent",
      badgeColor: "bg-violet-50 text-violet-700 border-violet-200/50",
      titleColor: "text-violet-950"
    };
  }

  // 5. Teal Payment/Money Theme
  if (title.includes("💰") || title.includes("💳") || normalizedText.includes("pembayaran") || normalizedText.includes("transfer") || normalizedText.includes("biaya") || normalizedText.includes("tagihan")) {
    return {
      icon: CreditCard,
      colorClass: "text-teal-600 bg-teal-50 border-teal-100/80 shadow-teal-100/50",
      accentBorder: "border-l-teal-500",
      bgHoverClass: "hover:border-teal-200/80 hover:shadow-[0_8px_30px_rgb(20,184,166,0.03)]",
      gradientGlow: "from-teal-500/[0.04] to-transparent",
      badgeColor: "bg-teal-50 text-teal-700 border-teal-200/50",
      titleColor: "text-teal-950"
    };
  }

  // 6. Blue Broadcast Theme (Default Megaphone)
  if (title.includes("📢") || title.includes("📣") || normalizedText.includes("pengumuman") || normalizedText.includes("siaran") || normalizedText.includes("broadcast")) {
    return {
      icon: Megaphone,
      colorClass: "text-blue-600 bg-blue-50 border-blue-100/80 shadow-blue-100/50",
      accentBorder: "border-l-blue-500",
      bgHoverClass: "hover:border-blue-200/80 hover:shadow-[0_8px_30px_rgb(59,130,246,0.03)]",
      gradientGlow: "from-blue-500/[0.04] to-transparent",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200/50",
      titleColor: "text-blue-950"
    };
  }

  // Default Slate Theme
  return {
    icon: Info,
    colorClass: "text-slate-600 bg-slate-50 border-slate-100/80 shadow-slate-100/50",
    accentBorder: "border-l-slate-400",
    bgHoverClass: "hover:border-slate-200/80 hover:shadow-[0_8px_30px_rgb(100,116,139,0.03)]",
    gradientGlow: "from-slate-500/[0.04] to-transparent",
    badgeColor: "bg-slate-50 text-slate-700 border-slate-200/50",
    titleColor: "text-slate-900"
  };
};

const stripEmojis = (str: string) => {
  if (!str) return "";
  return str.replace(/[\p{Emoji_Presentation}\p{Emoji}\u200d\uFE0F]/gu, '').trim();
};

const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring" as const,
      stiffness: 350,
      damping: 26
    }
  }
};

export default function AnnouncementBoard({ announcements, isLoading }: AnnouncementBoardProps) {
  return (
    <div className="bg-white border border-slate-100/85 shadow-[0_8px_30px_rgb(0,0,0,0.015)] rounded-3xl p-6 md:p-8 min-h-[400px] flex flex-col">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
          <Megaphone size={22} className="text-indigo-600" /> Papan Pengumuman Resmi
        </h2>
        <span className="bg-rose-50 text-rose-600 border border-rose-100/70 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-rose-100/50">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
          Live
        </span>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12">
          <div className="w-10 h-10 border-[3.5px] border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 font-semibold text-sm tracking-wide animate-pulse">Menyinkronkan pengumuman...</p>
        </div>
      ) : (!announcements || announcements.length === 0) ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Megaphone size={28} className="text-slate-300" />
          </div>
          <h3 className="text-slate-600 font-bold text-base">Belum Ada Pengumuman</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-[280px]">Panitia belum menyiarkan informasi apapun saat ini.</p>
        </div>
      ) : (
        <motion.div 
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {announcements.map((announcement: any, idx: number) => {
            const dateObj = announcement?.created_at ? new Date(announcement.created_at) : new Date();
            const isValidDate = !isNaN(dateObj.getTime());
            const formattedDate = isValidDate ? dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-";
            const formattedTime = isValidDate ? dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "-";

            const displayContent = (() => {
              if (announcement?.message) return announcement.message;
              try {
                const parsed = JSON.parse(announcement?.content);
                return parsed.message || announcement?.content || "-";
              } catch (e) {
                return announcement?.content || "-";
              }
            })();

            const rawTitle = announcement?.title || "Tanpa Judul";
            const cleanTitle = stripEmojis(rawTitle);
            const config = getAnnouncementConfig(rawTitle, displayContent);
            const IconComponent = config.icon;

            return (
              <motion.div 
                key={announcement?.id || idx} 
                variants={cardVariants}
                whileHover={{ y: -2 }}
                className={`group relative overflow-hidden bg-white border border-slate-100/90 ${config.accentBorder} border-l-[4px] p-5 rounded-2xl ${config.bgHoverClass} transition-all duration-300 shadow-sm shadow-slate-100/20`}
                style={{ willChange: "transform" }}
              >
                {/* Glow effect on hover */}
                <div className={`absolute inset-0 bg-gradient-to-r ${config.gradientGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

                <div className="relative z-10 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    {/* Title with sleek Icon Badge */}
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${config.colorClass}`}>
                        <IconComponent size={18} />
                      </div>
                      <h3 className={`font-bold ${config.titleColor} text-base sm:text-lg leading-snug tracking-tight`}>
                        {cleanTitle}
                      </h3>
                    </div>
                    {/* Date/time badge */}
                    <span className={`self-start sm:self-auto text-[10px] font-bold border rounded-lg px-2.5 py-1 whitespace-nowrap shadow-sm shadow-slate-100/50 ${config.badgeColor}`}>
                      {formattedDate} • {formattedTime} WIB
                    </span>
                  </div>

                  {/* Message body */}
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap pl-0 sm:pl-12">
                    {displayContent}
                  </p>

                  {/* Image attachment */}
                  {announcement?.image_url && (
                    <div className="mt-2 rounded-2xl overflow-hidden border border-slate-100 shadow-md max-w-lg transition-transform duration-300 group-hover:scale-[1.005] sm:ml-12">
                      <img src={announcement.image_url} alt="Announcement" className="w-full h-auto object-cover" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
