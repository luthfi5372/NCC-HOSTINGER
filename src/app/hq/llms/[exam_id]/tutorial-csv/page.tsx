'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  FileDown, 
  Info, 
  Table,
  CheckCircle,
  XCircle,
  FileCheck,
  ChevronRight,
  Monitor,
  Settings
} from 'lucide-react';

export default function TutorialCSV() {
  const params = useParams();
  const examId = params.exam_id as string;

  const downloadTemplate = () => {
    const headers = ['Soal', 'Opsi A', 'Opsi B', 'Opsi C', 'Opsi D', 'Opsi E', 'Kunci Jawaban', 'Tingkat Kesulitan', 'Bobot Nilai'];
    const sampleRow = ['Siapakah penemu mesin uap?', 'James Watt', 'Isaac Newton', 'Albert Einstein', 'Nikola Tesla', 'Thomas Edison', 'A', 'MUDAH', '1'];
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + "\n" 
      + sampleRow.join(',');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Template_Soal_NCC13.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-8 font-sans selection:bg-indigo-100">
      <div className="max-w-5xl mx-auto space-y-8 text-left">
        
        {/* 🧼 HEADER BAR */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Link href={`/hq/llms/${examId}/questions`} className="p-2.5 bg-indigo-50/50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="text-left">
              <h1 className="text-xl font-bold text-gray-800 flex items-center tracking-tight">
                <Table className="w-6 h-6 text-indigo-500 mr-2" />
                Panduan Visual Import CSV
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">Pelajari cara memasukkan ribuan soal sekaligus tanpa error.</p>
            </div>
          </div>
          <button 
            onClick={downloadTemplate}
            className="flex items-center px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-indigo-100 active:scale-95"
          >
            <FileDown className="w-5 h-5 mr-2" />
            Unduh Template
          </button>
        </div>

        {/* 🚀 SECTION 1: LANGKAH-LANGKAH VISUAL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Langkah 1 */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group text-left">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <FileDown className="w-32 h-32 text-indigo-900" />
            </div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl mb-6 shadow-inner">1</div>
            <h3 className="font-bold text-gray-800 mb-3 text-left">Unduh Template</h3>
            <p className="text-xs text-gray-500 leading-relaxed text-left">
              Gunakan tombol di atas untuk mendapatkan file <code className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">.csv</code> yang sudah memiliki struktur header valid.
            </p>
          </div>

          {/* Langkah 2 */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group text-left">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Monitor className="w-32 h-32 text-emerald-900" />
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black text-xl mb-6 shadow-inner">2</div>
            <h3 className="font-bold text-gray-800 mb-3 text-left">Isi di Excel / Sheets</h3>
            <p className="text-xs text-gray-500 leading-relaxed text-left">
              Buka file tersebut. Masukkan butir soal, opsi A-E, dan kunci jawaban. Pastikan tidak ada kolom yang bergeser.
            </p>
          </div>

          {/* Langkah 3 */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group text-left">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <FileCheck className="w-32 h-32 text-amber-900" />
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-black text-xl mb-6 shadow-inner">3</div>
            <h3 className="font-bold text-gray-800 mb-3 text-left">Save As Comma Delimited</h3>
            <p className="text-xs text-gray-500 leading-relaxed text-left">
              Saat menyimpan, pastikan memilih format <span className="font-bold text-gray-700 underline decoration-amber-300">CSV (Comma Delimited)</span> agar sistem bisa membaca data Anda.
            </p>
          </div>
        </div>

        {/* ⚠️ SECTION 2: ILUSTRASI DELIMITER KOMA VS TITIK KOMA */}
        <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-gray-100 shadow-sm text-left">
          <div className="flex items-start mb-8 text-left">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0 mr-4">
              <Info className="w-6 h-6 text-amber-500" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-bold text-gray-800">Kenapa Harus Comma Delimited?</h2>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Sistem database NCC membutuhkan pemisah antar kolom berupa <strong>koma ( , )</strong>. Jika komputer Anda menggunakan regional Indonesia, Excel sering secara otomatis menggunakan titik koma ( ; ). Perhatikan perbedaannya:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Visual Salah */}
            <div className="p-6 bg-rose-50/40 border border-rose-100 rounded-[2rem] text-left">
              <div className="flex items-center text-rose-600 font-black text-[10px] uppercase tracking-widest mb-4">
                <XCircle className="w-4 h-4 mr-2" /> FORMAT SALAH (Pakai Titik Koma)
              </div>
              <div className="font-mono text-[10px] text-gray-600 bg-white p-4 rounded-2xl border border-rose-100 shadow-sm overflow-x-auto whitespace-nowrap leading-loose">
                Soal<span className="text-rose-500 font-bold bg-rose-50 px-0.5">;</span>Opsi A<span className="text-rose-500 font-bold bg-rose-50 px-0.5">;</span>Opsi B<span className="text-rose-500 font-bold bg-rose-50 px-0.5">;</span>Kunci<br/>
                Berapa 1+1?<span className="text-rose-500 font-bold bg-rose-50 px-0.5">;</span>Dua<span className="text-rose-500 font-bold bg-rose-50 px-0.5">;</span>Tiga<span className="text-rose-500 font-bold bg-rose-50 px-0.5">;</span>A
              </div>
            </div>

            {/* Visual Benar */}
            <div className="p-6 bg-emerald-50/40 border border-emerald-100 rounded-[2rem] text-left">
              <div className="flex items-center text-emerald-600 font-black text-[10px] uppercase tracking-widest mb-4">
                <CheckCircle className="w-4 h-4 mr-2" /> FORMAT BENAR (Pakai Koma)
              </div>
              <div className="font-mono text-[10px] text-gray-600 bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm overflow-x-auto whitespace-nowrap leading-loose">
                Soal<span className="text-emerald-500 font-bold bg-emerald-50 px-0.5">,</span>Opsi A<span className="text-emerald-500 font-bold bg-emerald-50 px-0.5">,</span>Opsi B<span className="text-emerald-500 font-bold bg-emerald-50 px-0.5">,</span>Kunci<br/>
                "Berapa 1+1?"<span className="text-emerald-500 font-bold bg-emerald-50 px-0.5">,</span>"Dua"<span className="text-emerald-500 font-bold bg-emerald-50 px-0.5">,</span>"Tiga"<span className="text-emerald-500 font-bold bg-emerald-50 px-0.5">,</span>"A"
              </div>
            </div>
          </div>
        </div>

        {/* 📋 SECTION 3: TABEL REFERENSI */}
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden text-left">
          <div className="p-8 border-b border-gray-100 bg-gray-50/30 text-left">
            <h2 className="text-lg font-bold text-gray-800">Aturan Pengisian Kolom</h2>
            <p className="text-xs text-gray-500 mt-1">Detail teknis pengisian setiap kolom pada file CSV.</p>
          </div>
          
          <div className="overflow-x-auto p-4 text-left">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="py-5 px-6 w-24 text-center">Kolom</th>
                  <th className="py-5 px-6">Nama Header</th>
                  <th className="py-5 px-6">Aturan & Contoh Pengisian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-left text-xs">
                <tr className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="py-6 px-6 text-center">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-black font-mono shadow-sm group-hover:scale-110 transition-transform">A</span>
                  </td>
                  <td className="py-6 px-6 font-bold text-gray-800">Soal</td>
                  <td className="py-6 px-6 leading-relaxed text-gray-600">
                    Isi dengan pertanyaan. Dukungan LaTeX: <code className="bg-slate-100 text-rose-500 px-2 py-1 rounded font-mono font-bold">$$...$$</code> untuk rumus matematika.
                  </td>
                </tr>
                <tr className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="py-6 px-6 text-center">
                    <span className="inline-flex items-center justify-center px-4 h-10 rounded-xl bg-slate-50 text-slate-500 font-black font-mono shadow-sm group-hover:scale-110 transition-transform">B-F</span>
                  </td>
                  <td className="py-6 px-6 font-bold text-gray-800">Opsi A - E</td>
                  <td className="py-6 px-6 leading-relaxed text-gray-500">
                    Isi dengan teks pilihan ganda. Jangan biarkan kolom ini kosong.
                  </td>
                </tr>
                <tr className="hover:bg-emerald-50/30 transition-colors bg-emerald-50/5 group">
                  <td className="py-6 px-6 text-center">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-black font-mono shadow-sm group-hover:scale-110 transition-transform">G</span>
                  </td>
                  <td className="py-6 px-6 font-bold text-gray-800">Kunci Jawaban</td>
                  <td className="py-6 px-6 leading-relaxed">
                    Hanya 1 huruf kapital: <span className="font-black text-emerald-600 bg-emerald-100 px-2 py-1 rounded">A, B, C, D, atau E</span>.
                  </td>
                </tr>
                <tr className="hover:bg-amber-50/30 transition-colors group">
                  <td className="py-6 px-6 text-center">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 text-amber-600 font-black font-mono shadow-sm group-hover:scale-110 transition-transform">H</span>
                  </td>
                  <td className="py-6 px-6 font-bold text-gray-800">Kesulitan</td>
                  <td className="py-6 px-6 leading-relaxed">
                    Gunakan kapital: <span className="font-bold text-gray-400">MUDAH</span>, <span className="font-bold text-amber-500">SEDANG</span>, atau <span className="font-bold text-rose-500">SULIT</span>.
                  </td>
                </tr>
                <tr className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="py-6 px-6 text-center">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-black font-mono shadow-sm group-hover:scale-110 transition-transform">I</span>
                  </td>
                  <td className="py-6 px-6 font-bold text-gray-800">Bobot Nilai</td>
                  <td className="py-6 px-6 leading-relaxed text-gray-500">
                    Angka numerik (Contoh: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">1</code> atau <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">2.5</code>).
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
