import { useState } from "react";
import { X, Upload, CheckCircle2 } from "lucide-react";

interface RegistrationModalProps {
  initialData: any;
  isSubmitting: boolean;
  setShowForm: (show: boolean) => void;
  onSubmit: (data: any, file: File | null) => void;
}

export default function RegistrationModal({
  initialData,
  isSubmitting,
  setShowForm,
  onSubmit
}: RegistrationModalProps) {
  // 🚀 LITE VERSION: No heavy blurs or complex transitions to ensure zero lag
  const [formData, setFormData] = useState(initialData);
  const [file, setFile] = useState<File | null>(null);

  const isTeamEvent = formData?.competition_type === "Olimpiade MIPA" || formData?.competition_type === "LKTI Nasional";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData, file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70">
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Finalisasi Pendaftaran</h2>
            <p className="text-xs text-slate-500 font-medium">Lengkapi data terakhir untuk verifikasi.</p>
          </div>
          <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">Asal Sekolah</label>
              <input required type="text" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none" 
                placeholder="Contoh: SMA Darul Ulum 1" 
                value={formData.school_name}
                onChange={(e) => setFormData({...formData, school_name: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">
                {isTeamEvent ? "NISN (Ketua Tim)" : "NISN"}
              </label>
              <input required type="number" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none" 
                placeholder="Nomor Induk Siswa" 
                value={formData.nisn}
                onChange={(e) => setFormData({...formData, nisn: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">Cabang Lomba</label>
              <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-blue-500 outline-none cursor-pointer"
                value={formData.competition_type}
                onChange={(e) => setFormData({...formData, competition_type: e.target.value})}>
                <option value="Olimpiade MIPA">Olimpiade MIPA</option>
                <option value="Speech Contest">Speech Contest</option>
                <option value="LKTI Nasional">LKTI Nasional</option>
                <option value="MTQ">MTQ</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">
                {isTeamEvent ? "Nama Ketua Tim (Anggota 1)" : "Nama Lengkap"}
              </label>
              <input required type="text" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none" 
                placeholder="Nama Lengkap" 
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">Provinsi Asal</label>
              <select required value={formData.province} onChange={(e) => setFormData({...formData, province: e.target.value})}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-blue-500 outline-none cursor-pointer">
                <option value="" disabled>Pilih Provinsi...</option>
                <option value="Aceh">Aceh</option>
                <option value="Sumatera Utara">Sumatera Utara</option>
                <option value="Sumatera Barat">Sumatera Barat</option>
                <option value="Riau">Riau</option>
                <option value="Kepulauan Riau">Kepulauan Riau</option>
                <option value="Jambi">Jambi</option>
                <option value="Bengkulu">Bengkulu</option>
                <option value="Sumatera Selatan">Sumatera Selatan</option>
                <option value="Kepulauan Bangka Belitung">Kepulauan Bangka Belitung</option>
                <option value="Lampung">Lampung</option>
                <option value="Banten">Banten</option>
                <option value="DKI Jakarta">DKI Jakarta</option>
                <option value="Jawa Barat">Jawa Barat</option>
                <option value="Jawa Tengah">Jawa Tengah</option>
                <option value="DI Yogyakarta">DI Yogyakarta</option>
                <option value="Jawa Timur">Jawa Timur</option>
                <option value="Bali">Bali</option>
                <option value="Nusa Tenggara Barat">Nusa Tenggara Barat</option>
                <option value="Nusa Tenggara Timur">Nusa Tenggara Timur</option>
                <option value="Kalimantan Barat">Kalimantan Barat</option>
                <option value="Kalimantan Tengah">Kalimantan Tengah</option>
                <option value="Kalimantan Selatan">Kalimantan Selatan</option>
                <option value="Kalimantan Timur">Kalimantan Timur</option>
                <option value="Kalimantan Utara">Kalimantan Utara</option>
                <option value="Sulawesi Utara">Sulawesi Utara</option>
                <option value="Gorontalo">Gorontalo</option>
                <option value="Sulawesi Tengah">Sulawesi Tengah</option>
                <option value="Sulawesi Barat">Sulawesi Barat</option>
                <option value="Sulawesi Selatan">Sulawesi Selatan</option>
                <option value="Sulawesi Tenggara">Sulawesi Tenggara</option>
                <option value="Maluku Utara">Maluku Utara</option>
                <option value="Maluku">Maluku</option>
                <option value="Papua Barat">Papua Barat</option>
                <option value="Papua Barat Daya">Papua Barat Daya</option>
                <option value="Papua">Papua</option>
                <option value="Papua Tengah">Papua Tengah</option>
                <option value="Papua Pegunungan">Papua Pegunungan</option>
                <option value="Papua Selatan">Papua Selatan</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">Bukti Transfer</label>
              <div className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer relative ${file ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 hover:border-blue-300 bg-slate-50'}`}>
                <input required type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${file ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400 shadow-sm'}`}>
                    {file ? <CheckCircle2 size={20} /> : <Upload size={20} />}
                  </div>
                  <p className={`text-[11px] font-bold ${file ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {file ? file.name : "Klik pilih berkas"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BLOK DINAMIS TIM */}
          <div className={`md:col-span-2 ${isTeamEvent ? "block mt-2" : "hidden"}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="md:col-span-1">
                <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1 px-1">Nama Tim</label>
                <input type="text" className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none" 
                  placeholder="Contoh: Tim Einstein" 
                  value={formData.team_name}
                  onChange={(e) => setFormData({...formData, team_name: e.target.value})} required={isTeamEvent} />
              </div>
              <div className="md:col-span-1">
                <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1 px-1">Anggota 2</label>
                <input type="text" className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none" 
                  placeholder="Nama Lengkap" 
                  value={formData.participant2_name}
                  onChange={(e) => setFormData({...formData, participant2_name: e.target.value})} required={isTeamEvent} />
              </div>
              <div className="md:col-span-1">
                <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1 px-1">NISN Anggota 2</label>
                <input type="number" className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none" 
                  placeholder="NISN" 
                  value={formData.participant2_nisn}
                  onChange={(e) => setFormData({...formData, participant2_nisn: e.target.value})} required={isTeamEvent} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="md:col-span-2 mt-4 bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg active:scale-[0.99] transition-all disabled:opacity-50">
            {isSubmitting ? "MEMPROSES..." : "KIRIM PENDAFTARAN SEKARANG"}
          </button>
        </form>
      </div>
    </div>
  );
}
