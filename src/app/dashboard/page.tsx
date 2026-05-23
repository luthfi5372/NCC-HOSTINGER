"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; 
import { CheckCircle2, AlertCircle } from "lucide-react";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusCards from "@/components/dashboard/StatusCards";
import AnnouncementBoard from "@/components/dashboard/AnnouncementBoard";
import TimelineWidget from "@/components/dashboard/TimelineWidget";
import RegistrationModal from "@/components/dashboard/RegistrationModal";
import IdCardModal from "@/components/dashboard/IdCardModal";
import WelcomeOverlay from "@/components/dashboard/WelcomeOverlay";

export default function UserDashboard() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userEntry, setUserEntry] = useState<any>(null);
   const [globalTimeline, setGlobalTimeline] = useState<any[]>([]);
  const [portalWaves, setPortalWaves] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [paymentRequirementStage, setPaymentRequirementStage] = useState('registration');
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const [showForm, setShowForm] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
  
  // Registration Form Local State mapped here so it doesn't drill too hard,
  // but keeping it here causes modal to rerender, not the whole dashboard IF extracted, 
  // wait - if state is here, the whole dashboard rerenders.
  // Actually, I should just move this state INSIDE the modal or keep it here if it's not a big deal since modal covers screen.
  // But moving it here is easiest for now to pass into handleSubmitEntry.
  const [formData, setFormData] = useState({
    full_name: "",
    school_name: "",
    nisn: "",
    province: "",
    competition_type: "Olimpiade MIPA",
    mentor_name: "",
    mentor_email: "",
    mentor_phone: "",
    team_name: "",
    participant2_name: "",
    participant2_nisn: ""
  });
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        let user = authData?.user;
        
        // 🔄 FALLBACK: Jika Supabase Auth kosong, cek Local Storage (Bypass/Local Auth)
        if (!user && typeof window !== 'undefined') {
          const localSess = localStorage.getItem('ncc_local_session');
          if (localSess) {
            try {
              const parsed = JSON.parse(localSess);
              user = { id: parsed.id, email: parsed.email, user_metadata: { full_name: parsed.fullName } } as any;
            } catch (e) {}
          }
        }
        
        if (!user) {
          setIsLoading(false);
          return;
        }
        setCurrentUser(user);
        setFormData(prev => ({ ...prev, full_name: user.user_metadata?.full_name || "" }));

        const { data: entries, error: entryError } = await supabase
          .from('competition_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
           
        const entry = entries && entries.length > 0 ? entries[0] : null;

        if (entry) {
          setUserEntry(entry); // Ambil yang paling baru jika ada banyak
          
          let mName = entry.mentor_name || "";
          let mEmail = "";
          let mPhone = "";
          if (mName.includes(" | ")) {
            const parts = mName.split(" | ");
            mName = parts[0] || "";
            mEmail = parts[1] || "";
            mPhone = parts[2] || "";
          }

          // Sinkronkan form data dengan data yang sudah ada di database
          setFormData({
            full_name: entry.full_name || user.user_metadata?.full_name || "",
            school_name: entry.school_name || entry.school || "",
            nisn: entry.nisn || "",
            province: entry.province || "",
            competition_type: entry.competition_type || "Olimpiade MIPA",
            mentor_name: mName,
            mentor_email: mEmail,
            mentor_phone: mPhone,
            team_name: entry.team_name || "",
            participant2_name: entry.participant2_name || "",
            participant2_nisn: entry.participant2_nisn || ""
          });
        } else if (entryError) {
          console.error("Entry fetch error:", entryError);
        }
        
        const { data: portalData } = await supabase
          .from('announcements')
          .select('*')
          .eq('title', 'SYS_PORTAL_SETTINGS')
          .single();
        
        if (portalData && portalData.content) {
          try {
            const parsed = JSON.parse(portalData.content);
            if (parsed.waves) setPortalWaves(parsed.waves);
            if (parsed.paymentRequirementStage) setPaymentRequirementStage(parsed.paymentRequirementStage);
            if (parsed.isRegistrationOpen !== undefined) setIsRegistrationOpen(parsed.isRegistrationOpen);
            const userCategory = entry?.competition_type; 
            
            let matchingKeyPrefix = "";
            if (userCategory === "Olimpiade MIPA") matchingKeyPrefix = "mipa";
            else if (userCategory === "Speech Contest") matchingKeyPrefix = "speech";
            else if (userCategory === "LKTI Nasional") matchingKeyPrefix = "lkti";
            else if (userCategory === "MTQ" || userCategory === "MTQ Nasional") matchingKeyPrefix = "mtq";

            if (matchingKeyPrefix && parsed.submissionStatus) {
              const isGel1Open = parsed.submissionStatus.find((item: any) => item.id === `${matchingKeyPrefix}_g1`)?.isOpen;
              const isGel2Open = parsed.submissionStatus.find((item: any) => item.id === `${matchingKeyPrefix}_g2`)?.isOpen;
              setIsSubmissionOpen(!!(isGel1Open || isGel2Open));
            } else {
              setIsSubmissionOpen(true);
            }
          } catch (e) {
            setIsSubmissionOpen(true);
          }
        } else {
          setIsSubmissionOpen(true);
        }
        
        const userStatus = entry?.payment_status === 'Verified' ? 'Verified' : 'Pending';

        const { data: announcementsData } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false });

        // Filter client-side: hapus pengumuman sistem, dan filter berdasarkan target
        const filteredAnnouncements = (announcementsData || []).filter((item: any) => {
          // Hapus data sistem internal
          if (item.title === 'SYS_PORTAL_SETTINGS' || item.title === 'SYSTEM_TIMELINE_CONFIG') return false;
          
          // Jika target_audience kosong/null, tampilkan (broadcast LLMS lama)
          if (!item.target_audience) return true;
          
          // Jika target semua orang
          if (item.target_audience === 'All') return true;
          
          // Jika target berdasarkan status user (Verified/Pending)
          if (item.target_audience === userStatus) return true;
          
          // Jika target spesifik, cek apakah user.id ada di content JSON
          if (item.target_audience === 'specific') {
            try {
              const parsed = JSON.parse(item.content);
              return Array.isArray(parsed.target_user_ids) && parsed.target_user_ids.includes(user.id);
            } catch (e) {
              return false;
            }
          }
          return false;
        });
        setAnnouncements(filteredAnnouncements);
        
        // 3. Tarik Konfigurasi Jadwal Global (Bypass Cache)
        // 3. Tarik Konfigurasi Jadwal Global (Bypass Cache Total)
        const cacheBuster = Date.now();
        const { data: timelineConfig } = await supabase
          .from('announcements')
          .select('content')
          .eq('title', 'SYSTEM_TIMELINE_CONFIG')
          .not('created_at', 'is', null) // Trik bypass cache
          .limit(1)
          .single();
        
        if (timelineConfig && timelineConfig.content) {
          try {
            setGlobalTimeline(JSON.parse(timelineConfig.content));
          } catch (e) {
            console.error("Gagal parse timeline:", e);
          }
        }
        
      } catch (error) {
        console.error("Gagal menarik data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    // --- 📡 REAL-TIME SUBSCRIPTION ENGINE ---
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements'
        },
        (payload) => {
          const updated = (payload.new || payload.old) as any;
          if (updated.title === 'SYSTEM_TIMELINE_CONFIG') {
            try {
              setGlobalTimeline(JSON.parse(updated.content));
            } catch (e) {}
          }
          if (updated.title === 'SYS_PORTAL_SETTINGS') {
            try {
              const parsed = JSON.parse(updated.content);
              if (parsed.waves) setPortalWaves(parsed.waves);
              if (parsed.paymentRequirementStage) setPaymentRequirementStage(parsed.paymentRequirementStage);
              if (parsed.isRegistrationOpen !== undefined) setIsRegistrationOpen(parsed.isRegistrationOpen);
              // Update status pendaftaran secara real-time
              const userCategory = userEntry?.competition_type; 
              let matchingKeyPrefix = "";
              if (userCategory === "Olimpiade MIPA") matchingKeyPrefix = "mipa";
              else if (userCategory === "Speech Contest") matchingKeyPrefix = "speech";
              else if (userCategory === "LKTI Nasional") matchingKeyPrefix = "lkti";
              else if (userCategory === "MTQ" || userCategory === "MTQ Nasional") matchingKeyPrefix = "mtq";

              if (matchingKeyPrefix && parsed.submissionStatus) {
                const isGel1Open = parsed.submissionStatus.find((item: any) => item.id === `${matchingKeyPrefix}_g1`)?.isOpen;
                const isGel2Open = parsed.submissionStatus.find((item: any) => item.id === `${matchingKeyPrefix}_g2`)?.isOpen;
                setIsSubmissionOpen(!!(isGel1Open || isGel2Open));
              }
            } catch (e) {}
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userEntry]); // Re-subscribe if userEntry (category) changes

  const handleSubmitEntry = async (localFormData: any) => {
    setIsSubmitting(true);
    try {
      if (!currentUser) throw new Error("Sesi berakhir, silakan login kembali.");

      const isTeam = localFormData?.competition_type === "Olimpiade MIPA" || localFormData?.competition_type === "LKTI Nasional";

      const combinedMentor = [
        localFormData.mentor_name?.trim(),
        localFormData.mentor_email?.trim(),
        localFormData.mentor_phone?.trim()
      ].filter(Boolean).join(" | ");

      const { data: newEntries, error: dbError } = await supabase
        .from('competition_entries')
        .insert([{
          user_id: currentUser.id,
          full_name: currentUser?.user_metadata?.full_name || "Peserta",
          email: currentUser.email,
          school_name: localFormData.school_name,
          nisn: localFormData.nisn,
          province: localFormData.province,
          competition_type: localFormData.competition_type,
          mentor_name: combinedMentor,
          team_name: isTeam ? localFormData.team_name : null,
          participant2_name: isTeam ? localFormData.participant2_name : null,
          participant2_nisn: isTeam ? localFormData.participant2_nisn : null,
          payment_proof_url: null,
          payment_status: 'Unpaid'
        }])
        .select('*');

      if (dbError) throw dbError;

      showToast("Pendaftaran Berhasil! Silakan lengkapi pembayaran jika diperlukan.", "success");
      if (newEntries && newEntries.length > 0) {
        setUserEntry(newEntries[0]);
      } else {
        setUserEntry({ ...localFormData, payment_status: 'Unpaid', id: 'new-entry-temp' });
      }
      setTimeout(() => setShowForm(false), 1500); 

    } catch (error: any) {
      showToast(`Gagal Mengirim: ${error.message}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTeamEvent = formData?.competition_type === "Olimpiade MIPA" || formData?.competition_type === "LKTI Nasional";

  const calculateProgress = () => {
    let score = 0;
    if (currentUser) score += 20;

    if (userEntry) {
      if (userEntry.full_name) score += 4;
      if (userEntry.school_name || userEntry.school) score += 4;
      if (userEntry.phone && userEntry.phone !== '-') score += 4;
      if (userEntry.nisn && userEntry.nisn !== '-') score += 4;
      if (userEntry.province && userEntry.province !== '-') score += 4;
      
      let notesObj: any = {};
      if (userEntry.notes) try { notesObj = JSON.parse(userEntry.notes); } catch(e) {}
      if (notesObj.profile_photo_url) score += 20;
      if (notesObj.student_card_url) score += 20;
      if (userEntry.payment_status === 'Verified') score += 20;
    }
    return Math.min(score, 100);
  };

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6 md:p-12 relative overflow-hidden">
      <WelcomeOverlay userEntry={userEntry} currentUser={currentUser} />
      {/* 🚀 PERFORMANCE FIX: Remove heavy blur/filters that cause lag */}
      <div className="absolute top-[-5%] left-[-5%] w-64 h-64 bg-blue-400/10 rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-5%] right-[-2%] w-64 h-64 bg-indigo-400/10 rounded-full pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        
        <DashboardHeader userEntry={userEntry} currentUser={currentUser} handleLogout={handleLogout} progress={progress} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Kolom Kiri */}
          <StatusCards 
            userEntry={userEntry}
            setUserEntry={setUserEntry}
            currentUser={currentUser}
            isSubmissionOpen={isSubmissionOpen}
            setShowForm={setShowForm}
            setShowIdCard={setShowIdCard}
            showToast={showToast}
            progress={progress}
            paymentRequirementStage={paymentRequirementStage}
            isRegistrationOpen={isRegistrationOpen}
          />

          {/* Kolom Kanan */}
          <div className="lg:col-span-2">
            <AnnouncementBoard announcements={announcements} isLoading={isLoading} />
            <TimelineWidget 
              userCategory={userEntry?.competition_type} 
              userStatus={userEntry?.payment_status}
              notes={userEntry?.notes}
              globalTimeline={globalTimeline}
              portalWaves={portalWaves}
            />
            
            {/* KARTU AKSES PORTAL UJIAN LLMS (KHUSUS MIPA) */}
            {userEntry?.competition_type === 'Olimpiade MIPA' && userEntry?.payment_status === 'Verified' && (
              <div className="mt-6 bg-gradient-to-br from-[#5145cd] to-[#372b9c] rounded-[24px] p-6 text-white shadow-xl shadow-indigo-200/50 relative overflow-hidden group">
                {/* Aksen Latar Belakang */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-700"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full blur-xl transform -translate-x-8 translate-y-8"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-xl font-black tracking-tight">Portal Ujian CBT (LLMS)</h3>
                        <span className="px-2 py-0.5 bg-rose-500 text-[9px] font-black uppercase tracking-widest rounded animate-pulse shadow-sm">Live</span>
                      </div>
                      <p className="text-xs text-indigo-100 font-medium">Sistem ujian terkunci. Masuk menggunakan Username dan PIN Anda.</p>
                    </div>
                  </div>

                  <Link 
                    href="/ujian/login" 
                    className="w-full md:w-auto px-6 py-3.5 bg-white text-[#5145cd] text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center space-x-2"
                  >
                    <span>Masuk Ruang Ujian</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      <div className={`fixed top-8 right-8 z-[100] transition-all duration-500 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-white border border-white/60 shadow-2xl rounded-2xl p-4 flex items-center gap-3">
          {toast.type === 'success' ? (
            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><CheckCircle2 size={18} /></div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><AlertCircle size={18} /></div>
          )}
          <div>
            <p className="font-bold text-slate-800 text-sm">{toast.type === 'success' ? 'Berhasil' : 'Peringatan'}</p>
            <p className="text-xs text-slate-500 font-medium max-w-[250px]">{toast.message}</p>
          </div>
        </div>
      </div>

      {showForm && (
        <RegistrationModal 
          initialData={formData}
          isSubmitting={isSubmitting} 
          setShowForm={setShowForm} 
          onSubmit={handleSubmitEntry} 
        />
      )}

      {showIdCard && (
        <IdCardModal userEntry={userEntry} setShowIdCard={setShowIdCard} showToast={showToast} />
      )}
    </div>
  );
}
