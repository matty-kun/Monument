'use client';

import BouncingBallsLoader from "@/components/BouncingBallsLoader";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Settings, LogOut, Medal, Flag, CalendarDays, Building2, Tags, MapPin, Users } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { useTournament } from "@/components/AdminTournamentProvider";
import EmptyTournamentState from "@/components/EmptyTournamentState";
import { useDashboardViewModel } from "@/features/admin/dashboard/viewModels/useDashboardViewModel";

export default function AdminDashboardPage() {
  const { selectedTournament } = useTournament();
  
  const {
    role,
    loading,
    mounted,
    loadingCard,
    recentSchedules,
    standings,
    recentResults,
    teamsData,
    stats,
    handleCardClick,
    handleLogout
  } = useDashboardViewModel({ selectedTournament });

  if (loading) return <div className="flex justify-center items-center h-[60vh]"><BouncingBallsLoader /></div>;
  if (!selectedTournament) return <EmptyTournamentState />;

  const StatCard = ({ label, value, icon, color }: { label: string, value: number, icon: any, color: string }) => {
    const Icon = icon;
    return (
      <div className="bg-[#1c1c1e] p-6 rounded-[24px] shadow-lg border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-all">
        <div>
          <p className="text-[12px] font-semibold tracking-wide text-white/50 mb-1">{label}</p>
          <p className="text-3xl font-bold text-white leading-none">{value}</p>
        </div>
        <div className={`p-4 rounded-xl ${color} text-white group-hover:scale-110 transition-transform shadow-lg shadow-black/20`}>
           <Icon size={24} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-fadeIn max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-[32px] font-black text-white tracking-tight leading-none mb-2">
            Dashboard
          </h1>
          <p className="text-[15px] text-white/50 font-semibold tracking-wide">
            {selectedTournament?.name || "Management Control"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleLogout} className="flex items-center gap-2 bg-[#1c1c1e] text-red-500 border border-red-500/20 px-5 py-3 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm group" title="Logout">
            <span className="text-[12px] font-bold tracking-wide">Logout</span>
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Teams" value={stats.teams} icon={Building2} color="bg-[#0A84FF]" />
        <StatCard label="Active Events" value={stats.events} icon={Flag} color="bg-[#30D158]" />
        <StatCard label="Medals Awarded" value={stats.results} icon={Medal} color="bg-[#FF9F0A]" />
        <StatCard label="Categories" value={stats.categories} icon={Tags} color="bg-[#FF375F]" />
      </div>

      {/* Main Actions (The Grid) */}
      <div>
        <div className="mb-6 flex items-center justify-between">
           <h2 className="text-[14px] font-bold tracking-widest text-white/40 uppercase">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div onClick={() => handleCardClick("/admin/results")} className="bg-[#1c1c1e] p-8 rounded-[24px] border border-white/5 hover:bg-white/5 shadow-sm transition-all cursor-pointer group flex flex-col items-center text-center">
               <div className="w-16 h-16 bg-[#FF9F0A]/20 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Medal size={32} className="text-[#FF9F0A]" />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Add Results</h3>
               <p className="text-[14px] text-white/50 font-medium">Record medal winners and points</p>
            </div>

            <div onClick={() => handleCardClick("/admin/schedule")} className="bg-[#1c1c1e] p-8 rounded-[24px] border border-white/5 hover:bg-white/5 shadow-sm transition-all cursor-pointer group flex flex-col items-center text-center">
               <div className="w-16 h-16 bg-[#30D158]/20 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <CalendarDays size={32} className="text-[#30D158]" />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Schedule</h3>
               <p className="text-[14px] text-white/50 font-medium">Manage event dates and venues</p>
            </div>

            <div onClick={() => handleCardClick("/admin/events")} className="bg-[#1c1c1e] p-8 rounded-[24px] border border-white/5 hover:bg-white/5 shadow-sm transition-all cursor-pointer group flex flex-col items-center text-center">
               <div className="w-16 h-16 bg-[#0A84FF]/20 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Flag size={32} className="text-[#0A84FF]" />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Manage Events</h3>
               <p className="text-[14px] text-white/50 font-medium">Edit event details and info</p>
            </div>
        </div>
      </div>

      {/* Dashboard Data Views */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Schedules */}
        <div className="bg-[#1c1c1e] p-6 rounded-[24px] border border-white/5 shadow-sm flex flex-col h-full">
           <h2 className="text-[14px] font-bold tracking-widest text-white/40 uppercase mb-6">Upcoming & Live</h2>
           <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-96">
              {recentSchedules.length > 0 ? recentSchedules.map((s: any) => (
                <div key={s.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                   <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{s.events?.icon || '🏅'}</span>
                        <h4 className="text-[15px] font-bold text-white">{s.events?.name || 'Unknown Event'}</h4>
                      </div>
                      <span className="text-[10px] font-bold tracking-wider text-[#0A84FF] uppercase bg-[#0A84FF]/20 px-2 py-1 rounded-lg">{s.date}</span>
                   </div>
                   <div className="text-[12px] font-semibold text-white/50 tracking-wide mb-2">
                     {formatTime(s.start_time)} - {formatTime(s.end_time)} | {s.venues?.name || 'TBA'}
                   </div>
                   <div className="flex gap-1 text-[11px] font-bold text-white/40 uppercase tracking-wider">
                     {s.departments?.join(' VS ')}
                   </div>
                </div>
              )) : (
                 <div className="text-[14px] text-white/40 text-center py-10 font-semibold">No upcoming schedules</div>
              )}
           </div>
        </div>

        {/* Current Standings */}
        <div className="bg-[#1c1c1e] p-6 rounded-[24px] border border-white/5 shadow-sm flex flex-col h-full">
           <h2 className="text-[14px] font-bold tracking-widest text-white/40 uppercase mb-6">Top Standings</h2>
           <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar max-h-96">
              {standings.length > 0 ? standings.map((team: any, index: number) => (
                <div key={team.id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                   <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[14px] shadow-sm ${index === 0 ? 'bg-[#FFD700] text-black' : index === 1 ? 'bg-[#C0C0C0] text-black' : index === 2 ? 'bg-[#CD7F32] text-white' : 'bg-white/10 text-white/60'}`}>
                         {index + 1}
                      </div>
                      {team.imageUrl ? (
                        <img src={team.imageUrl} className="w-8 h-8 object-contain drop-shadow-sm" alt={team.name} />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">{team.name.slice(0,2)}</div>
                      )}
                      <span className="text-[15px] font-bold text-white tracking-wide">{team.name}</span>
                   </div>
                   <div className="text-[16px] font-black text-[#0A84FF]">{team.points} <span className="text-[10px] text-white/40 font-bold tracking-widest">PTS</span></div>
                </div>
              )) : (
                 <div className="text-[14px] text-white/40 text-center py-10 font-semibold">No rankings available</div>
              )}
           </div>
        </div>

        {/* Recent Results */}
        <div className="bg-[#1c1c1e] p-6 rounded-[24px] border border-white/5 shadow-sm flex flex-col h-full">
           <h2 className="text-[14px] font-bold tracking-widest text-white/40 uppercase mb-6">Recent Results</h2>
           <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-96">
              {recentResults.length > 0 ? recentResults.map((r: any) => {
                const isGold = r.medal_type === 'gold';
                const isSilver = r.medal_type === 'silver';
                const teamName = teamsData.find((t: any) => t.department_id === r.department_id)?.name || 'Unknown';
                return (
                  <div key={r.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg text-2xl ${isGold ? 'bg-[#FFD700]' : isSilver ? 'bg-[#C0C0C0]' : 'bg-[#CD7F32]'}`}>
                        {isGold ? '🥇' : isSilver ? '🥈' : '🥉'}
                     </div>
                     <div className="flex-1">
                        <h4 className="text-[15px] font-bold text-white">{r.events?.name || 'Unknown Event'}</h4>
                        <p className="text-[12px] font-semibold text-white/50 tracking-wide mt-1">Won By {teamName}</p>
                     </div>
                  </div>
                )
              }) : (
                 <div className="text-[14px] text-white/40 text-center py-10 font-semibold">No results posted yet</div>
              )}
           </div>
        </div>
      </div>

    </div>
  );
}
