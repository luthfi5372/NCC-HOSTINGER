"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import katex from "katex";
import "katex/dist/katex.min.css";

const renderMath = (text: string) => {
  if (!text) return "";
  let html = text;
  // Parse block math $$...$$
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula, { displayMode: true, throwOnError: false });
    } catch (e) {
      return match;
    }
  });
  // Parse inline math $...$
  html = html.replace(/\$(.*?)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula, { displayMode: false, throwOnError: false });
    } catch (e) {
      return match;
    }
  });
  return html;
};

// ============================================================================
// TYPES
// ============================================================================
type Question = {
  id: string;
  question_text: string;
  options: Record<string, string>;
  difficulty: string;
  weight: number;
  image_url?: string;
};

type ExamState = "login" | "exam" | "submitted";

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function UjianPage() {
  const supabase = createClient();

  // --- STATE ---
  const [examState, setExamState] = useState<ExamState>("login");
  const [token, setToken] = useState("");
  const [userId, setUserId] = useState("");
  const [examData, setExamData] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [attemptId, setAttemptId] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState(0);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const savingRef = useRef(false);

  // --- LOGIN & START EXAM ---
  const handleLogin = async () => {
    if (!token.trim() || !userId.trim()) {
      setError("Masukkan ID Peserta dan Token Ujian.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // 1. Find exam by token
      const { data: exams } = await supabase
        .from("cbt_exams")
        .select("*")
        .eq("token", token.trim().toUpperCase())
        .eq("is_active", true)
        .single();

      if (!exams) {
        setError("Token tidak valid atau sesi ujian belum diaktifkan.");
        setLoading(false);
        return;
      }
      setExamData(exams);

      // 2. Start or resume attempt
      const res = await fetch("/api/cbt/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId.trim(), exam_id: exams.id, token: token.trim().toUpperCase() }),
      });
      const attemptRes = await res.json();
      if (!attemptRes.success) {
        setError(attemptRes.error || "Gagal memulai sesi.");
        setLoading(false);
        return;
      }

      const attempt = attemptRes.data;
      if (attempt.status === "submitted" || attempt.status === "disqualified") {
        setError(`Sesi ujian Anda sudah ${attempt.status === "submitted" ? "dikumpulkan" : "didiskualifikasi"}.`);
        setLoading(false);
        return;
      }
      setAttemptId(attempt.id);
      setWarnings(attempt.warnings_count || 0);

      // 3. Fetch questions
      const { data: qs } = await supabase
        .from("cbt_questions")
        .select("id, question_text, options, difficulty, weight, image_url")
        .eq("exam_id", exams.id)
        .eq("status", "Published")
        .order("created_at", { ascending: true });
      
      // Shuffle for fairness
      const shuffled = (qs || []).sort(() => Math.random() - 0.5);
      setQuestions(shuffled);

      // 4. Recover saved answers
      const savedRes = await fetch(`/api/cbt/answers?attempt_id=${attempt.id}`);
      const savedJson = await savedRes.json();
      if (savedJson.success && savedJson.data) {
        setAnswers(savedJson.data);
      }

      // 5. Calculate remaining time
      const started = new Date(attempt.started_at).getTime();
      const durationMs = exams.duration_minutes * 60 * 1000;
      const remaining = Math.max(0, Math.floor((started + durationMs - Date.now()) / 1000));
      setTimeLeft(remaining);

      setExamState("exam");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    }
    setLoading(false);
  };

  // --- TIMER ---
  useEffect(() => {
    if (examState !== "exam" || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [examState, timeLeft > 0]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // --- AUTO-SAVE ---
  const saveAnswer = useCallback(
    async (qId: string, option: string) => {
      if (savingRef.current) return;
      savingRef.current = true;
      try {
        await fetch("/api/cbt/answers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attempt_id: attemptId, question_id: qId, selected_option: option }),
        });
      } catch {
        // Silent fail — saved locally
      }
      savingRef.current = false;
    },
    [attemptId]
  );

  const selectAnswer = (qId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: option }));
    saveAnswer(qId, option);
  };

  // --- PROCTORING: Tab Switch Detection ---
  useEffect(() => {
    if (examState !== "exam") return;

    const handleVisibility = async () => {
      if (document.hidden) {
        const newW = warnings + 1;
        setWarnings(newW);

        try {
          await fetch("/api/cbt/attempts", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ attempt_id: attemptId, action: "add_warning" }),
          });
        } catch {}

        if (newW >= 3) {
          setExamState("submitted");
          setScore(-1); // DQ marker
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [examState, warnings, attemptId]);

  // --- SUBMIT ---
  const handleSubmit = async (isTimeout = false) => {
    setShowConfirm(false);
    setLoading(true);
    try {
      // Batch save remaining answers
      const batch = Object.entries(answers).map(([qId, opt]) => ({
        attempt_id: attemptId,
        question_id: qId,
        selected_option: opt,
      }));
      if (batch.length > 0) {
        await fetch("/api/cbt/answers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batch),
        });
      }

      // Trigger grading
      const res = await fetch("/api/cbt/answers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attempt_id: attemptId }),
      });
      const result = await res.json();
      setScore(result.score ?? 0);
      setExamState("submitted");
    } catch {
      setScore(0);
      setExamState("submitted");
    }
    setLoading(false);
  };

  const toggleFlag = (idx: number) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const progressPct = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  const isUrgent = timeLeft <= 300 && timeLeft > 0;

  // ============================================================================
  // RENDER: LOGIN GATE
  // ============================================================================
  if (examState === "login") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-200 mb-4">
              <span className="text-white text-2xl font-black">📝</span>
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">CBT Olimpiade MIPA</h1>
            <p className="text-sm text-slate-500 mt-1">National Competition Championship ke-13</p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ID Peserta / Tiket</label>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Contoh: NCC-27"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Token Akses Ujian</label>
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Contoh: NCC13MIPA"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-50 transition-all uppercase"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-xs font-bold rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
            >
              {loading ? "Memverifikasi..." : "Masuk ke Sesi Ujian"}
            </button>
          </div>

          <div className="mt-6 bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-800 space-y-1">
            <p className="font-bold">⚠️ Peraturan Ujian:</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-700">
              <li>Dilarang berpindah tab browser selama ujian berlangsung.</li>
              <li>Pelanggaran 3x akan mengakibatkan <strong>diskualifikasi otomatis</strong>.</li>
              <li>Jawaban disimpan otomatis setiap kali Anda memilih.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: SUBMITTED / SCORE
  // ============================================================================
  if (examState === "submitted") {
    const isDQ = score === -1;
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg text-center">
          <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-lg mb-6 ${isDQ ? "bg-red-500 shadow-red-200" : "bg-emerald-500 shadow-emerald-200"}`}>
            <span className="text-white text-3xl">{isDQ ? "❌" : "✅"}</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800">
            {isDQ ? "Anda Didiskualifikasi" : "Ujian Selesai!"}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {isDQ
              ? "Anda melanggar aturan proctoring sebanyak 3 kali."
              : `Terima kasih telah menyelesaikan ujian CBT Olimpiade MIPA.`}
          </p>

          {!isDQ && score !== null && (
            <div className="mt-8 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm inline-block">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Skor Akhir Anda</p>
              <p className="text-6xl font-black text-indigo-600 mt-2">{score}</p>
              <p className="text-sm text-slate-500 mt-1">dari 100 poin</p>
              <div className="mt-4 text-xs text-slate-400">
                {answeredCount} dari {questions.length} soal dijawab
              </div>
            </div>
          )}

          <div className="mt-8">
            <button
              onClick={() => window.location.href = "/"}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold text-sm transition-all"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: EXAM INTERFACE
  // ============================================================================
  const q = questions[currentQ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* PROCTORING WARNING BANNER */}
      {warnings > 0 && (
        <div className={`px-4 py-2 text-center text-xs font-bold ${warnings >= 2 ? "bg-red-600 text-white animate-pulse" : "bg-amber-400 text-amber-900"}`}>
          🚩 Peringatan Proctoring: Anda telah berpindah tab {warnings}x. Batas maksimal: 3x (diskualifikasi otomatis).
        </div>
      )}

      {/* TOP BAR */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-sm font-black">📝</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-tight">{examData?.title || "CBT MIPA"}</p>
            <p className="text-[10px] text-slate-400">ID: {userId} • Token: {examData?.token}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Progress */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-[10px] font-bold text-slate-400">{answeredCount}/{questions.length}</span>
          </div>

          {/* Timer */}
          <div className={`px-4 py-2 rounded-xl font-mono font-black text-sm ${isUrgent ? "bg-red-50 text-red-600 border border-red-200 animate-pulse" : "bg-slate-50 text-slate-700 border border-slate-200"}`}>
            ⏱ {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex">
        {/* QUESTION AREA */}
        <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
          {q && (
            <div className="space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm">
                    {currentQ + 1}
                  </span>
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      q.difficulty === "Hard" ? "bg-red-50 text-red-600 border border-red-100" :
                      q.difficulty === "Medium" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                      "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    }`}>
                      {q.difficulty}
                    </span>
                    <span className="text-[10px] font-bold text-purple-500 ml-2">+{q.weight} poin</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleFlag(currentQ)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    flagged.has(currentQ) ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-slate-50 text-slate-400 border border-slate-200 hover:bg-amber-50"
                  }`}
                >
                  {flagged.has(currentQ) ? "🚩 Ditandai" : "🏳 Tandai Ragu"}
                </button>
              </div>

              {/* Question Text */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div 
                  className="text-slate-800 font-semibold text-base leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderMath(q.question_text) }}
                />
                {q.image_url && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                    <img src={q.image_url} alt="Soal" className="max-h-64 object-contain mx-auto p-2" />
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3">
                {Object.entries(q.options).map(([key, value]) => {
                  const isSelected = answers[q.id] === key;
                  return (
                    <button
                      key={key}
                      onClick={() => selectAnswer(q.id, key)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all active:scale-[0.99] flex items-start gap-4 ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-400 shadow-sm"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                        isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                      }`}>
                        {key}
                      </span>
                      <span 
                        className={`text-sm font-medium pt-1 ${isSelected ? "text-indigo-800" : "text-slate-700"}`}
                        dangerouslySetInnerHTML={{ __html: renderMath(value) }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                  disabled={currentQ === 0}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl font-bold text-sm transition-all"
                >
                  ← Sebelumnya
                </button>

                {currentQ === questions.length - 1 ? (
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-100 transition-all active:scale-[0.98]"
                  >
                    Kumpulkan Ujian ✓
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQ(Math.min(questions.length - 1, currentQ + 1))}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all"
                  >
                    Berikutnya →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* QUESTION MAP SIDEBAR */}
        <div className="hidden lg:block w-64 bg-white border-l border-slate-200 p-4 space-y-4 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
          <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Navigasi Soal</p>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((qq, i) => {
              const isAnswered = !!answers[qq.id];
              const isCurrent = i === currentQ;
              const isFlagged = flagged.has(i);
              return (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    isCurrent ? "bg-indigo-600 text-white ring-2 ring-indigo-300" :
                    isFlagged ? "bg-amber-100 text-amber-700 border border-amber-200" :
                    isAnswered ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                    "bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-emerald-100 border border-emerald-200 rounded" /> Dijawab</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-amber-100 border border-amber-200 rounded" /> Ragu-ragu</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-slate-50 border border-slate-200 rounded" /> Belum dijawab</div>
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-xs transition-all"
          >
            Kumpulkan Ujian
          </button>
        </div>
      </div>

      {/* CONFIRM MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-5">
            <h3 className="text-lg font-black text-slate-800">Yakin ingin mengumpulkan?</h3>
            <div className="text-sm text-slate-600 space-y-1">
              <p>Soal dijawab: <strong className="text-emerald-600">{answeredCount}</strong> / {questions.length}</p>
              <p>Soal belum dijawab: <strong className="text-red-500">{questions.length - answeredCount}</strong></p>
              {flagged.size > 0 && <p>Soal ditandai ragu: <strong className="text-amber-600">{flagged.size}</strong></p>}
            </div>
            <p className="text-xs text-red-500 font-bold">⚠️ Setelah dikumpulkan, Anda tidak bisa mengubah jawaban.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-sm transition-all">
                Kembali
              </button>
              <button onClick={() => handleSubmit(false)} disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white py-2.5 rounded-xl font-bold text-sm transition-all">
                {loading ? "Mengirim..." : "Ya, Kumpulkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
