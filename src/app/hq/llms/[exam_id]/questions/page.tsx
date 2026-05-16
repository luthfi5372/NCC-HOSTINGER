'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  DocumentTextIcon, 
  TrashIcon, 
  PhotoIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  ArrowUpTrayIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { BookOpen } from 'lucide-react';
import katex from "katex";
import "katex/dist/katex.min.css";

// --- ⚡ MIPA MATH RENDERER ENGINE ---
const renderMath = (text: string) => {
  if (!text) return "";
  let html = text;
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
    try { return katex.renderToString(formula, { displayMode: true, throwOnError: false }); } catch (e) { return match; }
  });
  html = html.replace(/\$(.*?)\$/g, (match, formula) => {
    try { return katex.renderToString(formula, { displayMode: false, throwOnError: false }); } catch (e) { return match; }
  });
  return html;
};

export default function EditorBankSoal() {
  const supabase = createClient();
  const params = useParams();
  const examId = params.exam_id as string; 
  
  // State Form Input
  const [soal, setSoal] = useState('');
  const [opsi, setOpsi] = useState({ A: '', B: '', C: '', D: '', E: '' });
  const [kunciJawaban, setKunciJawaban] = useState('A');
  const [difficulty, setDifficulty] = useState('Medium');
  
  // State Mode Edit & Gambar
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  
  // State Kendali Sistem
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [daftarSoal, setDaftarSoal] = useState<any[]>([]);

  // 📡 1. TARIK DATA DARI DATABASE
  const fetchSoalTersimpan = async () => {
    const { data } = await supabase
      .from('cbt_questions')
      .select('*')
      .eq('exam_id', examId)
      .order('created_at', { ascending: false });
      
    if (data) setDaftarSoal(data);
  };

  useEffect(() => {
    if (examId) fetchSoalTersimpan();
  }, [examId]);

  // 🖼️ 2. HANDLE SELEKSI GAMBAR
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  // 🚀 3. FUNGSI UTAMA: SIMPAN (CREATE / UPDATE) DATA SOAL
  const handleSimpanSoal = async () => {
    if (!soal && !imageFile) return alert("Konten soal teks atau gambar wajib ada!");
    if (!opsi.A || !opsi.B) return alert("Opsi jawaban A dan B minimal harus diisi!");
    
    setIsSubmitting(true);
    let finalImageUrl = imagePreviewUrl; // Pertahankan URL lama jika mode edit

    try {
      // Proses upload gambar jika ada file baru yang dipilih
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${examId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('question-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('question-images')
          .getPublicUrl(filePath);
        
        finalImageUrl = publicUrlData.publicUrl;
      }

      const payload = {
        question_text: soal,
        image_url: finalImageUrl,
        options: {
          A: opsi.A,
          B: opsi.B,
          C: opsi.C,
          D: opsi.D,
          E: opsi.E
        },
        correct_answer: kunciJawaban,
        difficulty: difficulty,
        weight: 4, // Default weight
        status: 'Published'
      };

      if (editingId) {
        // --- MODE UPDATE (EDIT DATA LAMA) ---
        const { error: updateError } = await supabase
          .from('cbt_questions')
          .update(payload)
          .eq('id', editingId);

        if (updateError) throw updateError;
        setEditingId(null);
      } else {
        // --- MODE INSERT (BUAT SOAL BARU) ---
        const { error: insertError } = await supabase.from('cbt_questions').insert([{
          ...payload,
          exam_id: examId
        }]);

        if (insertError) throw insertError;
      }

      // Bersihkan form kembali seperti semula
      resetForm();
      fetchSoalTersimpan();

    } catch (error: any) {
      alert(`Operasi database gagal: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✏️ 4. MASUK KE MODE EDIT (NAIKKAN DATA KE FORM)
  const pemicuEditSoal = (item: any) => {
    setEditingId(item.id);
    setSoal(item.question_text);
    setOpsi({
      A: item.options?.A || '',
      B: item.options?.B || '',
      C: item.options?.C || '',
      D: item.options?.D || '',
      E: item.options?.E || ''
    });
    setKunciJawaban(item.correct_answer);
    setDifficulty(item.difficulty || 'Medium');
    setImagePreviewUrl(item.image_url || null);
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 📥 5. BULK IMPORT CSV MASSAL (SISTEM TANPA LIBRARY TAMBAHAN)
  const handleBulkImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("Apakah Anda yakin ingin mengimpor data massal melalui file CSV ini?")) return;
    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const baris = text.split('\n');
        const dataInsert: any[] = [];

        // Skip baris 0 jika itu merupakan header kolom (Soal, A, B, C, D, E, Kunci, Kesulitan)
        for (let i = 1; i < baris.length; i++) {
          if (!baris[i].trim()) continue;
          
          // Split kolom menggunakan koma
          const kolom = baris[i].split(',');
          
          dataInsert.push({
            exam_id: examId,
            question_text: kolom[0]?.replace(/"/g, '').trim(),
            options: {
              A: kolom[1]?.trim(),
              B: kolom[2]?.trim(),
              C: kolom[3]?.trim(),
              D: kolom[4]?.trim(),
              E: kolom[5]?.trim() || null,
            },
            correct_answer: kolom[6]?.trim().toUpperCase() || 'A',
            difficulty: kolom[7]?.trim() || 'Medium',
            weight: 4,
            status: 'Published'
          });
        }

        if (dataInsert.length > 0) {
          const { error } = await supabase.from('cbt_questions').insert(dataInsert);
          if (error) throw error;
          alert(`Sukses mengimpor ${dataInsert.length} soal secara massal!`);
          fetchSoalTersimpan();
        }
      } catch (err: any) {
        alert(`Gagal memproses file CSV: ${err.message}`);
      } finally {
        setIsImporting(false);
        e.target.value = ''; // Reset file input
      }
    };
    reader.readAsText(file);
  };

  const handleHapusSoal = async (id: string) => {
    if (!confirm("Hapus permanen soal ini dari sistem?")) return;
    await supabase.from('cbt_questions').delete().eq('id', id);
    fetchSoalTersimpan();
    if(editingId === id) resetForm();
  };

  const resetForm = () => {
    setSoal('');
    setOpsi({ A: '', B: '', C: '', D: '', E: '' });
    setKunciJawaban('A');
    setDifficulty('Medium');
    setEditingId(null);
    setImageFile(null);
    setImagePreviewUrl(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans">
      
      {/* HEADER UTAMA */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 rounded-2xl shadow-sm border border-gray-100 gap-4 text-left">
        <div className="flex items-center space-x-4">
          <Link href="/hq/llms" className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Manajemen Bank Soal</h1>
            <p className="text-xs text-gray-400 font-mono mt-0.5">Sesi ID: {examId?.split('-')[0]}...</p>
          </div>
        </div>

        {/* AREA IMPORT EXCEL/CSV */}
        <div className="flex items-center space-x-3">
          <Link 
            href={`/hq/llms/${examId}/tutorial-csv`}
            className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 rounded-xl text-xs font-bold tracking-wide transition-all shadow-sm"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Panduan CSV
          </Link>

          <label className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-gray-50 cursor-pointer shadow-sm transition-colors">
            {isImporting ? (
              <><ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" /> Mengimpor...</>
            ) : (
              <><ArrowUpTrayIcon className="w-4 h-4 mr-2 text-indigo-500" /> Bulk Import CSV</>
            )}
            <input type="file" accept=".csv" onChange={handleBulkImportCSV} disabled={isImporting} className="hidden" />
          </label>
          <div className="px-4 py-2 bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-widest rounded-xl border border-emerald-100">
            Live Sync
          </div>
        </div>
      </div>

      {/* WORKSPACE AREA (SPLIT VIEW) */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* KIRI: FORM EDITOR INPUT */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full relative">
          
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center text-left">
              <DocumentTextIcon className="w-6 h-6 text-indigo-600 mr-2" />
              <h2 className="font-bold text-gray-800 text-lg">
                {editingId ? 'Edit Komponen Soal' : 'Input Data Soal'}
              </h2>
            </div>
            
            {/* TAG TINGKAT KESULITAN */}
            <select 
              value={difficulty} 
              onChange={(e) => setDifficulty(e.target.value)}
              className="text-xs font-bold uppercase bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-600 outline-none"
            >
              <option value="Easy">Easy (Mudah)</option>
              <option value="Medium">Medium (Sedang)</option>
              <option value="Hard">Hard (HOTS)</option>
            </select>
          </div>

          <div className="space-y-5 flex-grow">
            {/* Input Media/Gambar */}
            <div className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors relative cursor-pointer group">
              <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              {imagePreviewUrl ? (
                <div className="text-sm text-emerald-600 font-medium flex items-center justify-center">
                  <CheckCircleIcon className="w-5 h-5 mr-2" /> Media gambar siap diunggah
                </div>
              ) : (
                <div className="text-sm text-gray-400 font-medium flex flex-col items-center justify-center">
                  <PhotoIcon className="w-8 h-8 text-gray-300 mb-2 group-hover:text-indigo-500 transition-colors" />
                  Sematkan Gambar Soal (Opsional)
                </div>
              )}
            </div>

            {/* Input Narasi/Soal */}
            <textarea
              value={soal} onChange={(e) => setSoal(e.target.value)}
              placeholder="Ketik deskripsi soal di sini... Gunakan $...$ untuk menyisipkan formula rumusan matematika."
              className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all text-sm"
            />

            {/* Input Pilihan Ganda */}
            <div className="space-y-3">
              {['A', 'B', 'C', 'D', 'E'].map((huruf) => (
                <div key={huruf} className={`flex items-center p-1.5 rounded-xl border transition-all ${kunciJawaban === huruf ? 'border-indigo-400 bg-indigo-50/40 ring-1 ring-indigo-400' : 'border-gray-200 bg-white'}`}>
                  <input 
                    type="radio" name="correctRadio" checked={kunciJawaban === huruf} onChange={() => setKunciJawaban(huruf)}
                    className="w-4 h-4 text-indigo-600 mx-4 cursor-pointer"
                  />
                  <span className={`font-bold w-6 ${kunciJawaban === huruf ? 'text-indigo-600' : 'text-gray-400'}`}>{huruf}</span>
                  <input
                    type="text" value={opsi[huruf as keyof typeof opsi]} onChange={(e) => setOpsi({ ...opsi, [huruf]: e.target.value })}
                    placeholder={`Isi opsi jawaban ${huruf}...`}
                    className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-300 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* AKSI TOMBOL UTAMA */}
          <div className="flex space-x-3 mt-8">
            {editingId && (
              <button onClick={resetForm} className="w-1/3 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-all flex justify-center items-center">
                <XCircleIcon className="w-5 h-5 mr-2" /> Batal
              </button>
            )}
            <button 
              onClick={handleSimpanSoal} disabled={isSubmitting}
              className={`py-4 text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center flex-grow
                ${editingId ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-100' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'}`}
            >
              {isSubmitting ? (
                <><ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> Menyelaraskan...</>
              ) : editingId ? (
                '💾 Perbarui Data Soal'
              ) : (
                '💾 Simpan Soal ke Database'
              )}
            </button>
          </div>
        </div>

        {/* KANAN: LIVE PREVIEW MODAL MOCKUP (SOFT UI) */}
        <div className="bg-[#f0f4f8] p-6 md:p-8 rounded-3xl border border-indigo-50 flex flex-col relative overflow-hidden text-left">
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-ping"></div>
              <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-widest">Mockup Layar Peserta</h3>
            </div>
            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider border
              ${difficulty === 'Hard' ? 'bg-red-50 text-red-600 border-red-100' : 
                difficulty === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
              {difficulty}
            </span>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex-grow relative z-10 flex flex-col overflow-y-auto">
            {imagePreviewUrl && (
              <div className="mb-5 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex justify-center p-2 relative">
                <img src={imagePreviewUrl} alt="Preview" className="max-h-40 object-contain rounded-lg" />
              </div>
            )}

            <div 
              className="text-gray-800 text-base mb-8 leading-relaxed font-medium prose-slate"
              dangerouslySetInnerHTML={{ __html: renderMath(soal || "Tulis deskripsi soal di kolom editor kiri...") }}
            />

            <div className="space-y-3 mt-auto">
              {['A', 'B', 'C', 'D', 'E'].map((huruf) => (
                <div key={huruf} className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center ${kunciJawaban === huruf ? 'border-emerald-400 bg-emerald-50 shadow-sm' : 'border-gray-200 bg-white'}`}>
                  <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold mr-4 ${kunciJawaban === huruf ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {huruf}
                  </span>
                  <div 
                    className={`text-sm ${kunciJawaban === huruf ? 'text-emerald-900 font-semibold' : 'text-gray-600'}`}
                    dangerouslySetInnerHTML={{ __html: renderMath(opsi[huruf as keyof typeof opsi] || "...") }}
                  />
                  {kunciJawaban === huruf && <CheckCircleIcon className="w-5 h-5 text-emerald-500 ml-auto" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- DAFTAR HASIL PENYIMPANAN DATA --- */}
      <div className="max-w-6xl mx-auto mt-12 mb-20 text-left">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          Soal Terdaftar <span className="ml-3 bg-indigo-100 text-indigo-700 text-sm font-bold px-3 py-1 rounded-full">{daftarSoal.length}</span>
        </h3>
        
        {daftarSoal.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-gray-200 text-center text-gray-400 font-medium">
            Belum ada susunan soal yang terdaftar di database untuk sesi ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 text-left">
            {daftarSoal.map((item, index) => (
              <div key={item.id} className={`bg-white p-6 rounded-2xl shadow-sm border flex flex-col md:flex-row justify-between items-start hover:shadow-md transition-all
                ${editingId === item.id ? 'border-amber-400 ring-1 ring-amber-400 bg-amber-50/10' : 'border-gray-100'}`}>
                
                <div className="flex-grow w-full md:pr-6 text-left">
                  <div className="flex items-center mb-3 flex-wrap gap-2">
                    <span className="bg-slate-800 text-white text-xs font-bold px-2.5 py-1 rounded-md">Soal {daftarSoal.length - index}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border
                      ${item.difficulty === 'Hard' ? 'bg-red-50 text-red-600 border-red-100' : 
                        item.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        'bg-amber-50 text-amber-600 border-amber-100'}`}>
                      {item.difficulty || 'Medium'}
                    </span>
                  </div>
                  
                  {item.image_url && <img src={item.image_url} alt="Media" className="h-16 rounded-lg border border-gray-200 mb-3 object-cover" />}
                  <div 
                    className="text-gray-800 mb-4 text-sm font-medium prose-sm"
                    dangerouslySetInnerHTML={{ __html: renderMath(item.question_text) }}
                  />
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-gray-600">
                    {['A', 'B', 'C', 'D', 'E'].map((opt) => {
                      const val = item.options?.[opt];
                      const isCorrect = item.correct_answer === opt;
                      if (!val) return null;
                      return (
                        <div key={opt} className={`p-2 rounded border ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-gray-50 border-gray-100'}`}>
                          {opt}. <span dangerouslySetInnerHTML={{ __html: renderMath(val) }} />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* SISI TOMBOL KENDALI DATA */}
                <div className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2 mt-4 md:mt-0 w-full md:w-auto justify-end">
                  <button onClick={() => pemicuEditSoal(item)} className="p-2.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-colors flex items-center text-xs font-semibold">
                    <PencilSquareIcon className="w-5 h-5 md:mr-0 mr-1.5" /> <span className="md:hidden">Edit</span>
                  </button>
                  <button onClick={() => handleHapusSoal(item.id)} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center text-xs font-semibold">
                    <TrashIcon className="w-5 h-5 md:mr-0 mr-1.5" /> <span className="md:hidden">Hapus</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
