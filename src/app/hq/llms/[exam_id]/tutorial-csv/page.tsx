'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  FileDown, 
  Info, 
  Table,
  Settings
} from 'lucide-react';

export default function TutorialCSV() {
  const params = useParams();
  const examId = params.exam_id as string;

  // Fungsi untuk mengunduh template CSV kosong
  const downloadTemplate = () => {
    // Header sesuai dengan struktur database
    const headers = ['Soal', 'Opsi A', 'Opsi B', 'Opsi C', 'Opsi D', 'Opsi E', 'Kunci Jawaban', 'Tingkat Kesulitan', 'Bobot Nilai'];
    const sampleRow = ['Ibukota Indonesia adalah?', 'Jakarta', 'Bandung', 'Surabaya', 'IKN', 'Medan', 'D', 'MUDAH', '1'];
    
    // Menggunakan pemisah koma (,) karena fungsi import di page.tsx menggunakan split(',')
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
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6 text-left">
        
        {/* HEADER */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/hq/llms/${examId}/questions`} className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="text-left">
              <h1 className="text-lg font-bold text-gray-800 flex items-center tracking-tight">
                <Table className="w-5 h-5 text-indigo-500 mr-2" />
                Pengaturan & Tutorial Import CSV
              </h1>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">ID Sesi: {examId}</p>
            </div>
          </div>
          <button 
            onClick={downloadTemplate}
            className="flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-100"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Unduh Template CSV
          </button>
        </div>

        {/* PENGATURAN SYSTEM */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-left">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center">
            <Settings className="w-5 h-5 text-gray-400 mr-2" />
            Pengaturan Format Pemisah (Delimiter)
          </h2>
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start space-x-3 mb-4">
            <Info className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>PENTING:</strong> Pastikan file CSV Anda menggunakan <strong>Koma ( , )</strong> sebagai pemisah kolom. Jika Anda menggunakan Excel, pastikan saat "Save As CSV", format yang dipilih adalah CSV (Comma Delimited). Jika teks soal Anda mengandung tanda koma, sistem akan otomatis membersihkannya agar tidak merusak tabel.
            </p>
          </div>
        </div>

        {/* TUTORIAL STRUKTUR KOLOM */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden text-left">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-800">Struktur Kolom Wajib</h2>
            <p className="text-xs text-gray-500 mt-1">Pastikan *header* baris pertama pada file CSV Anda persis seperti tabel di bawah ini.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                  <th className="py-4 px-6 font-semibold w-16 text-center">Kolom</th>
                  <th className="py-4 px-6 font-semibold">Nama Header</th>
                  <th className="py-4 px-6 font-semibold">Deskripsi & Aturan Isi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 text-xs">
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 text-center font-mono font-bold text-indigo-500">A</td>
                  <td className="py-4 px-6 font-semibold">Soal</td>
                  <td className="py-4 px-6 leading-relaxed">Isi dengan teks pertanyaan. Anda bisa menggunakan <code>$ ... $</code> untuk rumus matematika LaTeX.</td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 text-center font-mono font-bold text-indigo-500">B - F</td>
                  <td className="py-4 px-6 font-semibold">Opsi A s/d Opsi E</td>
                  <td className="py-4 px-6 leading-relaxed">Teks pilihan ganda. Jangan biarkan kosong.</td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors bg-emerald-50/20">
                  <td className="py-4 px-6 text-center font-mono font-bold text-emerald-500">G</td>
                  <td className="py-4 px-6 font-semibold">Kunci Jawaban</td>
                  <td className="py-4 px-6 leading-relaxed">Gunakan satu huruf kapital (<strong>A, B, C, D, atau E</strong>).</td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 text-center font-mono font-bold text-indigo-500">H</td>
                  <td className="py-4 px-6 font-semibold">Tingkat Kesulitan</td>
                  <td className="py-4 px-6 leading-relaxed">Pilih salah satu: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">Easy</span>, <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">Medium</span>, <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">Hard</span>.</td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 text-center font-mono font-bold text-indigo-500">I</td>
                  <td className="py-4 px-6 font-semibold">Bobot Nilai</td>
                  <td className="py-4 px-6 leading-relaxed">Angka desimal atau bulat (Contoh: 1, 2, atau 1.5).</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
