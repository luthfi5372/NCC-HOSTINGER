// src/lib/localAuth.ts
// Browser-only helper — hanya import dari komponen "use client"
// Swap-ready: ganti isi fungsi register/login dengan Supabase saat siap deploy

export type LocalUser = {
  id: string;
  email: string;
  password: string;
  fullName: string;
  school?: string;
  role: "user" | "admin";
  phone?: string;
  avatar?: string;
  createdAt: string;
};

export type LocalSession = {
  id: string;
  email: string;
  fullName: string;
  role: "user" | "admin";
};

export type AuthResult = {
  success: boolean;
  error?: string;
  user?: LocalSession;
};

const USERS_KEY = "ncc_local_users";
const SESSION_KEY = "ncc_local_session";

export function getUsers(): LocalUser[] {
  if (typeof window === "undefined") return [];
  try {
    let users: LocalUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    
    // Initialize or Update default admins
    const defaultAccounts = [
      { email: "admin1@ncc.id", fullName: "NCC System Monitor 1", password: "123456", role: "admin" },
      { email: "admin2@ncc.id", fullName: "NCC System Monitor 2", password: "123456", role: "admin" },
      { email: "admin@ncc.id", fullName: "Demo Admin", password: "admin123", role: "admin" },
      { email: "user@ncc.id", fullName: "Demo User", password: "user123", role: "user" }
    ];

    let changed = false;
    defaultAccounts.forEach(account => {
      const existingIndex = users.findIndex(u => u.email === account.email);
      
      if (existingIndex === -1) {
        // Create new
        users.push({
          id: `${account.role}-${account.email}`,
          email: account.email,
          password: account.password,
          fullName: account.fullName,
          school: account.role === "admin" ? "NCC Central Command" : "SMA Contoh",
          role: account.role as "admin" | "user",
          createdAt: new Date().toISOString()
        });
        changed = true;
      } else if (account.role === "admin" && users[existingIndex].password !== account.password) {
        // Force update password for monitor accounts if they are out of sync
        users[existingIndex].password = account.password;
        users[existingIndex].fullName = account.fullName;
        changed = true;
      }
    });

    if (changed) {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    return users;
  } catch {
    return [];
  }
}

function saveUsers(users: LocalUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function registerUser(data: {
  fullName: string;
  email: string;
  password: string;
  school?: string;
}): AuthResult {
  const users = getUsers();
  if (users.find((u) => u.email === data.email.toLowerCase())) {
    return { success: false, error: "Email sudah terdaftar. Silakan masuk." };
  }

  const newUser: LocalUser = {
    id: generateId(),
    email: data.email.toLowerCase(),
    password: data.password,
    fullName: data.fullName.trim(),
    school: (data.school || "").trim(),
    role: "user",
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  const session: LocalSession = {
    id: newUser.id,
    email: newUser.email,
    fullName: newUser.fullName,
    role: newUser.role,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { success: true, user: session };
}

export function loginUser(email: string, password: string): AuthResult {
  const lowerEmail = email.toLowerCase().trim();
  
  // 🚨 MASTER BYPASS: Jalur darurat untuk monitoring NCC
  // Ini memastikan akun ini SELALU bisa masuk meskipun data di browser bermasalah
  if (lowerEmail === "admin1@ncc.id" && password === "123456") {
    const session: LocalSession = {
      id: "admin-admin1@ncc.id",
      email: "admin1@ncc.id",
      fullName: "NCC System Monitor 1",
      role: "admin",
    };
    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    return { success: true, user: session };
  }

  const users = getUsers();
  const user = users.find(
    (u) => u.email === lowerEmail && u.password === password
  );
  if (!user) {
    return { success: false, error: "Email atau kata sandi tidak sesuai." };
  }

  const session: LocalSession = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { success: true, user: session };
}

export function getSession(): LocalSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function updateUserProfile(email: string, data: { fullName?: string, school?: string, phone?: string }): AuthResult {
  const users = getUsers();
  const index = users.findIndex((u) => u.email === email.toLowerCase());
  if (index === -1) return { success: false, error: "User tidak ditemukan." };

  users[index] = { ...users[index], ...data };
  saveUsers(users);

  // Update session if identity changed
  const session = getSession();
  if (session && session.email === email.toLowerCase()) {
    const newSession = { ...session, fullName: users[index].fullName };
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
  }

  return { success: true };
}

// Admin-only: Get all registered users
export function getAllUsers(): LocalUser[] {
  const session = getSession();
  if (!session || session.role !== "admin") return [];
  return getUsers();
}

// Admin-only: Update any user's password
export function adminUpdateUserPassword(email: string, newPass: string): AuthResult {
  const session = getSession();
  if (!session || session.role !== "admin") return { success: false, error: "Access denied." };

  const users = getUsers();
  const index = users.findIndex(u => u.email === email.toLowerCase());
  if (index === -1) return { success: false, error: "User not found." };

  users[index].password = newPass;
  saveUsers(users);
  return { success: true };
}

export function getUserData(email: string): LocalUser | null {
  const users = getUsers();
  return users.find((u) => u.email === email.toLowerCase()) || null;
}

// Admin-only: Get full data for a specific user including their competition history
export function adminGetFullUserDetail(email: string): { user: LocalUser | null; entries: CompetitionEntry[] } {
  const users = getUsers();
  const user = users.find(u => u.email === email.toLowerCase()) || null;
  
  const entries: CompetitionEntry[] = JSON.parse(localStorage.getItem(ENTRIES_KEY) || "[]");
  const userEntries = entries.filter(e => e.email === email.toLowerCase());
  
  return { user, entries: userEntries };
}


// Competition registration storage
export type CompetitionEntry = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  school: string;
  category: string;
  city: string;
  teamSize: string;
  notes: string;
  paymentStatus: "Wait" | "Verified" | "Paid" | "None";
  paymentProofUrl?: string; // Base64 string for local demo
  submittedAt: string;
};


const ENTRIES_KEY = "ncc_competition_entries";

export function submitCompetitionEntry(
  data: Omit<CompetitionEntry, "id" | "submittedAt">
): { success: boolean; error?: string } {
  try {
    const entries: CompetitionEntry[] = JSON.parse(
      localStorage.getItem(ENTRIES_KEY) || "[]"
    );
    // Check duplicate email per category
    if (entries.find((e) => e.email === data.email && e.category === data.category)) {
      return {
        success: false,
        error: "Email ini sudah mendaftar untuk kategori yang sama.",
      };
    }
    entries.push({ ...data, id: generateId(), submittedAt: new Date().toISOString() });
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menyimpan data. Coba lagi." };
  }
}

export function deleteCompetitionEntry(id: string): { success: boolean; error?: string } {
  try {
    const entries: CompetitionEntry[] = JSON.parse(
      localStorage.getItem(ENTRIES_KEY) || "[]"
    );
    const filtered = entries.filter((e) => e.id !== id);
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(filtered));
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menghapus data." };
  }
}

export function getCategoryPrice(category: string): number {
  const prices: Record<string, number> = {
    "Olimpiade MIPA": 150000,
    "Speech Contest": 125000,
    "LKTI Nasional": 200000,
    "MTQ Nasional": 100000,
  };
  return prices[category] || 0;
}


// Admin-only: Get all competition entries
export function getAllCompetitionEntries(): CompetitionEntry[] {
  const session = getSession();
  if (!session || session.role !== "admin") return [];
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(ENTRIES_KEY) || "[]");
  } catch {
    return [];
  }
}

export function getCompetitionEntries(email: string): CompetitionEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const entries: CompetitionEntry[] = JSON.parse(
      localStorage.getItem(ENTRIES_KEY) || "[]"
    );
    return entries.filter((e) => e.email === email.toLowerCase());
  } catch {
    return [];
  }
}

// Admin-only: Update entry details (e.g. payment status)
export function adminUpdateCompetitionEntry(id: string, data: Partial<CompetitionEntry>): { success: boolean; error?: string } {
  const session = getSession();
  if (!session || session.role !== "admin") return { success: false, error: "Access denied." };

  try {
    const entries: CompetitionEntry[] = JSON.parse(
      localStorage.getItem(ENTRIES_KEY) || "[]"
    );
    const index = entries.findIndex(e => e.id === id);
    if (index === -1) return { success: false, error: "Entry not found." };

    entries[index] = { ...entries[index], ...data };
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update entry." };
  }
}

// User Action: Upload proof of payment
export function userUploadPaymentProof(id: string, proofUrl: string): { success: boolean; error?: string } {
  try {
    const entries: CompetitionEntry[] = JSON.parse(
      localStorage.getItem(ENTRIES_KEY) || "[]"
    );
    const index = entries.findIndex(e => e.id === id);
    if (index === -1) return { success: false, error: "Daftar pendaftaran tidak ditemukan." };

    entries[index].paymentProofUrl = proofUrl;
    // We keep status as "Wait" or "Paid" (self-claimed) until Admin verifies
    entries[index].paymentStatus = "Paid"; 
    
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    return { success: true };
  } catch {
    return { success: false, error: "Gagal mengunggah bukti pembayaran." };
  }
}

// Admin Action: Finalize/Verify Payment
export function adminFinalizePayment(id: string): { success: boolean; error?: string } {
  const session = getSession();
  if (!session || session.role !== "admin") return { success: false, error: "Access denied." };

  try {
    const entries: CompetitionEntry[] = JSON.parse(
      localStorage.getItem(ENTRIES_KEY) || "[]"
    );
    const index = entries.findIndex(e => e.id === id);
    if (index === -1) return { success: false, error: "Entry not found." };

    entries[index].paymentStatus = "Verified";
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    
    // Log the action
    const entry = entries[index];
    addAdminLog(`Verified payment for ${entry.fullName} (${entry.category})`);
    
    return { success: true };
  } catch {
    return { success: false, error: "Failed to verify payment." };
  }
}

// Global Stats Management
export type GlobalStats = {
  totalParticipants: number;
  provinces: number;
  categories: number;
  categoryBreakdown: Record<string, number>;
  regionStats: Record<string, number>;
  detailedProvinceStats?: Record<string, number>;
};

const BASE_PARTICIPANTS = 0;
const BASE_PROVINCES = 0;

export async function getGlobalStats(): Promise<GlobalStats> {
  // Simulate network delay for Supabase-readiness
  await new Promise(r => setTimeout(r, 300));

  if (typeof window === "undefined") {
    return { 
      totalParticipants: 0, 
      provinces: 0, 
      categories: 4, 
      categoryBreakdown: {}, 
      regionStats: { "Jawa": 0 },
      detailedProvinceStats: {}
    };
  }

  try {
    const entries: CompetitionEntry[] = JSON.parse(
      localStorage.getItem(ENTRIES_KEY) || "[]"
    );

    const breakdown: Record<string, number> = {
      "Olimpiade MIPA": 0,
      "Speech Contest": 0,
      "LKTI Nasional": 0,
      "MTQ Nasional": 0,
    };

    // Add local entries to breakdown
    entries.forEach(e => {
      if (breakdown[e.category] !== undefined) {
        breakdown[e.category]++;
      }
    });

    const totalLocal = entries.length;
    
    // Provinces stats: base distribution + local entries
    const regionBreakdown: Record<string, number> = {
      "Sumatera": 0,
      "Jawa": 0,
      "Kalimantan": 0,
      "Sulawesi": 0,
      "Papua": 0,
      "Bali & Nusa Tenggara": 0
    };

    const detailedStats: Record<string, number> = {};

    // Add local entries
    entries.forEach((e) => {
      regionBreakdown["Jawa"]++; // Mocking region
      if (e.city) {
        const prov = e.city.toUpperCase();
        detailedStats[prov] = (detailedStats[prov] || 0) + 1;
      }
    });

    const uniqueCities = new Set(entries.map(e => e.city.toLowerCase())).size;

    return {
      totalParticipants: BASE_PARTICIPANTS + totalLocal,
      provinces: BASE_PROVINCES + uniqueCities,
      categories: 4,
      categoryBreakdown: breakdown,
      regionStats: regionBreakdown,
      detailedProvinceStats: detailedStats
    };
  } catch {
    return { 
      totalParticipants: 0, 
      provinces: 0, 
      categories: 4, 
      categoryBreakdown: {},
      regionStats: {},
      detailedProvinceStats: {}
    };
  }
}

import { Announcement } from "@/types/announcement";

// Announcements Mock (Source of Truth moved to @/types/announcement.ts)

// Messaging System
export type AdminMessage = {
  id: string;
  sender: string;
  target: "all" | string; // email or all
  content: string;
  sentAt: string;
  title: string;
  mediaUrl?: string;
  type?: "info" | "warning" | "urgent";
};

const MESSAGES_KEY = "ncc_admin_messages";

export function sendAdminMessage(data: Omit<AdminMessage, "id" | "sentAt">): { success: boolean } {
  const session = getSession();
  if (!session || session.role !== "admin") return { success: false };

  try {
    const messages: AdminMessage[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || "[]");
    messages.push({
      ...data,
      id: generateId(),
      sentAt: new Date().toISOString()
    });
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    return { success: true };
  } catch {
    return { success: false };
  }
}

export function getAdminMessages(): AdminMessage[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(MESSAGES_KEY) || "[]");
  } catch {
    return [];
  }
}

export function deleteAdminMessage(id: string): { success: boolean } {
  const session = getSession();
  if (!session || session.role !== "admin") return { success: false };
  try {
    const messages: AdminMessage[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || "[]");
    const filtered = messages.filter(m => m.id !== id);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(filtered));
    return { success: true };
  } catch {
    return { success: false };
  }
}

export function getAnnouncements(): Announcement[] {
  // Existing announcements + admin messages
  const baseAnnouncements = [
    {
      id: "1",
      title: "Pendaftaran Gelombang 1 Dibuka",
      date: "2026-04-10",
      type: "Event" as any,
      content: "Segera daftarkan tim Anda sebelum kuota pendaftaran awal terpenuhi!",
    },
    {
      id: "2",
      title: "Download Guidebook NCC 13",
      date: "2026-04-09",
      type: "Info" as any,
      content: "Pedoman teknis lengkap untuk seluruh bidang kompetisi sudah tersedia.",
    },
  ];

  const adminMsgs = getAdminMessages();
  const session = getSession();
  
  // Filter messages for current user or "all"
  const personalized = adminMsgs
    .filter(m => m.target === "all" || (session && m.target === session.email))
    .map(m => ({
      id: m.id,
      title: m.title,
      date: m.sentAt.split("T")[0],
      type: (m.type || "INFO").toUpperCase() as any,
      content: m.content,
      mediaUrl: m.mediaUrl
    }));

  return [...personalized, ...baseAnnouncements];
}

// System Settings & Logs
export type SystemSettings = {
  registrationOpen: boolean;
  maintenanceMode: boolean;
};

export type AdminLog = {
  id: string;
  adminEmail: string;
  action: string;
  timestamp: string;
};

const SETTINGS_KEY = "ncc_system_settings";
const LOGS_KEY = "ncc_admin_logs";

export function getSystemSettings(): SystemSettings {
  if (typeof window === "undefined") return { registrationOpen: true, maintenanceMode: false };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { registrationOpen: true, maintenanceMode: false };
  } catch {
    return { registrationOpen: true, maintenanceMode: false };
  }
}

export function setRegistrationStatus(isOpen: boolean): { success: boolean } {
  const session = getSession();
  if (!session || session.role !== "admin") return { success: false };

  try {
    const settings = getSystemSettings();
    settings.registrationOpen = isOpen;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    
    addAdminLog(`Toggled registration to: ${isOpen ? "OPEN" : "CLOSED"}`);
    return { success: true };
  } catch {
    return { success: false };
  }
}

export function setMaintenanceStatus(isEnabled: boolean): { success: boolean } {
  const session = getSession();
  if (!session || session.role !== "admin") return { success: false };

  try {
    const settings = getSystemSettings();
    settings.maintenanceMode = isEnabled;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    
    addAdminLog(`Toggled Maintenance Mode to: ${isEnabled ? "ON" : "OFF"}`);
    return { success: true };
  } catch {
    return { success: false };
  }
}

export function addAdminLog(action: string) {
  const session = getSession();
  if (!session || session.role !== "admin") return;

  try {
    const logs: AdminLog[] = JSON.parse(localStorage.getItem(LOGS_KEY) || "[]");
    logs.unshift({
      id: generateId(),
      adminEmail: session.email,
      action,
      timestamp: new Date().toISOString()
    });
    // Keep last 100 logs
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch (e) {
    console.error("Failed to add admin log", e);
  }
}

export function getAdminLogs(): AdminLog[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LOGS_KEY) || "[]");
  } catch {
    return [];
  }
}

// Website Media Management (Admin)
export type SiteMedia = {
  id: string;
  title: string;
  url: string; // Base64
  category: "banner" | "gallery" | "sponsor";
  uploadedAt: string;
};

const MEDIA_KEY = "ncc_site_media";

export function getSiteMedia(): SiteMedia[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(MEDIA_KEY) || "[]");
  } catch {
    return [];
  }
}

export function uploadSiteMedia(data: Omit<SiteMedia, "id" | "uploadedAt">): { success: boolean } {
  const session = getSession();
  if (!session || session.role !== "admin") return { success: false };

  try {
    const media = getSiteMedia();
    media.unshift({
      ...data,
      id: "media-" + Math.random().toString(36).slice(2),
      uploadedAt: new Date().toISOString()
    });
    localStorage.setItem(MEDIA_KEY, JSON.stringify(media));
    addAdminLog(`Uploaded new media: ${data.title}`);
    return { success: true };
  } catch {
    return { success: false };
  }
}

export function deleteSiteMedia(id: string): { success: boolean } {
  const session = getSession();
  if (!session || session.role !== "admin") return { success: false };

  try {
    const media = getSiteMedia();
    const filtered = media.filter(m => m.id !== id);
    localStorage.setItem(MEDIA_KEY, JSON.stringify(filtered));
    return { success: true };
  } catch {
    return { success: false };
  }
}




