import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Tournament } from "@/components/AdminTournamentProvider";

interface UseDashboardViewModelProps {
  selectedTournament: Tournament | null;
}

export const useDashboardViewModel = ({ selectedTournament }: UseDashboardViewModelProps) => {
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [loadingCard, setLoadingCard] = useState("");
  
  const [recentSchedules, setRecentSchedules] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [teamsData, setTeamsData] = useState<any[]>([]);
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

      if (!selectedTournament) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      setRole(profile?.role || "user");

      const [teamsRes, eventsRes, resultsRes, categoriesRes, schedulesData, recentResData] = await Promise.all([
        supabase.from("tournament_departments").select("department_id, name, image_url").eq("tournament_id", selectedTournament.id),
        supabase.from("events").select("id", { count: 'exact', head: true }).eq("tournament_id", selectedTournament.id),
        supabase.from("results").select("medal_type, department_id, events(name)").eq("tournament_id", selectedTournament.id),
        supabase.from("categories").select("id", { count: 'exact', head: true }),
        supabase.from("schedules").select("id, start_time, end_time, date, departments, events(icon, name), venues(name)").eq("tournament_id", selectedTournament.id).order("date", { ascending: true }),
        supabase.from("results").select("id, medal_type, department_id, events(name)").eq("tournament_id", selectedTournament.id).order("created_at", { ascending: false }).limit(5)
      ]);

      const fetchedTeamsData = teamsRes.data || [];
      const allResultsData = resultsRes.data || [];
      
      setTeamsData(fetchedTeamsData);

      const teamScores = new Map();
      fetchedTeamsData.forEach((t: any) => teamScores.set(t.department_id, { id: t.department_id, name: t.name, imageUrl: t.image_url, points: 0 }));

      allResultsData.forEach((r: any) => {
        const deptId = r.department_id;
        if (deptId) {
          const existing = teamScores.get(deptId);
          if (existing) {
            if (r.medal_type === 'gold') existing.points += 200;
            if (r.medal_type === 'silver') existing.points += 150;
            if (r.medal_type === 'bronze') existing.points += 100;
          }
        }
      });
      
      const sortedStandings = Array.from(teamScores.values())
        .sort((a,b) => b.points - a.points)
        .slice(0, 5); 
      
      setStandings(sortedStandings);
      setRecentResults(recentResData.data || []);
      
      const upcoming = (schedulesData.data || []).filter((s:any) => {
         const endDateTime = new Date(`${s.date}T${s.end_time || '23:59'}`);
         return endDateTime >= new Date();
      }).slice(0, 5);
      setRecentSchedules(upcoming);

      setStats({
        teams: fetchedTeamsData.length,
        events: eventsRes.count || 0,
        results: allResultsData.length,
        categories: categoriesRes.count || 0
      });

      setLoading(false);
    }
    fetchDashboardData();
    document.title = "Dashboard | Admin Management";
  }, [router, supabase, selectedTournament]);

  const handleCardClick = useCallback((href: string) => {
    setLoadingCard(href);
    router.push(href);
  }, [router]);

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) router.push("/");
  }, [router, supabase]);

  return {
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
  };
};
