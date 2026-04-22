"use client";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  trend?: {
    value: string;
    isUp: boolean;
  };
  isLoading?: boolean;
}

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend, 
  isLoading 
}: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('-600', '-50')} ${color} transition-colors group-hover:scale-110 duration-300`}>
          <Icon size={24} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${trend.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
            {trend.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend.value}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</h3>
        <p className={`text-3xl font-black text-slate-800 tracking-tight`}>
          {isLoading ? (
            <span className="inline-block w-24 h-8 bg-slate-100 animate-pulse rounded-lg"></span>
          ) : (
            value.toLocaleString()
          )}
        </p>
      </div>
    </div>
  );
}
