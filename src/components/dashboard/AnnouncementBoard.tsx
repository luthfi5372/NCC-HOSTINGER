import { Megaphone, Bell } from "lucide-react";

interface AnnouncementBoardProps {
  announcements: any[];
  isLoading: boolean;
}

export default function AnnouncementBoard({ announcements, isLoading }: AnnouncementBoardProps) {
  return (
    <div className="bg-white border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 min-h-[400px]">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200/50">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Megaphone size={22} className="text-blue-600" /> Papan Pengumuman Resmi
        </h2>
        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
          <Bell size={12} /> Live
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 font-medium text-sm">Menyinkronkan sinyal...</p>
        </div>
      ) : (!announcements || announcements.length === 0) ? (
        <div className="text-center py-12">
          <Megaphone size={48} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-slate-500 font-bold">Belum Ada Pengumuman</h3>
          <p className="text-slate-400 text-sm mt-1">Panitia belum menyiarkan informasi apapun saat ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement: any, idx: number) => {
            // Proteksi pembaca tanggal yang aman
            const dateObj = announcement?.created_at ? new Date(announcement.created_at) : new Date();
            const isValidDate = !isNaN(dateObj.getTime());
            const formattedDate = isValidDate ? dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-";
            const formattedTime = isValidDate ? dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "-";

            return (
              <div key={announcement?.id || idx} className="bg-white border border-slate-100 p-5 rounded-2xl hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800 text-lg">{announcement?.title || "Tanpa Judul"}</h3>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md whitespace-nowrap">
                    {formattedDate} • {formattedTime} WIB
                  </span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {announcement?.content || "-"}
                </p>
                {announcement?.image_url && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-slate-100 shadow-sm max-w-lg">
                    <img src={announcement.image_url} alt="Announcement" className="w-full h-auto object-cover" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
