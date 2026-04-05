'use client';

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import BouncingBallsLoader from "@/components/BouncingBallsLoader";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Settings, LogOut, Medal, Flag, CalendarDays, Building2, Tags, MapPin, Users } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [loadingCard, setLoadingCard] = useState("");
  const [recentSchedules, setRecentSchedules] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [stats, setStats] = useState({
    teams: 0,
    events: 0,
    results: 0,
    categories: 0
  });

  useEffect(() => {
    setMounted(true);
    async function fetchDashboardData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/admin/login");
        return;
      }

      // Fetch Profile/Role
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      setRole(profile?.role || "user");

      // Fetch Stats and Data for Views
      const [teamsRes, eventsRes, resultsRes, categoriesRes, schedulesData, recentResData] = await Promise.all([
        supabase.from("departments").select("id, name, image_url"),
        supabase.from("events").select("id", { count: 'exact', head: true }),
        supabase.from("results").select("medal_type, departments(id, name, image_url), events(name)"),
        supabase.from("categories").select("id", { count: 'exact', head: true }),
        supabase.from("schedules").select("id, start_time, end_time, date, departments, events(icon, name), venues(name)").order("date", { ascending: true }),
        supabase.from("results").select("id, medal_type, departments(name), events(name)").order("created_at", { ascending: false }).limit(5)
      ]);

      const teamsData = teamsRes.data || [];
      const allResultsData = resultsRes.data || [];

      // Calculate Standings
      const teamScores = new Map();
      teamsData.forEach((t: any) => teamScores.set(t.id, { id: t.id, name: t.name, imageUrl: t.image_url, points: 0 }));

      allResultsData.forEach((r: any) => {
        const dept = Array.isArray(r.departments) ? r.departments[0] : r.departments;
        if (dept) {
          const existing = teamScores.get(dept.id);
          if (existing) {
            if (r.medal_type === 'gold') existing.points += 200;
            if (r.medal_type === 'silver') existing.points += 150;
            if (r.medal_type === 'bronze') existing.points += 100;
          }
        }
      });
      
      const sortedStandings = Array.from(teamScores.values())
        .sort((a,b) => b.points - a.points)
        .slice(0, 5); // top 5
      
      setStandings(sortedStandings);
      setRecentResults(recentResData.data || []);
      
      const upcoming = (schedulesData.data || []).filter((s:any) => {
         const endDateTime = new Date(`${s.date}T${s.end_time || '23:59'}`);
         return endDateTime >= new Date();
      }).slice(0, 5);
      setRecentSchedules(upcoming);

      setStats({
        teams: teamsData.length,
        events: eventsRes.count || 0,
        results: allResultsData.length,
        categories: categoriesRes.count || 0
      });

      setLoading(false);
    }
    fetchDashboardData();
    document.title = "Dashboard | CITE FEST 2026 Management";
  }, [router, supabase]);

  const handleCardClick = (href: string) => {
    setLoadingCard(href);
    router.push(href);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) router.push("/");
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><BouncingBallsLoader /></div>;

  const StatCard = ({ label, value, icon, color }: { label: string, value: number, icon: any, color: string }) => {
    const Icon = icon;
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between group hover:shadow-md transition-all">
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-black text-gray-800 dark:text-white leading-none">{value}</p>
        </div>
        <div className={`p-4 rounded-xl ${color} text-white group-hover:scale-110 transition-transform`}>
           <Icon size={24} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-monument-primary uppercase tracking-tight leading-none mb-2">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 font-medium tracking-wide">
            CITE FEST 2026 Management Control
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ThemeSwitcher mounted={mounted} />
          <button onClick={handleLogout} className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 px-5 py-3 rounded-2xl hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-all shadow-sm group" title="Logout">
            <span className="text-[10px] font-black tracking-widest uppercase">Logout</span>
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Teams" value={stats.teams} icon={Building2} color="bg-indigo-500" />
        <StatCard label="Active Events" value={stats.events} icon={Flag} color="bg-blue-500" />
        <StatCard label="Medals Awarded" value={stats.results} icon={Medal} color="bg-yellow-500" />
        <StatCard label="Categories" value={stats.categories} icon={Tags} color="bg-pink-500" />
      </div>

      {/* Main Actions (The Grid) */}
      <div>
        <div className="mb-6 flex items-center justify-between">
           <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div onClick={() => handleCardClick("/admin/results")} className="bg-white dark:bg-gray-800 p-8 rounded-3xl border-2 border-transparent hover:border-monument-primary shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col items-center text-center">
               <div className="w-16 h-16 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Medal size={32} className="text-yellow-600 dark:text-yellow-400" />
               </div>
               <h3 className="text-xl font-black text-gray-800 dark:text-white mb-2">Add Results</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Record medal winners and points</p>
            </div>

            <div onClick={() => handleCardClick("/admin/schedule")} className="bg-white dark:bg-gray-800 p-8 rounded-3xl border-2 border-transparent hover:border-monument-primary shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col items-center text-center">
               <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CalendarDays size={32} className="text-green-600 dark:text-green-400" />
               </div>
               <h3 className="text-xl font-black text-gray-800 dark:text-white mb-2">Schedule</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Manage event dates and venues</p>
            </div>

            <div onClick={() => handleCardClick("/admin/events")} className="bg-white dark:bg-gray-800 p-8 rounded-3xl border-2 border-transparent hover:border-monument-primary shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col items-center text-center">
               <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Flag size={32} className="text-blue-600 dark:text-blue-400" />
               </div>
               <h3 className="text-xl font-black text-gray-800 dark:text-white mb-2">Manage Events</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Edit event details and info</p>
            </div>
        </div>
      </div>

      {/* Dashboard Data Views */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Schedules */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col h-full">
           <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Upcoming & Live Schedules</h2>
           <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-96">
              {recentSchedules.length > 0 ? recentSchedules.map((s: any) => (
                <div key={s.id} className="p-4 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-700">
                   <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{s.events?.icon || '🏅'}</span>
                        <h4 className="text-sm font-black text-gray-800 dark:text-gray-100">{s.events?.name || 'Unknown Event'}</h4>
                      </div>
                      <span className="text-[9px] font-black tracking-widest text-monument-primary uppercase bg-monument-primary/10 px-2 py-1 rounded-md">{s.date}</span>
                   </div>
                   <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                     {(s.start_time?.substring(0,5) || "??:??")} - {(s.end_time?.substring(0,5) || "??:??")} | {s.venues?.name || 'TBA'}
                   </div>
                   <div className="flex gap-1 text-[10px] font-black text-gray-400 uppercase">
                     {s.departments?.join(' VS ')}
                   </div>
                </div>
              )) : (
                 <div className="text-sm text-gray-500 text-center py-10 font-bold">No upcoming schedules</div>
              )}
           </div>
        </div>

        {/* Current Standings */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col h-full">
           <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Top Standings</h2>
           <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar max-h-96">
              {standings.length > 0 ? standings.map((team: any, index: number) => (
                <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-700">
                   <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black shadow-sm ${index === 0 ? 'bg-yellow-400 text-yellow-900' : index === 1 ? 'bg-gray-300 text-gray-800' : index === 2 ? 'bg-amber-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-400'}`}>
                         {index + 1}
                      </div>
                      {team.imageUrl ? (
                        <img src={team.imageUrl} className="w-8 h-8 object-contain drop-shadow-sm" alt={team.name} />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-[10px] font-bold shadow-sm">{team.name.slice(0,2)}</div>
                      )}
                      <span className="text-sm font-black text-gray-800 dark:text-gray-100 tracking-tight">{team.name}</span>
                   </div>
                   <div className="text-sm font-black text-monument-primary">{team.points} <span className="text-[9px] text-gray-400">PTS</span></div>
                </div>
              )) : (
                 <div className="text-sm text-gray-500 text-center py-10 font-bold">No rankings available</div>
              )}
           </div>
        </div>

        {/* Recent Results */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col h-full">
           <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Recent Results</h2>
           <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-96">
              {recentResults.length > 0 ? recentResults.map((r: any) => {
                const dept = Array.isArray(r.departments) ? r.departments[0] : r.departments;
                const isGold = r.medal_type === 'gold';
                const isSilver = r.medal_type === 'silver';
                return (
                  <div key={r.id} className="p-4 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg text-2xl ${isGold ? 'bg-yellow-400' : isSilver ? 'bg-gray-300' : 'bg-amber-600'}`}>
                        {isGold ? '🥇' : isSilver ? '🥈' : '🥉'}
                     </div>
                     <div className="flex-1">
                        <h4 className="text-sm font-black text-gray-800 dark:text-gray-100">{r.events?.name || 'Unknown Event'}</h4>
                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Won By {dept?.name || 'Unknown'}</p>
                     </div>
                  </div>
                )
              }) : (
                 <div className="text-sm text-gray-500 text-center py-10 font-bold">No results posted yet</div>
              )}
           </div>
        </div>
      </div>

    </div>
  );
}
