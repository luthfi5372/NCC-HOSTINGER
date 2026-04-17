import { useState, useEffect, useCallback } from "react";
import { getGlobalStats, GlobalStats } from "@/lib/localAuth";
import { createClient } from "@/lib/supabase/client";

// Mapping helper for regions (matching IndonesiaMap.tsx and GeoJSON names)
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
  detailedProvinceStats: Record<string, number>; // New field for map
}

export function useLiveStats() {
  const [stats, setStats] = useState<GlobalStats>({
    totalParticipants: 0,
    provinces: 0,
    categories: 4,
    categoryBreakdown: {
      "Olimpiade MIPA": 0,
      "Speech Contest": 0,
      "LKTI Nasional": 0,
      "MTQ Nasional": 0,
    },
    regionStats: {
      "Sumatera": 0,
      "Jawa": 0,
      "Kalimantan": 0,
      "Sulawesi": 0,
      "Papua": 0,
      "Bali & Nusa Tenggara": 0
    },
    detailedProvinceStats: {} // Initialize empty
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const supabase = createClient();
    // 1. Fetch real data from Supabase
    const { data: entries, error } = await supabase
      .from('competition_entries')
      .select('category, city');

    if (error) {
      console.error("Error fetching live stats:", error);
      // Fallback
      setLoading(false);
      return;
    }

    // 2. Process data
    const breakdown: Record<string, number> = {
      "Olimpiade MIPA": 0,
      "Speech Contest": 0,
      "LKTI Nasional": 0,
      "MTQ Nasional": 0,
    };

    const regionStats: Record<string, number> = {
      "Sumatera": 0,
      "Jawa": 0,
      "Kalimantan": 0,
      "Sulawesi": 0,
      "Papua": 0,
      "Bali & Nusa Tenggara": 0
    };

    const detailedStats: Record<string, number> = {};
    const activeProvinces = new Set<string>();

    entries?.forEach(entry => {
      // Category Breakdown
      if (breakdown[entry.category] !== undefined) {
        breakdown[entry.category]++;
      }

      // Region & Province Stats
      const provName = entry.city?.toUpperCase();
      if (provName) {
        activeProvinces.add(provName);
        
        // Count per province (Exact name for map)
        detailedStats[provName] = (detailedStats[provName] || 0) + 1;

        // Count per region (Grouped)
        const region = PROVINCE_TO_REGION[provName] || "Jawa";
        if (regionStats[region] !== undefined) {
          regionStats[region]++;
        }
      }
    });

    setStats({
      totalParticipants: entries?.length || 0,
      provinces: activeProvinces.size,
      categories: 4,
      categoryBreakdown: breakdown,
      regionStats: regionStats,
      detailedProvinceStats: detailedStats
    });
    
    setLoading(false);
  }, []); // Stable fetchStats

  useEffect(() => {
    fetchStats();

    const supabase = createClient();
    // 3. Real-time Subscription
    // Use a random ID to avoid name collisions if useEffect runs twice (e.g. Strict Mode)
    const channelId = `stats_${Math.random().toString(36).slice(2)}`;
    
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'competition_entries' 
      }, () => {
        // Debounce or just call fetchStats
        fetchStats();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time stats updates');
        }
      });

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "ncc_competition_entries") {
        fetchStats();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      // Ensure we remove the specific channel
      supabase.removeChannel(channel);
    };
  }, [fetchStats]); // fetchStats is stable due to useCallback

  return { stats, loading, refresh: fetchStats };
}
