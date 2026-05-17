'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  Menu,
  Send,
  ShieldAlert
} from 'lucide-react';

export default function ExamRoom({ params }: { params: { exam_id: string } }) {
  const examId = params.exam_id;
  const router = useRouter();
  const supabase = createClient();

  const [student, setStudent] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [doubtfulAnswers, setDoubtfulAnswers] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(5400); 

  // 🔥 STATE BARU: Untuk UI Modal Pelanggaran
  const [showCheatWarning, setShowCheatWarning] = useState(false);
  const [violationCount, setViolationCount] = useState(0);

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
        const { data: examData } = await supabase.from('cbt_exams').select('duration').eq('id', examId).single();
        if (examData?.duration) setTimeLeft(examData.duration * 60);

        const { data: qData } = await supabase.from('cbt_questions').select('*'); 
        if (qData) {
          const shuffled = qData.sort(() => 0.5 - Math.random());
          setQuestions(shuffled);
        }

        // Ambil data pelanggaran sebelumnya jika ada
        const { data: attemptData } = await supabase.from('cbt_attempts').select('violations_count').eq('user_id', parsedUser.nisn || parsedUser.username).single();
        if (attemptData) setViolationCount(attemptData.violations_count || 0);

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

  useEffect(() => {
    if (loading || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [loading, timeLeft]);

  // 🔥 PROTOKOL ANTI-CHEAT (DIPERBARUI DENGAN CUSTOM UI)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden && student) {
        // Tampilkan Custom Modal yang keren, bukan alert() bawaan browser
        setShowCheatWarning(true);
        
        const userId = student.nisn || student.username;
        const newViolationCount = violationCount + 1;
        setViolationCount(newViolationCount);

        // Diam-diam kirim sinyal ke CCTV Admin
        await supabase.from('cbt_attempts').update({ 
          violations_count: newViolationCount, 
          updated_at: new Date().toISOString() 
        }).eq('user_id', userId);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [student, violationCount]);

  const handleSelectOption = async (questionId: string, option: string) => {
    const newAnswers = { ...answers, [questionId]: option };
    setAnswers(newAnswers);
    
    if (doubtfulAnswers[questionId]) {
      setDoubtfulAnswers(prev => ({ ...prev, [questionId]: false }));
    }

    const userId = student?.nisn || student?.username;
    if (userId) {
      await supabase.from('cbt_attempts').update({ updated_at: new Date().toISOString() }).eq('user_id', userId);
    }
  };

  const handleToggleDoubt = () => {
    if (!questions[currentIndex]) return;
    const qId = questions[currentIndex].id;
    setDoubtfulAnswers(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleSubmitExam = async () => {
    const confirmSubmit = window.confirm("Apakah Anda yakin ingin menyelesaikan ujian? Anda tidak bisa kembali setelah ini.");
    if (!confirmSubmit) return;

    setLoading(true);
    const userId = student?.nisn || student?.username;
    
    await supabase.from('cbt_attempts').update({
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('user_id', userId);

    alert("Ujian Selesai! Jawaban berhasil diamankan di cloud.");
    router.push('/ujian/dashboard');
  };

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
    <div className="min-h-screen bg-[#f4f7fe] font-sans text-gray-800 select-none pb-10 relative">
      
      {/* 🔥 OVERLAY MODAL PERINGATAN KECURANGAN 🔥 */}
      {showCheatWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] p-8 md:p-10 max-w-md w-full shadow-2xl border-4 border-rose-500 text-center transform scale-100 animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <ShieldAlert className="w-14 h-14 text-rose-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">PELANGGARAN TERDETEKSI</h2>
            <p className="text-sm font-bold text-gray-500 mt-3 leading-relaxed">
              Sistem keamanan mendeteksi Anda keluar dari layar ujian atau menekan <span className="px-2 py-1 bg-gray-100 rounded text-gray-700 font-mono text-xs">Alt+Tab</span>.
            </p>
            <div className="mt-6 p-4 bg-rose-50 rounded-2xl border border-rose-100">
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Status Pusat Komando</p>
              <p className="text-xs font-bold text-rose-500 mt-1">Sinyal Peringatan ke-{violationCount} Telah Dikirim ke Layar Pengawas!</p>
            </div>
            <button 
              onClick={() => setShowCheatWarning(false)}
              className="w-full mt-8 py-4 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-rose-200"
            >
              Saya Mengerti & Tidak Akan Mengulangi
            </button>
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-[#5145cd] text-white rounded-xl flex items-center justify-center font-black text-lg shadow-inner">N</div>
          <div className="hidden md:block">
            <h1 className="text-sm font-black text-gray-900 leading-tight">{student?.active_exam_title || 'Olimpiade MIPA'}</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{student?.full_name || 'Peserta'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 md:space-x-8">
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

      <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10">
        
        {/* AREA SOAL UTAMA (KIRI) */}
        <div className="lg:col-span-3 space-y-4">
          {questions.length === 0 ? (
            <div className="bg-white p-10 rounded-[32px] text-center border border-gray-100 shadow-sm">
              <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <h2 className="text-lg font-black text-gray-800">Bank Soal Kosong</h2>
              <p className="text-sm text-gray-500 mt-2">Panitia belum memasukkan soal ke dalam sistem. Silakan lapor pengawas.</p>
            </div>
          ) : (
            <div className="bg-white p-6 md:p-10 rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] min-h-[500px] flex flex-col relative">
              
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

                {/* Opsi Jawaban (JSONB) */}
                <div className="space-y-3 mt-8">
                  {currentQ.options && Object.keys(currentQ.options).length > 0 ? (
                    ['A', 'B', 'C', 'D', 'E'].map((letter) => {
                      const optionText = currentQ.options[letter] || currentQ.options[letter.toLowerCase()];
                      if (!optionText) return null; 
                      
                      const isSelected = answers[currentQ.id] === letter;
                      return (
                        <button
                          key={letter}
                          onClick={() => handleSelectOption(currentQ.id, letter)}
                          className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all text-left group
                            ${isSelected 
                              ? 'border-[#5145cd] bg-indigo-50/50 shadow-md scale-[1.01]' 
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
                    })
                  ) : (
                    <div className="w-full p-5 bg-amber-50 border-2 border-amber-200 border-dashed rounded-2xl flex items-center text-amber-600">
                      <AlertTriangle className="w-6 h-6 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest">Opsi Kosong</p>
                        <p className="text-[10px] font-bold mt-0.5">Data JSON opsi belum diinput panitia.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* NAVIGASI BAWAH */}
              <div className="flex flex-col md:flex-row justify-between items-center mt-10 pt-6 border-t border-gray-50 gap-4">
                <button 
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="w-full md:w-auto px-6 py-3 bg-white border-2 border-gray-200 text-gray-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
                >
                  Sebelumnya
                </button>

                <label className="w-full md:w-auto flex items-center justify-center space-x-3 cursor-pointer bg-amber-50 px-6 py-3 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={!!doubtfulAnswers[currentQ.id]}
                    onChange={handleToggleDoubt}
                    className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500 border-amber-300"
                  />
                  <span className="text-xs font-black text-amber-600 uppercase tracking-widest">Ragu - Ragu</span>
                </label>

                {currentIndex === questions.length - 1 ? (
                  <button 
                    onClick={handleSubmitExam}
                    className="w-full md:w-auto px-6 py-3 bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all shadow-md shadow-emerald-200 flex items-center justify-center"
                  >
                    Kirim & Selesai <Send className="w-4 h-4 ml-2" />
                  </button>
                ) : (
                  <button 
                    onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    className="w-full md:w-auto px-6 py-3 bg-[#5145cd] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#3d32a8] transition-all shadow-md shadow-indigo-200"
                  >
                    Selanjutnya
                  </button>
                )}
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
                const isDoubtful = !!doubtfulAnswers[q.id];
                const isCurrent = idx === currentIndex;
                
                let btnStyle = "bg-gray-100 text-gray-500 border-transparent hover:border-indigo-200"; 
                if (isDoubtful) {
                  btnStyle = "bg-amber-400 text-white border-amber-500 shadow-sm"; 
                } else if (hasAnswered) {
                  btnStyle = "bg-[#5145cd] text-white border-[#5145cd] shadow-sm"; 
                }
                if (isCurrent) {
                  btnStyle += " scale-110 ring-2 ring-offset-1 ring-gray-800 z-10"; 
                }
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-full aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-all border-2 ${btnStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 space-y-2.5">
               <div className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                 <div className="w-3.5 h-3.5 bg-[#5145cd] rounded-[4px] mr-2 shadow-sm"></div> Telah Dijawab
               </div>
               <div className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                 <div className="w-3.5 h-3.5 bg-amber-400 rounded-[4px] mr-2 shadow-sm"></div> Ragu - Ragu
               </div>
               <div className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                 <div className="w-3.5 h-3.5 bg-gray-100 border border-gray-200 rounded-[4px] mr-2"></div> Belum Dijawab
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
