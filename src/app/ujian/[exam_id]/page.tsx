"use client";
export const dynamic = 'force-dynamic';
// Vercel Deployment Sync: Modul 3 Proctoring System Active

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Timer, ShieldAlert, Flag, CheckCircle2, 
  ChevronLeft, ChevronRight, Send, AlertTriangle,
  LayoutDashboard, Info, Loader2, X,
  Expand, ShieldExclamation as ShieldExclamationIcon,
  Maximize as ArrowsInLineHorizontalIcon
} from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { useAdvancedProctoring } from "@/hooks/useAdvancedProctoring";

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

export default function PengerjaanUjianSesi() {
  const params = useParams();
  const router = useRouter();
  const exam_id = params.exam_id as string;
  const supabase = createClient();

  // --- 🧊 STATE ---
  const [examData, setExamData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [warnings, setWarnings] = useState(0);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [attemptId, setAttemptId] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // 🛡️ ADVANCED PROCTORING HOOK
  const { 
    violationsCount, 
    setViolations, 
    showModal, 
    setShowModal, 
    warningMessage 
  } = useAdvancedProctoring({
    examId: exam_id,
    userId: attemptId, // Will be set in useEffect
    attemptId: attemptId,
    maxViolations: 3,
    onBlock: () => setIsLocked(true)
  });

  // --- 📡 DATA INITIALIZATION ---
  useEffect(() => {
    const initExam = async () => {
      // 1. Get User/Attempt from Session Storage (saved by Gateway)
      const ticketId = sessionStorage.getItem('ncc_ticket_id');
      const savedAttemptId = sessionStorage.getItem('ncc_attempt_id');
      
      if (!ticketId || !savedAttemptId) {
        router.push('/ujian');
        return;
      }

      setAttemptId(savedAttemptId);

      try {
        // 2. Load Exam Metadata
        const { data: exam } = await supabase.from('cbt_exams').select('*').eq('id', exam_id).single();
        if (!exam) throw new Error("Sesi tidak ditemukan.");
        setExamData(exam);

        // 3. Load Questions
        const { data: qs } = await supabase
          .from('cbt_questions')
          .select('id, question_text, options, difficulty, weight, image_url')
          .eq('exam_id', exam_id)
          .eq('status', 'Published')
          .order('created_at', { ascending: true });
        
        // Shuffle client-side for this session
        const shuffled = (qs || []).sort(() => Math.random() - 0.5);
        setQuestions(shuffled);

        // 4. Load Saved Answers
        const { data: savedAns } = await supabase.from('cbt_answers').select('question_id, selected_option').eq('attempt_id', savedAttemptId);
        if (savedAns) {
          const ansMap: Record<string, string> = {};
          savedAns.forEach(a => ansMap[a.question_id] = a.selected_option);
          setAnswers(ansMap);
        }

        // 5. Timer Logic
        const { data: attempt } = await supabase.from('cbt_attempts').select('started_at, violations_count, status').eq('id', savedAttemptId).single();
        if (attempt.status === 'submitted') {
           setIsFinished(true);
           return;
        }

        setViolations(attempt.violations_count || 0);
        if ((attempt.violations_count || 0) >= 3) setIsLocked(true);
        
        const started = new Date(attempt.started_at).getTime();
        const durationMs = exam.duration_minutes * 60 * 1000;
        const remaining = Math.max(0, Math.floor((started + durationMs - Date.now()) / 1000));
        setTimeLeft(remaining);

      } catch (err) {
        console.error(err);
        router.push('/ujian');
      } finally {
        setIsLoading(false);
      }
    };
    initExam();
  }, [exam_id, supabase, router]);

  // --- ⏱️ TIMER ENGINE ---
  useEffect(() => {
    if (isLoading || isFinished || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(t);
          handleFinish(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isLoading, isFinished, timeLeft]);

  // --- ✍️ ANSWER ENGINE ---
  const saveAnswer = async (qId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [qId]: option }));
    try {
      await fetch('/api/cbt/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attemptId, question_id: qId, selected_option: option })
      });
    } catch (e) { console.error("Auto-save failed"); }
  };

  // --- 🛡️ PROCTORING UI LOGIC ---
  useEffect(() => {
    const checkFS = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', checkFS);
    return () => document.removeEventListener('fullscreenchange', checkFS);
  }, []);

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen().then(() => {
      setIsFullscreen(true);
    }).catch(() => {
      alert("Gagal masuk mode fullscreen. Silakan gunakan browser modern.");
    });
  };

  // --- 🏁 SUBMIT ENGINE ---
  const handleFinish = async (isAuto = false) => {
    setIsSubmitting(true);
    setShowConfirm(false);
    try {
      const res = await fetch('/api/cbt/answers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attemptId })
      });
      const data = await res.json();
      setScore(data.score);
      setIsFinished(true);
    } catch (e) {
      alert("Gagal mengumpulkan. Silakan hubungi panitia.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 🖼️ UI HELPERS ---
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  if (isLoading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
       <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
          <p className="text-indigo-300 font-black tracking-widest text-xs uppercase">Menyiapkan Ruang Ujian Virtual...</p>
       </div>
    </div>
  );

  if (isLocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-inter">
         <div className="max-w-md w-full text-center space-y-8">
            <div className="w-24 h-24 bg-rose-500 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-2xl shadow-rose-500/20">
               <ShieldAlert size={48} />
            </div>
            <div>
               <h1 className="text-4xl font-black tracking-tight">Akses Dibekukan</h1>
               <p className="text-slate-400 mt-3 font-medium leading-relaxed">
                  Anda telah mencapai batas maksimal toleransi keluar dari sistem (3 kali). 
                  Lembar jawaban Anda telah dikunci dan dilaporkan ke Pusat Komando demi integritas kompetisi.
               </p>
            </div>
            <button 
              onClick={() => router.push('/')}
              className="w-full bg-white text-slate-900 py-5 rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all"
            >
               Kembali ke Beranda
            </button>
         </div>
      </div>
    );
  }

  if (!isFullscreen && !isLoading && !isFinished) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm max-w-md text-center">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <ArrowsInLineHorizontalIcon size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Wajib Fullscreen</h2>
          <p className="text-sm text-gray-400 mt-3 leading-relaxed">
            Untuk memulai ujian CBT NCC 13th, browser Anda diwajibkan mengunci layar penuh guna mengaktifkan sistem monitoring integritas kelulusan.
          </p>
          <button
            onClick={enterFullscreen}
            className="mt-8 w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-indigo-100"
          >
            Masuk Mode Layar Penuh & Mulai
          </button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-inter">
         <div className="max-w-md w-full text-center space-y-8">
            <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-2xl shadow-emerald-500/20">
               <CheckCircle2 size={48} />
            </div>
            <div>
               <h1 className="text-4xl font-black tracking-tight">Ujian Selesai!</h1>
               <p className="text-slate-400 mt-3 font-medium">
                  Terima kasih telah berpartisipasi dalam NCC 13th MIPA Olympiad.
               </p>
            </div>
            
            {score !== null && (
               <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Skor Akhir Kamu</span>
                  <div className="text-7xl font-black text-indigo-400 my-2">{score}</div>
                  <p className="text-xs text-slate-500 font-bold">Hasil ini telah tersinkronisasi ke pusat data panitia.</p>
               </div>
            )}

            <button 
              onClick={() => router.push('/')}
              className="w-full bg-white text-slate-900 py-5 rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all"
            >
               Kembali ke Beranda
            </button>
         </div>
      </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div className="min-h-screen bg-[#f8fafc] font-inter flex flex-col overflow-hidden select-none">
      {/* --- WARNING MODAL NOTIFICATION --- */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <div className="bg-white p-10 rounded-[3rem] border border-amber-100 shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <ShieldExclamationIcon size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Sinyal Peringatan</h3>
            <p className="text-sm text-gray-500 mt-3 leading-relaxed">
              {warningMessage}
            </p>
            <div className="mt-6 bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 text-xs font-black text-amber-800">
              Total Pelanggaran: {violationsCount} / 3
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="mt-8 w-full py-4 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-amber-100"
            >
              Kembali Fokus Ujian
            </button>
          </div>
        </div>
      )}

      {/* 🚩 PROCTORING ALERT BAR */}
      {violationsCount > 0 && (
        <div className={`py-3 text-center text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 ${violationsCount >= 2 ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-400 text-amber-950'}`}>
           <ShieldAlert size={14} />
           Radar Deteksi: {violationsCount} / 3 Pelanggaran Terdeteksi
        </div>
      )}

      {/* 🚀 SMART NAV BAR */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
               <Timer size={20} />
            </div>
            <div>
               <h2 className="font-black text-slate-800 leading-none">{examData.title}</h2>
               <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">
                  Progress: {Math.round((Object.keys(answers).length / questions.length) * 100)}% Terselesaikan
               </p>
            </div>
         </div>

         <div className="flex items-center gap-6">
            <div className={`px-6 py-3 rounded-2xl font-mono font-black text-lg shadow-sm border transition-all ${timeLeft <= 300 ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
               {formatTime(timeLeft)}
            </div>
            <button 
              onClick={() => setShowConfirm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-black text-xs shadow-xl shadow-indigo-100 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
               <Send size={16} /> Kumpulkan
            </button>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
         {/* 📖 MAIN QUESTION AREA */}
         <div className="flex-1 overflow-y-auto p-10 flex justify-center">
            <div className="max-w-4xl w-full space-y-8 pb-20">
               {q && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                           <span className="w-12 h-12 bg-indigo-600 text-white rounded-[1.25rem] flex items-center justify-center font-black text-xl shadow-lg">
                              {currentQ + 1}
                           </span>
                           <div>
                              <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${q.difficulty === 'Hard' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                {q.difficulty}
                              </span>
                              <span className="text-[10px] font-black text-slate-300 ml-3 uppercase tracking-widest">Point: {q.weight}</span>
                           </div>
                        </div>
                        <button 
                          onClick={() => {
                            const next = new Set(flagged);
                            next.has(currentQ) ? next.delete(currentQ) : next.add(currentQ);
                            setFlagged(next);
                          }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${flagged.has(currentQ) ? 'bg-amber-100 text-amber-700 border border-amber-200 shadow-inner' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}
                        >
                           <Flag size={14} /> {flagged.has(currentQ) ? 'Ragu-ragu (Aktif)' : 'Tandai Ragu'}
                        </button>
                     </div>

                     <div className="bg-white rounded-[3rem] p-12 border border-slate-200 shadow-sm mb-8">
                        <div 
                          className="text-slate-800 font-bold text-xl leading-relaxed mb-6"
                          dangerouslySetInnerHTML={{ __html: renderMath(q.question_text) }}
                        />
                        {q.image_url && (
                          <div className="rounded-[2rem] overflow-hidden border border-slate-100 bg-slate-50 p-2 shadow-inner">
                            <img src={q.image_url} alt="Soal Visual" className="max-h-[30rem] w-full object-contain mx-auto" />
                          </div>
                        )}
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(q.options).map(([key, value]) => (
                           <button
                             key={key}
                             onClick={() => saveAnswer(q.id, key)}
                             className={`p-6 rounded-[2rem] border-2 transition-all flex items-start gap-5 text-left group ${answers[q.id] === key ? 'bg-indigo-50 border-indigo-400 shadow-xl shadow-indigo-100' : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                           >
                              <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${answers[q.id] === key ? 'bg-indigo-600 text-white scale-110 shadow-lg' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                 {key}
                              </span>
                              <div 
                                className={`text-sm font-black pt-2 ${answers[q.id] === key ? 'text-indigo-800' : 'text-slate-600'}`}
                                dangerouslySetInnerHTML={{ __html: renderMath(value as string) }}
                              />
                           </button>
                        ))}
                     </div>

                     <div className="flex items-center justify-between mt-12">
                        <button 
                          onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                          disabled={currentQ === 0}
                          className="flex items-center gap-2 px-8 py-4 bg-white text-slate-600 rounded-2xl font-black text-sm border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all"
                        >
                           <ChevronLeft size={20} /> Sebelumnya
                        </button>
                        
                        {currentQ < questions.length - 1 ? (
                           <button 
                             onClick={() => setCurrentQ(currentQ + 1)}
                             className="flex items-center gap-2 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                           >
                              Berikutnya <ChevronRight size={20} />
                           </button>
                        ) : (
                           <button 
                             onClick={() => setShowConfirm(true)}
                             className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl shadow-emerald-200 flex items-center gap-2 hover:bg-emerald-700 transition-all"
                           >
                              Selesaikan <CheckCircle2 size={20} />
                           </button>
                        )}
                     </div>
                  </div>
               )}
            </div>
         </div>

         {/* 🗺️ MAP SIDEBAR */}
         <div className="w-80 bg-white border-l border-slate-200 p-8 hidden xl:flex flex-col">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6 flex items-center gap-2">
               <LayoutDashboard size={14} /> Peta Navigasi Soal
            </h3>
            <div className="grid grid-cols-4 gap-3">
               {questions.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentQ(idx)}
                    className={`aspect-square rounded-xl flex items-center justify-center font-black text-xs transition-all relative ${
                      currentQ === idx ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-110 z-10' :
                      flagged.has(idx) ? 'bg-amber-100 text-amber-600 border border-amber-200' :
                      answers[item.id] ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      'bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                     {idx + 1}
                     {answers[item.id] && currentQ !== idx && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>}
                  </button>
               ))}
            </div>

            <div className="mt-auto space-y-4 pt-6 border-t border-slate-100">
               <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tight">
                  <span className="text-slate-400">Total Soal</span>
                  <span className="text-slate-800">{questions.length}</span>
               </div>
               <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tight">
                  <span className="text-slate-400">Terjawab</span>
                  <span className="text-emerald-600">{Object.keys(answers).length}</span>
               </div>
               <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tight">
                  <span className="text-slate-400">Ragu-ragu</span>
                  <span className="text-amber-500">{flagged.size}</span>
               </div>
            </div>
         </div>
      </div>

      {/* 🏁 FINAL CONFIRM MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowConfirm(false)}></div>
           <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative z-10 text-center animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                 <CheckCircle2 size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-800">Kumpulkan Ujian?</h3>
              <p className="text-slate-500 font-medium mt-3 leading-relaxed">
                 Kamu telah menjawab <strong>{Object.keys(answers).length}</strong> dari <strong>{questions.length}</strong> soal. <br/>
                 Jawaban tidak dapat diubah setelah dikumpulkan.
              </p>

              <div className="flex flex-col gap-3 mt-8">
                 <button 
                  onClick={() => handleFinish()}
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                 >
                    {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'Ya, Saya Yakin Selesai'}
                 </button>
                 <button 
                  onClick={() => setShowConfirm(false)}
                  className="w-full bg-slate-50 text-slate-500 py-5 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all"
                 >
                    Batal, Cek Lagi
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
