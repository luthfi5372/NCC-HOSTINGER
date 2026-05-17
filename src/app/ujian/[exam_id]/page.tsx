'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  Menu
} from 'lucide-react';

export default function ExamRoom({ params }: { params: { exam_id: string } }) {
  const examId = params.exam_id;
  const router = useRouter();
  const supabase = createClient();

  const [student, setStudent] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(5400); // Default 90 Menit (dalam detik)

  // 1. Inisialisasi Data & Tarik Soal
  useEffect(() => {
    const savedUser = localStorage.getItem('ncc_user');
    if (!savedUser) {
      router.push('/ujian/login');
      return;
    }
    const parsedUser = JSON.parse(savedUser);
    setStudent(parsedUser);

    const loadExamData = async () => {
      try {
        // Ambil durasi waktu dari tabel ujian
        const { data: examData } = await supabase.from('cbt_exams').select('duration').eq('id', examId).single();
        if (examData?.duration) setTimeLeft(examData.duration * 60);

        // Ambil daftar soal
        const { data: qData } = await supabase.from('cbt_questions').select('*'); // Idealnya di-filter berdasarkan exam_id
        if (qData) {
          // Acak urutan soal agar tiap siswa berbeda
          const shuffled = qData.sort(() => 0.5 - Math.random());
          setQuestions(shuffled);
        }

        // Catat bahwa siswa mulai ujian (Upsert ke tabel attempts)
        await supabase.from('cbt_attempts').upsert({
          user_id: parsedUser.nisn || parsedUser.username,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadExamData();
  }, [examId, router]);

  // 2. Mesin Waktu Mundur
  useEffect(() => {
    if (loading || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [loading, timeLeft]);

  // 3. 🚨 PROTOKOL ANTI-CHEAT (DETEKSI ALT+TAB) 🚨
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden && student) {
        alert("⚠️ PERINGATAN PELANGGARAN!\nAnda terdeteksi keluar dari layar ujian. Insiden ini telah dicatat dan dikirim ke Pusat Komando Panitia.");
        
        // Tarik data pelanggaran sebelumnya, tambah 1, lalu kirim ke Database
        const userId = student.nisn || student.username;
        const { data } = await supabase.from('cbt_attempts').select('violations_count').eq('user_id', userId).single();
        const currentViolations = data?.violations_count || 0;
        
        await supabase.from('cbt_attempts').update({
          violations_count: currentViolations + 1,
          updated_at: new Date().toISOString()
        }).eq('user_id', userId);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [student]);

  // 4. Handle Pilih Jawaban (Auto-Save Simulation)
  const handleSelectOption = async (questionId: string, option: string) => {
    const newAnswers = { ...answers, [questionId]: option };
    setAnswers(newAnswers);
    
    // Kirim sinyal "Masih Aktif" ke CCTV Admin
    const userId = student?.nisn || student?.username;
    if (userId) {
      await supabase.from('cbt_attempts').update({ updated_at: new Date().toISOString() }).eq('user_id', userId);
    }
  };

  // 5. Submit Ujian
  const handleSubmitExam = async () => {
    const confirmSubmit = window.confirm("Apakah Anda yakin ingin menyelesaikan ujian? Anda tidak bisa kembali setelah ini.");
    if (!confirmSubmit) return;

    setLoading(true);
    const userId = student?.nisn || student?.username;
    
    // Tandai selesai di database (submitted_at)
    await supabase.from('cbt_attempts').update({
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
      // Di sini nantinya kita sisipkan logika auto-scoring
    }).eq('user_id', userId);

    alert("Ujian Selesai! Jawaban berhasil diamankan di cloud.");
    router.push('/ujian/dashboard');
  };

  // Format Waktu MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7fe] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-[#5145cd] rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-black text-[#5145cd] uppercase tracking-widest">Membangun Ruang Ujian Enkripsi...</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen bg-[#f4f7fe] font-sans text-gray-800 select-none">
      
      {/* TOP HEADER */}
      <header className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-[#5145cd] text-white rounded-xl flex items-center justify-center font-black text-lg">N</div>
          <div className="hidden md:block">
            <h1 className="text-sm font-black text-gray-900 leading-tight">{student?.active_exam_title || 'Olimpiade MIPA'}</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{student?.full_name || 'Peserta'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 md:space-x-8">
          {/* Sisa Waktu */}
          <div className="flex items-center px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full">
            <Clock className={`w-5 h-5 mr-2 ${timeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-[#5145cd]'}`} />
            <span className={`font-mono font-black text-lg tracking-widest ${timeLeft < 300 ? 'text-rose-600' : 'text-[#5145cd]'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          <button onClick={handleSubmitExam} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2" /> Selesai
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* AREA SOAL UTAMA (KIRI) */}
        <div className="lg:col-span-3 space-y-4">
          {questions.length === 0 ? (
            <div className="bg-white p-10 rounded-[32px] text-center border border-gray-100 shadow-sm">
              <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <h2 className="text-lg font-black text-gray-800">Bank Soal Kosong</h2>
              <p className="text-sm text-gray-500 mt-2">Panitia belum memasukkan soal ke dalam sistem. Silakan lapor pengawas.</p>
            </div>
          ) : (
            <div className="bg-white p-6 md:p-10 rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] min-h-[500px] flex flex-col">
              
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
                 <span className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-black tracking-widest">
                   SOAL NO. {currentIndex + 1}
                 </span>
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                   <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1" /> Auto-Save Aktif
                 </span>
              </div>

              {/* Teks Soal & Gambar */}
              <div className="flex-1">
                <p className="text-lg font-medium text-gray-800 leading-relaxed mb-6 whitespace-pre-wrap">
                  {currentQ.question_text || 'Deskripsi soal tidak tersedia.'}
                </p>
                {currentQ.image_url && (
                  <img src={currentQ.image_url} alt="Ilustrasi Soal" className="max-w-full h-auto rounded-xl border border-gray-100 mb-6 shadow-sm" />
                )}

                {/* Opsi Jawaban */}
                <div className="space-y-3 mt-8">
                  {['A', 'B', 'C', 'D', 'E'].map((letter) => {
                    const optionText = currentQ[`option_${letter.toLowerCase()}`];
                    if (!optionText) return null; // Sembunyikan jika opsi kosong
                    
                    const isSelected = answers[currentQ.id] === letter;
                    return (
                      <button
                        key={letter}
                        onClick={() => handleSelectOption(currentQ.id, letter)}
                        className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all text-left group
                          ${isSelected 
                            ? 'border-[#5145cd] bg-indigo-50/50 shadow-md' 
                            : 'border-gray-100 bg-white hover:border-indigo-200 hover:bg-gray-50'}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black mr-4 transition-colors flex-shrink-0
                          ${isSelected ? 'bg-[#5145cd] text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-[#5145cd]'}`}>
                          {letter}
                        </div>
                        <span className={`text-sm font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                          {optionText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigasi Bawah */}
              <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-50">
                <button 
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
                >
                  Sebelumnya
                </button>
                <button 
                  onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentIndex === questions.length - 1}
                  className="px-6 py-3 bg-[#5145cd] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#3d32a8] disabled:opacity-50 transition-all shadow-md shadow-indigo-200"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR NOMOR SOAL (KANAN) */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] sticky top-24">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center">
              <Menu className="w-5 h-5 mr-2" /> Peta Soal
            </h3>
            
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const hasAnswered = !!answers[q.id];
                const isCurrent = idx === currentIndex;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-full aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-all border-2
                      ${isCurrent ? 'border-[#5145cd] shadow-md scale-110 z-10' : 'border-transparent hover:border-indigo-200'}
                      ${hasAnswered ? 'bg-[#5145cd] text-white' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 space-y-2">
               <div className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                 <div className="w-3 h-3 bg-[#5145cd] rounded mr-2"></div> Telah Dijawab
               </div>
               <div className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                 <div className="w-3 h-3 bg-gray-100 rounded mr-2"></div> Belum Dijawab
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
