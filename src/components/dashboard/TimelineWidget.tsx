import { 
  Calendar, Pin, FileText, Megaphone, Upload, 
  Trophy, Brain, Zap, MonitorPlay, Star, Video 
} from "lucide-react";

const TIMELINE_DATA = [
  {
    category: "LKTI – Lomba Karya Tulis Ilmiah",
    color: "blue",
    waves: [
      {
        label: "Gelombang I",
        active: true,
        items: [
          { icon: FileText, label: "Pendaftaran & Abstrak", date: "16 Juli – 3 September" },
          { icon: Megaphone, label: "Pengumuman Tahap I", date: "10 September" },
          { icon: Upload, label: "Pengumpulan Fullpaper", date: "12 – 18 September" },
          { icon: Trophy, label: "Pengumuman Tahap II", date: "26 September" },
        ]
      },
      {
        label: "Gelombang II",
        active: false,
        items: [
          { icon: FileText, label: "Pendaftaran & Abstrak", date: "1 – 25 Oktober" },
          { icon: Megaphone, label: "Pengumuman Tahap I", date: "31 Oktober" },
          { icon: Upload, label: "Pengumpulan Fullpaper", date: "1 – 9 November" },
          { icon: Trophy, label: "Pengumuman Tahap II", date: "16 November" },
        ]
      }
    ]
  },
  {
    category: "Olimpiade MIPA",
    color: "amber",
    waves: [
      {
        label: "Gelombang I",
        active: true,
        items: [
          { icon: FileText, label: "Pendaftaran", date: "16 Juli – 3 September" },
          { icon: Brain, label: "Seleksi 1", date: "10 September" },
          { icon: Zap, label: "Seleksi 2", date: "14 September" },
          { icon: Star, label: "Pengumuman Tahap I", date: "21 September" },
        ]
      },
      {
        label: "Gelombang II",
        active: false,
        items: [
          { icon: FileText, label: "Pendaftaran", date: "1 – 25 Oktober" },
          { icon: MonitorPlay, label: "Simulasi", date: "29 Oktober" },
          { icon: Zap, label: "Seleksi", date: "2 November" },
          { icon: Megaphone, label: "Pengumuman", date: "8 November" },
        ]
      }
    ]
  },
  {
    category: "Speech Contest",
    color: "purple",
    waves: [
      {
        label: "Gelombang I",
        active: true,
        items: [
          { icon: FileText, label: "Pendaftaran & Naskah", date: "16 Juli – 3 September" },
          { icon: Megaphone, label: "Pengumuman", date: "14 September" },
        ]
      },
      {
        label: "Gelombang II",
        active: false,
        items: [
          { icon: FileText, label: "Pendaftaran & Naskah", date: "1 – 25 Oktober" },
          { icon: Megaphone, label: "Pengumuman", date: "14 November" },
        ]
      }
    ]
  },
  {
    category: "MTQ",
    color: "green",
    waves: [
      {
        label: "Gelombang I",
        active: true,
        items: [
          { icon: Video, label: "Pendaftaran & Video", date: "16 Juli – 3 September" },
          { icon: Megaphone, label: "Pengumuman", date: "14 September" },
        ]
      },
      {
        label: "Gelombang II",
        active: false,
        items: [
          { icon: FileText, label: "Pendaftaran", date: "1 – 25 Oktober" },
          { icon: Megaphone, label: "Pengumuman", date: "14 November" },
        ]
      }
    ]
  }
];

interface TimelineProps {
  userCategory?: string;
  userStatus?: string;
  notes?: string;
  globalTimeline?: any[];
}

export default function TimelineWidget({ userCategory, userStatus, notes, globalTimeline }: TimelineProps) {
  // Mapping antara kategori di database dengan kategori di TIMELINE_DATA
  const categoryMap: Record<string, string> = {
    "LKTI Nasional": "LKTI – Lomba Karya Tulis Ilmiah",
    "Olimpiade MIPA": "Olimpiade MIPA",
    "Speech Contest": "Speech Contest",
    "MTQ": "MTQ"
  };

  // Icon Mapper berdasarkan label item
  const getIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('pendaftaran') || l.includes('naskah') || l.includes('video')) return FileText;
    if (l.includes('pengumuman')) return Megaphone;
    if (l.includes('fullpaper') || l.includes('unggah') || l.includes('karya')) return Upload;
    if (l.includes('seleksi') || l.includes('simulasi')) return Brain;
    if (l.includes('final') || l.includes('juara')) return Trophy;
    return Zap;
  };

  // Color Mapper berdasarkan kategori
  const getCategoryColor = (cat: string) => {
    if (cat.includes('LKTI')) return 'blue';
    if (cat.includes('MIPA')) return 'amber';
    if (cat.includes('Speech')) return 'purple';
    if (cat.includes('MTQ')) return 'green';
    return 'blue';
  };

  // Gunakan globalTimeline jika ada, jika tidak fallback ke TIMELINE_DATA
  const baseData = globalTimeline && globalTimeline.length > 0 
    ? globalTimeline.map(cat => ({
        category: cat.category,
        color: getCategoryColor(cat.category),
        waves: cat.waves.map((wave: any) => ({
          label: wave.label,
          active: true, // Untuk user, kita buat active secara default jika masuk di jadwal
          items: wave.items.map((item: any) => ({
            icon: getIcon(item.label),
            label: item.label,
            date: item.date
          }))
        }))
      }))
    : TIMELINE_DATA;

  // Tentukan apakah kita harus memfilter data berdasarkan kategori user
  const targetCategoryName = userCategory ? categoryMap[userCategory] : null;
  
  // Jika user sudah terdaftar di kategori tertentu, hanya tampilkan kategori tersebut
  // Jika belum, tampilkan semua (untuk info)
  const filteredData = targetCategoryName 
    ? baseData.filter(item => item.category === targetCategoryName || item.category === userCategory)
    : baseData;

  const isFiltered = !!targetCategoryName && filteredData.length > 0;

  // Logika Menentukan Tahap Mana yang Harus Menyala
  const getProgressLevel = (status?: string, notesStr?: string) => {
    // 1. Cek dari notes (current_stage) yang diatur admin
    if (notesStr) {
      try {
        const parsed = JSON.parse(notesStr);
        if (parsed.current_stage) return parseInt(parsed.current_stage);
      } catch (e) {}
    }

    // 2. Fallback ke status string jika notes tidak ada
    if (!status) return 1;
    const s = status.toLowerCase();
    if (s.includes('final') || s.includes('tahap 3')) return 3;
    if (s.includes('semi') || s.includes('tahap 2') || s.includes('seleksi 2')) return 2;
    if (s.includes('verified') || s.includes('success') || s.includes('tahap 1')) return 1;
    
    return 1;
  };

  const userProgress = getProgressLevel(userStatus, notes);

  const getItemActiveState = (itemLabel: string) => {
    if (!isFiltered) return true;
    const label = itemLabel.toLowerCase();
    
    // Logika highlight berdasarkan level progres
    if (label.includes('tahap iii') || label.includes('grand final') || label.includes('final')) return userProgress >= 3;
    if (label.includes('tahap ii') || label.includes('fullpaper') || label.includes('seleksi 2') || label.includes('semi final')) return userProgress >= 2;
    
    return userProgress >= 1;
  };

  const getColorClasses = (color: string, isActive: boolean) => {
    if (!isActive) return {
      dot: "bg-slate-200",
      ring: "ring-slate-50",
      text: "text-slate-300",
      bg: "bg-slate-50",
      border: "border-slate-100",
      accent: "text-slate-300",
      cardBorder: "border-slate-100",
      cardShadow: "shadow-none",
      opacity: "opacity-40 grayscale pointer-events-none"
    };

    const maps: any = {
      blue: {
        dot: "bg-blue-500",
        ring: "ring-blue-100",
        text: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-100",
        accent: "text-blue-600",
        cardBorder: "hover:border-blue-300",
        cardShadow: "hover:shadow-blue-50/50"
      },
      amber: {
        dot: "bg-amber-500",
        ring: "ring-amber-100",
        text: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-100",
        accent: "text-amber-600",
        cardBorder: "hover:border-amber-300",
        cardShadow: "hover:shadow-amber-50/50"
      },
      purple: {
        dot: "bg-purple-500",
        ring: "ring-purple-100",
        text: "text-purple-600",
        bg: "bg-purple-50",
        border: "border-purple-100",
        accent: "text-purple-600",
        cardBorder: "hover:border-purple-300",
        cardShadow: "hover:shadow-purple-50/50"
      },
      green: {
        dot: "bg-green-500",
        ring: "ring-green-100",
        text: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-100",
        accent: "text-green-600",
        cardBorder: "hover:border-green-300",
        cardShadow: "hover:shadow-green-50/50"
      }
    };
    return maps[color] || maps.blue;
  };

  return (
    <div className="bg-white border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 mt-8">
      <div className="flex items-center gap-3 mb-8 pb-5 border-b border-slate-200/50">
        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
          <Calendar size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {isFiltered ? `Jadwal Khusus ${userCategory}` : "Jadwal Perlombaan NCC 13th"}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isFiltered ? "Berdasarkan kategori lomba yang Anda ikuti" : "Seluruh cabang lomba • Gelombang I & II"}
          </p>
        </div>
      </div>

      <div className="space-y-12">
        {filteredData.map((category, idx) => (
          <div key={idx} className="group/timeline">
            <div className="flex items-center gap-3 mb-6 transition-transform group-hover/timeline:translate-x-1 duration-300">
              <span className={`w-3.5 h-3.5 rounded-full ${getColorClasses(category.color, true).dot} ring-4 ${getColorClasses(category.color, true).ring} shrink-0`}></span>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">{category.category}</h3>
            </div>
            
            <div className="relative pl-6 border-l-2 border-dashed border-slate-200/80 space-y-10 ml-[5px]">
              {category.waves.map((wave, wIdx) => {
                const styles = getColorClasses(category.color, wave.active);
                return (
                  <div key={wIdx} className="relative">
                    <div className={`absolute -left-[30px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-4 ${styles.dot.replace('bg-', 'border-')} shadow-sm ${wave.active ? 'animate-pulse' : ''}`}></div>
                    <span className={`text-[10px] font-black ${styles.text} uppercase tracking-widest ${styles.bg} px-2.5 py-1 rounded-lg border ${styles.border}`}>
                      {wave.label}
                    </span>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-5">
                      {wave.items.map((item, iIdx) => {
                        const isItemActive = getItemActiveState(item.label);
                        const itemStyles = getColorClasses(category.color, isItemActive);
                        
                        return (
                          <div key={iIdx} className={`bg-white border border-slate-100 ${itemStyles.cardBorder} hover:shadow-xl ${itemStyles.cardShadow} p-5 rounded-2xl transition-all duration-300 transform ${isItemActive ? 'hover:-translate-y-1' : ''} flex flex-col justify-between min-w-0 relative z-10 ${itemStyles.opacity || ''}`}>
                            <div className="flex items-start gap-3 mb-4">
                               <div className={`p-2 rounded-xl ${itemStyles.bg} ${itemStyles.text} shrink-0`}>
                                 <item.icon size={16} />
                               </div>
                               <p className="text-xs font-bold text-slate-700 leading-relaxed break-words">{item.label}</p>
                            </div>
                            <div className="mt-auto">
                              <p className={`text-[10px] ${itemStyles.accent} font-black bg-white border ${itemStyles.border} px-3 py-1.5 rounded-lg inline-block break-all sm:break-normal`}>
                                {item.date}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            {idx < filteredData.length - 1 && <hr className="border-slate-100/80 mt-12 mb-0" />}
          </div>
        ))}

        {/* ── 📌 TM SEMUA LOMBA ── */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-[2rem] p-6 flex items-center gap-5 hover:shadow-xl hover:shadow-indigo-100 transition-all duration-500 group relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-5%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-all duration-300">
            <Pin size={28} className="text-white animate-bounce" />
          </div>
          <div>
            <p className="font-black text-white text-base tracking-wide">Technical Meeting – Semua Lomba</p>
            <p className="text-indigo-100 text-xs font-bold mt-1.5 bg-black/20 px-3 py-1 rounded-xl w-max border border-white/10">18 November • Semua Cabang Lomba</p>
          </div>
        </div>
      </div>
    </div>
  );
}
