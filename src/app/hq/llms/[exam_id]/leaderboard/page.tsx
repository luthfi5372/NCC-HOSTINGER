'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeftIcon, 
  TrophyIcon, 
  UserGroupIcon, 
  ShieldAlertIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function LiveLeaderboard() {
  const supabase = createClientComponentClient();
  const params = useParams();
  const examId = params.exam_id as string;

  // State Data
  const [attempts, setAttempts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Stats Agregasi
  const [topScore, setTopScore] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [totalCheatAlert, setTotalCheatAlert] = useState(0);

  // 📡 1. TARIK DATA AWAL (INITIAL FETCH)
  const fetchLeaderboardData = async () => {
    // Di dunia nyata, kamu bisa melakukan JOIN dengan tabel profil siswa untuk mengambil Nama Lengkap
    // Untuk pengembangan awal ini, kita ambil data dari cbt_attempts terlebih dahulu
    const { data, error } = await supabase
      .from('cbt_attempts')
      .select('*')
      .eq('exam_id', examId);

    if (error) {
      console.error('Gagal mengambil data peringkat:', error);
      return;
    }

    if (data) {
      prosesDanUrutkanData(data);
    }
    setLoading(false);
  };

  // ⚡ 2. LOGIKA PROSES & SORTING DATA (SKOR TERTINGGI + WAKTU TERCEPAT)
  const prosesDanUrutkanData = (dataRaw: any[]) => {
    const dataUrut = [...dataRaw].sort((a, b) => {
      // Urutkan skor dari yang tertinggi
      if (b.current_score !== a.current_score) {
        return b.current_score - a.current_score;
      }
      // Jika skor kembar, urutkan berdasarkan jumlah pelanggaran paling sedikit
      if (a.violations_count !== b.violations_count) {
        return a.violations_count - b.violations_count;
      }
      // Jika masih kembar, urutkan berdasarkan siapa yang paling duluan update/selesai
      return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
    });

    setAttempts(dataUrut);

    // Hitung Ringkasan Statistik Kompetisi
    if (dataUrut.length > 0) {
      const skorTertinggi = dataUrut[0].current_score;
      const totalSkor = dataUrut.reduce((acc, curr) => acc + curr.current_score, 0);
      const rataRata = Math.round(totalSkor / dataUrut.length);
      const totalPelanggaran = dataUrut.reduce((acc, curr) => acc + curr.violations_count, 0);

      setTopScore(skorTertinggi);
      setAvgScore(rataRata);
      setTotalCheatAlert(totalPelanggaran);
    }
  };

  // 🔄 3. AKSIKAN REAL-TIME WEBSOCKET LISTENER
  useEffect(() => {
    if (!examId) return;

    fetchLeaderboardData();

    // Dengarkan setiap ada operasi UPDATE atau INSERT pada tabel cbt_attempts khusus sesi ini
    const channel = supabase
      .channel(`live-cbt-scores-${examId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cbt_attempts', filter: `exam_id=eq.${examId}` },
        () => {
          // Setiap ada perubahan data dari peserta, langsung tarik & urutkan ulang otomatis
          fetchLeaderboardData();
        }
      )
      .subscribe();

    // Bersihkan kanal saat admin keluar dari halaman
    return () => {
      supabase.removeChannel(channel);
    };
  }, [examId]);

  // 🔍 FILTER PENCARIAN PESERTA
  const filteredAttempts = attempts.filter((item) =>
    item.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 📥 UTILITAS UTUK EXPORT DATA KE CSV
  const downloadCSV = () => {
    if (attempts.length === 0) return alert('Tidak ada data untuk diekspor');
    
    const headers = ['Peringkat', 'ID Peserta', 'Skor', 'Jumlah Pelanggaran', 'Waktu Mulai', 'Terakhir Update\n'];
    const rows = filteredAttempts.map((item, index) => [
      index + 1,
      item.user_id,
      item.current_score,
      item.violations_count,
      new Date(item.started_at).toLocaleTimeString(),
      new Date(item.updated_at).toLocaleTimeString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Leaderboard_NCC13_Sesi_${examId.split('-')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans">
      
      {/* HEADER UTAMA */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 rounded-2xl shadow-sm border border-gray-100 gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/hq/llms" className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight flex items-center">
              <TrophyIcon className="w-6 h-6 text-amber-500 mr-2" /> Live Scoring & Peringkat
            </h1>
            <p className="text-xs text-gray-400 font-mono mt-0.5">Memonitor Sesi: {examId}</p>
          </div>
        </div>

        <button 
          onClick={downloadCSV}
          className="flex items-center justify-center px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-gray-50 shadow-sm transition-colors"
        >
          <ArrowDownTrayIcon className="w-4 h-4 mr-2 text-indigo-500" /> Export CSV
        </button>
      </div>

      {/* METRIC CARD BAR (TIGA KOTAK MONITORING UTAMA) */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Skor Tertinggi</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">{topScore}</h3>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl">
            <TrophyIcon className="w-6 h-6 text-amber-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Rata-Rata Skor Sesi</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">{avgScore}</h3>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl">
            <UserGroupIcon className="w-6 h-6 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Pelanggaran</p>
            <h3 className={`text-3xl font-bold mt-1 ${totalCheatAlert > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{totalCheatAlert}</h3>
          </div>
          <div className="p-3 bg-red-50 rounded-xl">
            <ShieldAlertIcon className="w-6 h-6 text-red-500" />
          </div>
        </div>
      </div>

      {/* TABEL AREA & CONTROL BAR */}
      <div className="max-w-6xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-20">
        
        {/* CONTROL BAR (SEARCH BOX) */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center relative">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-9" />
          <input
            type="text"
            placeholder="Cari berdasarkan ID Peserta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
          />
        </div>

        {/* TABEL UTAMA */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center text-sm text-gray-400 font-medium">
              <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" /> Menghubungkan ke Saluran Real-time...
            </div>
          ) : filteredAttempts.length === 0 ? (
            <div className="p-20 text-center text-sm text-gray-400 font-medium">
              Belum ada aktivitas peserta terdeteksi pada sesi kompetisi ini.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/30 text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-4 px-6 text-center w-20">Rank</th>
                  <th className="py-4 px-6">ID Kontestan (Peserta)</th>
                  <th className="py-4 px-6 text-center">Skor Riil</th>
                  <th className="py-4 px-6 text-center">Radar Pelanggaran</th>
                  <th className="py-4 px-6 text-right">Durasi Terakhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                {filteredAttempts.map((item, index) => {
                  const isTopThree = index < 3;
                  const hasViolations = item.violations_count > 0;
                  
                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-gray-50/50 transition-colors duration-200 group
                        ${hasViolations ? 'bg-red-50/10 hover:bg-red-50/20' : ''}`}
                    >
                      {/* POSISI PERINGKAT */}
                      <td className="py-4 px-6 text-center font-bold">
                        {isTopThree ? (
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs
                            ${index === 0 ? 'bg-amber-100 text-amber-700 shadow-sm' : ''}
                            ${index === 1 ? 'bg-slate-100 text-slate-700' : ''}
                            ${index === 2 ? 'bg-orange-100 text-orange-700' : ''}
                          `}>
                            {index + 1}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium">{index + 1}</span>
                        )}
                      </td>

                      {/* DATA IDENTITAS */}
                      <td className="py-4 px-6 font-semibold text-gray-800 tracking-tight">
                        {item.user_id}
                        {item.submitted_at && (
                          <span className="ml-2 bg-emerald-100 text-emerald-700 font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                            Selesai
                          </span>
                        )}
                      </td>

                      {/* SKOR TERKINI */}
                      <td className="py-4 px-6 text-center font-black text-base text-indigo-600">
                        {item.current_score}
                      </td>

                      {/* DETEKSI CHEAT RADAR */}
                      <td className="py-4 px-6 text-center">
                        {hasViolations ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-600 border border-red-100 animate-pulse">
                            🚨 {item.violations_count} Keluar Layar
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                            Aman
                          </span>
                        )}
                      </td>

                      {/* WAKTU UPDATE AKHIR */}
                      <td className="py-4 px-6 text-right text-gray-400 font-mono text-xs">
                        <span className="inline-flex items-center">
                          <ClockIcon className="w-3.5 h-3.5 mr-1" />
                          {new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
}
