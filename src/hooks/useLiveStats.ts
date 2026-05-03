import { useState, useEffect, useCallback } from "react";

const PROVINCE_TO_REGION: Record<string, string> = {
  "DI. ACEH": "Sumatera", "SUMATERA UTARA": "Sumatera", "SUMATERA BARAT": "Sumatera", "RIAU": "Sumatera", "JAMBI": "Sumatera", "SUMATERA SELATAN": "Sumatera", "BENGKULU": "Sumatera", "LAMPUNG": "Sumatera", "BANGKA BELITUNG": "Sumatera", "KEPULAUAN RIAU": "Sumatera",
  "DKI JAKARTA": "Jawa", "JAWA BARAT": "Jawa", "JAWA TENGAH": "Jawa", "DAERAH ISTIMEWA YOGYAKARTA": "Jawa", "JAWA TIMUR": "Jawa", "PROBANTEN": "Jawa",
  "BALI": "Bali & Nusa Tenggara", "NUSATENGGARA BARAT": "Bali & Nusa Tenggara", "NUSA TENGGARA TIMUR": "Bali & Nusa Tenggara",
  "KALIMANTAN BARAT": "Kalimantan", "KALIMANTAN TENGAH": "Kalimantan", "KALIMANTAN SELATAN": "Kalimantan", "KALIMANTAN TIMUR": "Kalimantan", "KALIMANTAN UTARA": "Kalimantan",
  "SULAWESI UTARA": "Sulawesi", "SULAWESI TENGAH": "Sulawesi", "SULAWESI SELATAN": "Sulawesi", "SULAWESI TENGGARA": "Sulawesi", "GORONTALO": "Sulawesi", "SULAWESI BARAT": "Sulawesi",
  "MALUKU": "Papua", "MALUKU UTARA": "Papua", "IRIAN JAYA BARAT": "Papua", "IRIAN JAYA TENGAH": "Papua", "IRIAN JAYA TIMUR": "Papua"
};

export interface GlobalStats {
  totalParticipants: number;
  provinces: number;
  categories: number;
  categoryBreakdown: Record<string, number>;
  regionStats: Record<string, number>;
  detailedProvinceStats: Record<string, number>;
}

const defaultStats: GlobalStats = {
  totalParticipants: 0,
  provinces: 0,
  categories: 4,
  categoryBreakdown: { "Olimpiade MIPA": 0, "Speech Contest": 0, "LKTI Nasional": 0, "MTQ Nasional": 0 },
  regionStats: { "Sumatera": 0, "Jawa": 0, "Kalimantan": 0, "Sulawesi": 0, "Papua": 0, "Bali & Nusa Tenggara": 0 },
  detailedProvinceStats: {}
};

export function useLiveStats() {
  const [stats, setStats] = useState<GlobalStats>(defaultStats);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (typeof window === "undefined") return;
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      
      // 1. Fetch from Supabase (Only verified participants)
      const { data: supabaseEntries, error } = await supabase
        .from("competition_entries")
        .select("category, city, province, payment_status");

      if (error) console.warn("Supabase stats fetch error:", error);

      // 3. Use only verified database entries for accurate stats
      const allEntries = (supabaseEntries || []).filter(e => e.payment_status === 'Verified');

      const breakdown = { "Olimpiade MIPA": 0, "Speech Contest": 0, "LKTI Nasional": 0, "MTQ Nasional": 0 };
      const regionStats = { "Sumatera": 0, "Jawa": 0, "Kalimantan": 0, "Sulawesi": 0, "Papua": 0, "Bali & Nusa Tenggara": 0 };
      const detailedStats: Record<string, number> = {};
      const activeProvinces = new Set<string>();

      allEntries.forEach(entry => {
        if ((breakdown as any)[entry.category] !== undefined) (breakdown as any)[entry.category]++;
        
        // Normalisasi Nama Provinsi agar sinkron dengan ID Map
        let prov = (entry.province || entry.city)?.toUpperCase()?.trim();
        
        if (prov) {
          // Fallback mapping untuk variasi nama
          if (prov === "DAERAH ISTIMEWA YOGYAKARTA") prov = "DI YOGYAKARTA";
          if (prov === "KEPULAUAN BANGKA BELITUNG") prov = "BANGKA BELITUNG";
          if (prov === "PROVINSI BANTEN") prov = "PROBANTEN";
          if (prov === "BANTEN") prov = "PROBANTEN";
          
          activeProvinces.add(prov);
          detailedStats[prov] = (detailedStats[prov] || 0) + 1;
          const region = PROVINCE_TO_REGION[prov] || "Jawa";
          if ((regionStats as any)[region] !== undefined) (regionStats as any)[region]++;
        }
      });


      setStats({
        totalParticipants: allEntries.length || 0,
        provinces: activeProvinces.size,
        categories: 4,
        categoryBreakdown: breakdown,
        regionStats,
        detailedProvinceStats: detailedStats
      });
    } catch (err) {
      console.error("useLiveStats error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    fetchStats();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "ncc_competition_entries") fetchStats();
    };
    window.addEventListener("storage", handleStorage);

    let cleanup: (() => void) | undefined;
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      const channel = supabase
        .channel("ncc_stats_channel")
        .on("postgres_changes", { event: "*", schema: "public", table: "competition_entries" }, fetchStats)
        .subscribe();
      cleanup = () => { supabase.removeChannel(channel); };
    }).catch(() => {});

    return () => {
      window.removeEventListener("storage", handleStorage);
      cleanup?.();
    };
  }, [fetchStats]);

  return { stats, loading, refresh: fetchStats };
}
