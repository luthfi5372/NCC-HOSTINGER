import { useState } from "react";
import { X, Upload, CheckCircle2, Link as LinkIcon, Instagram, Image, FileText, Gift } from "lucide-react";

interface RegistrationModalProps {
  initialData: any;
  isSubmitting: boolean;
  setShowForm: (show: boolean) => void;
  onSubmit: (data: any, files: { [key: string]: File | null }) => void;
}

export default function RegistrationModal({
  initialData,
  isSubmitting,
  setShowForm,
  onSubmit
}: RegistrationModalProps) {
  const [formData, setFormData] = useState(initialData);

  // States untuk menyimpan file yang dipilih
  const [instagramFollow, setInstagramFollow] = useState<File | null>(null);
  const [formalPhoto1, setFormalPhoto1] = useState<File | null>(null);
  const [studentCard1, setStudentCard1] = useState<File | null>(null);
  const [twibbon1, setTwibbon1] = useState<File | null>(null);

  const [formalPhoto2, setFormalPhoto2] = useState<File | null>(null);
  const [studentCard2, setStudentCard2] = useState<File | null>(null);
  const [twibbon2, setTwibbon2] = useState<File | null>(null);

  const isTeamEvent = formData?.competition_type === "LKTI Nasional";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi berkas wajib
    if (!instagramFollow) {
      alert("Mohon unggah bukti follow Instagram NCC!");
      return;
    }
    if (!formalPhoto1) {
      alert("Mohon unggah Foto Formal Peserta / Ketua Tim!");
      return;
    }
    if (!studentCard1) {
      alert("Mohon unggah Scan Kartu Pelajar Peserta / Ketua Tim!");
      return;
    }

    if (isTeamEvent) {
      if (!formalPhoto2) {
        alert("Mohon unggah Foto Formal Anggota Tim!");
        return;
      }
      if (!studentCard2) {
        alert("Mohon unggah Scan Kartu Pelajar Anggota Tim!");
        return;
      }
    }

    onSubmit(formData, {
      instagramFollow,
      formalPhoto1,
      studentCard1,
      twibbon1,
      formalPhoto2,
      studentCard2,
      twibbon2
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 p-8 shadow-2xl overflow-y-auto max-h-[90vh] relative animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Finalisasi Pendaftaran</h2>
            <p className="text-xs text-slate-500 font-medium">Lengkapi data terakhir & berkas pendukung untuk verifikasi.</p>
          </div>
          <button 
            type="button" 
            onClick={() => setShowForm(false)} 
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Cabang Lomba */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">Cabang Lomba</label>
              <select 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-blue-500 outline-none cursor-pointer"
                value={formData.competition_type}
                onChange={(e) => setFormData({...formData, competition_type: e.target.value})}
              >
                <option value="Olimpiade MIPA">Olimpiade MIPA</option>
                <option value="Speech Contest">Speech Contest</option>
                <option value="LKTI Nasional">LKTI Nasional</option>
                <option value="MTQ Nasional">MTQ Nasional</option>
              </select>
            </div>

            {/* Provinsi Asal */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">Provinsi Asal</label>
              <select 
                required 
                value={formData.province} 
                onChange={(e) => setFormData({...formData, province: e.target.value})}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:border-blue-500 outline-none cursor-pointer"
              >
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

            {/* Nama Ketua / Peserta */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">
                {isTeamEvent ? "Nama Ketua Tim (Anggota 1)" : "Nama Lengkap"}
              </label>
              <input 
                required 
                type="text" 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none font-semibold text-slate-700" 
                placeholder="Nama Lengkap" 
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
              />
            </div>

            {/* NISN Ketua / Peserta */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">
                {isTeamEvent ? "NISN (Ketua Tim)" : "NISN"}
              </label>
              <input 
                required 
                type="number" 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 outline-none font-semibold text-slate-700" 
                placeholder="Nomor Induk Siswa Nasional" 
                value={formData.nisn}
                onChange={(e) => setFormData({...formData, nisn: e.target.value})} 
              />
            </div>
          </div>

          {/* BLOK DATA PEMBINA */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-indigo-600 uppercase tracking-wider px-1">Data Pembina / Guru Pendamping</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-indigo-50/40 rounded-2xl border border-indigo-100/50">
              <div>
                <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1 px-1">Nama Pembina</label>
                <input 
                  required 
                  type="text" 
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-500 outline-none font-semibold text-slate-700" 
                  placeholder="Nama Lengkap Pembina" 
                  value={formData.mentor_name || ""}
                  onChange={(e) => setFormData({...formData, mentor_name: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1 px-1">Email Pembina</label>
                <input 
                  required 
                  type="email" 
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-500 outline-none font-semibold text-slate-700" 
                  placeholder="pembina@sekolah.sch.id" 
                  value={formData.mentor_email || ""}
                  onChange={(e) => setFormData({...formData, mentor_email: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1 px-1">No. HP Pembina</label>
                <input 
                  required 
                  type="text" 
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-500 outline-none font-semibold text-slate-700" 
                  placeholder="Contoh: 08123456789" 
                  value={formData.mentor_phone || ""}
                  onChange={(e) => setFormData({...formData, mentor_phone: e.target.value.replace(/\D/g, "")})} 
                />
              </div>
            </div>
          </div>

          {/* BLOK DINAMIS TIM */}
          {isTeamEvent && (
            <div className="space-y-2">
              <h4 className="text-xs font-black text-blue-600 uppercase tracking-wider px-1">Data Anggota Tim (Anggota 2)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-blue-50/40 rounded-2xl border border-blue-100/50">
                <div>
                  <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1 px-1">Nama Tim</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none text-slate-700" 
                    placeholder="Contoh: Tim Einstein" 
                    value={formData.team_name || ""}
                    onChange={(e) => setFormData({...formData, team_name: e.target.value})} 
                    required={isTeamEvent} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1 px-1">Nama Anggota 2</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none text-slate-700" 
                    placeholder="Nama Lengkap Anggota 2" 
                    value={formData.participant2_name || ""}
                    onChange={(e) => setFormData({...formData, participant2_name: e.target.value})} 
                    required={isTeamEvent} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1 px-1">NISN Anggota 2</label>
                  <input 
                    type="number" 
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none text-slate-700" 
                    placeholder="NISN Anggota 2" 
                    value={formData.participant2_nisn || ""}
                    onChange={(e) => setFormData({...formData, participant2_nisn: e.target.value})} 
                    required={isTeamEvent} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================= BERKAS UPLOAD SECTION ======================= */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider px-1">Unggah Berkas Pendukung</h4>

            {/* 📸 INSTAGRAM FOLLOW PROOF */}
            <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-200/60 space-y-3">
              <div className="flex items-center gap-2 text-amber-800">
                <Instagram size={18} className="shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider">Bukti Follow Instagram NCC (Wajib)</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Silakan ikuti akun Instagram resmi NCC di <a href="https://www.instagram.com/officialnccsmadu1/" target="_blank" rel="noreferrer" className="text-amber-700 font-extrabold underline hover:text-amber-900">@officialnccsmadu1</a>, kemudian unggah foto tangkapan layar (screenshot) bukti follow Anda.
              </p>
              <div className="relative border border-dashed border-amber-300 rounded-xl p-4 bg-white/70 hover:bg-white text-center cursor-pointer transition-colors">
                <input 
                  type="file" 
                  accept="image/*" 
                  required 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  onChange={(e) => setInstagramFollow(e.target.files?.[0] || null)}
                />
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-600">
                  <Upload size={14} className="text-amber-600" />
                  <span className="truncate max-w-[400px]">{instagramFollow ? instagramFollow.name : "Pilih Tangkapan Layar Bukti Follow"}</span>
                </div>
              </div>
            </div>

            {/* 📁 BERKAS PESERTA UTAMA / KETUA TIM */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                {isTeamEvent ? "Berkas Ketua Tim (Peserta 1)" : "Berkas Peserta"}
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Foto Formal */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block px-0.5">Foto Formal (Wajib)</label>
                  <div className="relative border border-dashed border-slate-300 rounded-xl p-3 bg-white hover:bg-slate-50 text-center cursor-pointer transition-colors">
                    <input 
                      type="file" 
                      accept="image/*" 
                      required 
                      className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      onChange={(e) => setFormalPhoto1(e.target.files?.[0] || null)}
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5 text-[10px] font-bold text-slate-600">
                      <Image size={16} className="text-blue-500 animate-pulse" />
                      <span className="truncate max-w-[130px]">{formalPhoto1 ? formalPhoto1.name : "Pilih Foto Formal"}</span>
                    </div>
                  </div>
                </div>

                {/* Scan Kartu Pelajar */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block px-0.5">Kartu Pelajar (Wajib)</label>
                  <div className="relative border border-dashed border-slate-300 rounded-xl p-3 bg-white hover:bg-slate-50 text-center cursor-pointer transition-colors">
                    <input 
                      type="file" 
                      accept="image/*" 
                      required 
                      className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      onChange={(e) => setStudentCard1(e.target.files?.[0] || null)}
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5 text-[10px] font-bold text-slate-600">
                      <FileText size={16} className="text-amber-500 animate-pulse" />
                      <span className="truncate max-w-[130px]">{studentCard1 ? studentCard1.name : "Pilih Kartu Pelajar"}</span>
                    </div>
                  </div>
                </div>

                {/* Twibbon */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block px-0.5">Twibbon (Opsional)</label>
                  <div className="relative border border-dashed border-slate-200 rounded-xl p-3 bg-white hover:bg-slate-50 text-center cursor-pointer transition-colors">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      onChange={(e) => setTwibbon1(e.target.files?.[0] || null)}
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400">
                      <Gift size={16} className="text-indigo-400" />
                      <span className="truncate max-w-[130px]">{twibbon1 ? twibbon1.name : "Unggah Nanti"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 📁 BERKAS ANGGOTA TIM 2 */}
            {isTeamEvent && (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider">Berkas Anggota Tim (Peserta 2)</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Foto Formal 2 */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block px-0.5">Foto Formal (Wajib)</label>
                    <div className="relative border border-dashed border-slate-300 rounded-xl p-3 bg-white hover:bg-slate-50 text-center cursor-pointer transition-colors">
                      <input 
                        type="file" 
                        accept="image/*" 
                        required={isTeamEvent} 
                        className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                        onChange={(e) => setFormalPhoto2(e.target.files?.[0] || null)}
                      />
                      <div className="flex flex-col items-center justify-center gap-1.5 text-[10px] font-bold text-slate-600">
                        <Image size={16} className="text-blue-500" />
                        <span className="truncate max-w-[130px]">{formalPhoto2 ? formalPhoto2.name : "Pilih Foto Formal"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Kartu Pelajar 2 */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block px-0.5">Kartu Pelajar (Wajib)</label>
                    <div className="relative border border-dashed border-slate-300 rounded-xl p-3 bg-white hover:bg-slate-50 text-center cursor-pointer transition-colors">
                      <input 
                        type="file" 
                        accept="image/*" 
                        required={isTeamEvent} 
                        className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                        onChange={(e) => setStudentCard2(e.target.files?.[0] || null)}
                      />
                      <div className="flex flex-col items-center justify-center gap-1.5 text-[10px] font-bold text-slate-600">
                        <FileText size={16} className="text-amber-500" />
                        <span className="truncate max-w-[130px]">{studentCard2 ? studentCard2.name : "Pilih Kartu Pelajar"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Twibbon 2 */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block px-0.5">Twibbon (Opsional)</label>
                    <div className="relative border border-dashed border-slate-200 rounded-xl p-3 bg-white hover:bg-slate-50 text-center cursor-pointer transition-colors">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                        onChange={(e) => setTwibbon2(e.target.files?.[0] || null)}
                      />
                      <div className="flex flex-col items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400">
                        <Gift size={16} className="text-indigo-400" />
                        <span className="truncate max-w-[130px]">{twibbon2 ? twibbon2.name : "Unggah Nanti"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                MEMPROSES PENDAFTARAN...
              </>
            ) : (
              "KIRIM PENDAFTARAN SEKARANG"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
