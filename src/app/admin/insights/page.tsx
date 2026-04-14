"use client";

import { useEffect, useState } from "react";
import { 
  BarChart3, 
  Map as MapIcon, 
  School, 
  Target, 
  ArrowUpRight,
  ChevronRight,
  Plus
} from "lucide-react";
import { motion } from "framer-motion";
import { getAllCompetitionEntries } from "@/lib/localAuth";

export default function AdminInsights() {
  const [entries, setEntries] = useState<any[]>([]);
  const [cityStats, setCityStats] = useState<any[]>([]);
  const [schoolStats, setSchoolStats] = useState<any[]>([]);

  useEffect(() => {
    const data = getAllCompetitionEntries();
    setEntries(data);

    // Process City Stats
    const cities: Record<string, number> = {};
    const schools: Record<string, number> = {};
    
    data.forEach(e => {
      cities[e.city] = (cities[e.city] || 0) + 1;
      schools[e.school] = (schools[e.school] || 0) + 1;
    });

    setCityStats(Object.entries(cities).sort((a, b) => b[1] - a[1]).slice(0, 10));
    setSchoolStats(Object.entries(schools).sort((a, b) => b[1] - a[1]).slice(0, 10));
  }, []);

  if (!entries) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-inter text-white">
      {/* Vercel-style Breadcrumbs & Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium">
          <span className="hover:text-white cursor-pointer transition-colors">national-creativity-competition</span>
          <span className="text-white/20">/</span>
          <span className="text-white px-2 py-0.5 bg-white/10 rounded-md">regional-intelligence-delta</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Geographic Intelligence</h1>
            <p className="text-slate-500 text-[13px] font-medium mt-1">Deep-priority analysis of participation density across national clusters.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Top Cities (Vercel Progress Style) */}
        <div className="lg:col-span-1 bg-[#000] border border-white/10 rounded-xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
                    <BarChart3 size={18} />
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight italic">Top Clusters</h3>
            </div>
            
            <div className="space-y-8">
                {cityStats.map(([city, count]) => (
                    <div key={city} className="group">
                        <div className="flex justify-between items-end mb-3">
                            <span className="text-[13px] font-bold text-slate-400 group-hover:text-white transition-colors">{city}</span>
                            <span className="text-[11px] font-bold text-indigo-400 font-mono">[{count}]</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(count / entries.length) * 100 || 0}%` }}
                                className="h-full bg-white group-hover:bg-indigo-500 transition-colors"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Top Schools (Vercel Grid Style) */}
        <div className="lg:col-span-2 bg-[#000] border border-white/10 rounded-xl p-8 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
                        <School size={18} />
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight italic">Key Institutions</h3>
                </div>
                <button className="text-[11px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-md border border-white/10">
                    Full Registry <ChevronRight size={14} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                {schoolStats.map(([school, count], idx) => (
                    <div key={school} className="p-5 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between hover:border-white/20 hover:bg-white/[0.07] transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="text-[10px] font-bold text-slate-700 group-hover:text-indigo-500 transition-colors">0{idx + 1}</div>
                            <div>
                                <div className="text-[13px] font-bold text-white truncate max-w-[180px]">{school}</div>
                                <div className="text-[11px] font-medium text-slate-500 mt-0.5">{count} provisioned nodes</div>
                            </div>
                        </div>
                        <div className="w-7 h-7 rounded-md bg-[#000] border border-white/10 flex items-center justify-center text-emerald-500 group-hover:border-emerald-500/30 transition-all">
                            <ArrowUpRight size={14} />
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Exclusive "Owner" Metrics Card */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 bg-[#000] border border-white/10 rounded-xl group overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
                <Target className="text-indigo-400 mb-6" size={24} />
                <div>
                    <h4 className="text-[15px] font-bold text-white mb-2 tracking-tight">Conversion Velocity</h4>
                    <p className="text-slate-500 text-[12px] font-medium leading-relaxed">
                      92% of provisioned identities complete the submission protocol. This represents a 15% delta from previous year.
                    </p>
                </div>
            </div>
            
            <div className="p-8 bg-[#000] border border-white/10 rounded-xl group overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
                <MapIcon className="text-slate-500 mb-6 group-hover:text-white transition-colors" size={24} />
                <div>
                    <h4 className="text-[15px] font-bold text-white mb-2 tracking-tight">Regional Dominance</h4>
                    <p className="text-slate-500 text-[12px] font-medium leading-relaxed">
                      Cluster [Jawa Tengah] maintains primary density authority with 40% of total system registrations.
                    </p>
                </div>
            </div>

            <div className="p-8 bg-[#000] border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-center group hover:border-white/30 transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-white transition-all mb-4 border border-white/10">
                    <Plus size={20} />
                </div>
                <h4 className="text-[13px] font-bold text-white">Extend Intelligence</h4>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">Configure Delta Widgets</p>
            </div>
        </div>

      </div>
    </div>
    </div>
  );
}
