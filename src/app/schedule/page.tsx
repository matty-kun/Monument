import { createClient } from "@/utils/supabase/server";
import ScheduleClientPage from "./ScheduleClientPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Event Schedule | MONUMENT",
  description:
    "View the full schedule for all SIDLAK intramural events, including dates, times, and venues. Stay updated on upcoming, live, and finished competitions.",
  openGraph: {
    title: "Event Schedule | SIDLAK",
    description: "Full schedule for all SIDLAK intramural events.",
  },
};

export const dynamic = "force-dynamic";

interface Department {
  id: string;
  name: string;
  abbreviation?: string | null;
  image_url?: string;
}

interface Event {
  id: string;
  name: string;
  abbreviation?: string;
  icon: string | null;
  category: string | { name: string } | null;
  division: string | null;
  gender: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface Venue {
  id?: string;
  name: string;
}

interface Schedule {
  id: string;
  event_id: string;
  venue_id: string;
  events: Event | null;
  venues: Venue | null;
  departments: (Department | string)[];
  start_time: string;
  end_time: string;
  date: string;
  end_date?: string | null;
  status: "scheduled" | "live" | "finished";
  winner_id?: string | null;
  score_a?: number | null;
  score_b?: number | null;
}

type ScheduleStatus = "live" | "scheduled" | "finished";

type RawScheduleFromSupabase = Omit<
  Schedule,
  "events" | "venues" | "departments"
> & {
  events: Event | Event[] | null;
  venues: Venue | Venue[] | null;
  departments: string[];
};

const getDynamicStatus = (
  schedule: Schedule
): { status: ScheduleStatus; label: string; color: string; icon: string } => {
  if (!schedule.date || !schedule.start_time || !schedule.end_time)
    return {
      status: "scheduled",
      label: "Upcoming",
      color: "bg-amber-500",
      icon: "⏳",
    };

  const now = new Date();
  const start = new Date(`${schedule.date}T${schedule.start_time}`);
  const end = new Date(`${schedule.end_date || schedule.date}T${schedule.end_time}`);

  if (isNaN(start.getTime()))
    return {
      status: "scheduled",
      label: "Upcoming",
      color: "bg-amber-500",
      icon: "⏳",
    };

  if (now < start)
    return {
      status: "scheduled",
      label: "Upcoming",
      color: "bg-amber-500",
      icon: "⏳",
    };

  if (now >= start && now <= end)
    return {
      status: "live",
      label: "Live Now",
      color: "bg-emerald-500 animate-pulse",
      icon: "🔴",
    };

  return {
    status: "finished",
    label: "Finished",
    color: "bg-rose-500",
    icon: "🏁",
  };
};

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ tournament?: string }> }) {
  const supabase = await createClient();
  const resolvedParams = await searchParams;
  const tSlug = resolvedParams?.tournament;

  let tournamentId: string | undefined;
  let mysteryMode = false;

  if (tSlug) {
    const { data: tData } = await supabase.from('tournaments').select('id, mystery_mode').eq('slug', tSlug).single();
    if (tData) {
      tournamentId = tData.id;
      mysteryMode = tData.mystery_mode;
    }
  } else {
    const { data: activeT } = await supabase.from('tournaments').select('id, mystery_mode').eq('is_active', true).single();
    if (activeT) {
      tournamentId = activeT.id;
      mysteryMode = activeT.mystery_mode;
    }
  }

  // Fetch schedules
  const fetchSchedules = async () => {
    let query = supabase
      .from("schedules")
      .select(`
        id,
        event_id,
        venue_id,
        start_time,
        end_time,
        date,
        end_date,
        status,
        departments,
        winner_id,
        score_a,
        score_b,
        events!inner ( id, name, icon, division, gender, category, tournament_id, results ( department_id, medal_type ) ),
        venues ( name )
      `);
      
    if (tournamentId) {
      query = query.eq('tournament_id', tournamentId);
    }
    
    const { data, error } = await query
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching schedules:", error);
      return [];
    }

    if (data) {
      const normalized = data.map((s: RawScheduleFromSupabase) => ({
        ...s,
        events: Array.isArray(s.events) ? s.events[0] : s.events,
        venues: Array.isArray(s.venues) ? s.venues[0] || null : s.venues || null,
      }));

      const allDeptNames = Array.from(
        new Set(
          normalized.flatMap((s: RawScheduleFromSupabase) => s.departments)
        )
      );

      if (allDeptNames.length === 0) {
        return normalized as Schedule[];
      }

      let deptQuery = supabase
        .from("tournament_departments")
        .select("id:department_id, name, image_url, abbreviation");
        
      if (tournamentId) {
        deptQuery = deptQuery.eq("tournament_id", tournamentId);
      }
      const { data: deptData, error: deptError } = await deptQuery.in("name", allDeptNames);

      if (deptError) {
        console.warn("Error fetching departments:", deptError);
        return normalized as Schedule[];
      }

      const deptMap = new Map(deptData.map((d: Department) => [d.name, d]));

      const enriched = normalized.map((sched: typeof normalized[0]) => ({
        ...sched,
        departments: sched.departments.map(
          (name: string) => deptMap.get(name) || name
        ),
      }));

      const statusOrder: Record<ScheduleStatus, number> = {
        live: 1,
        scheduled: 2,
        finished: 3,
      };

      const sorted = (enriched as Schedule[]).sort((a, b) => {
        const statusA = getDynamicStatus(a).status;
        const statusB = getDynamicStatus(b).status;

        const orderA = statusOrder[statusA] || 4;
        const orderB = statusOrder[statusB] || 4;

        if (orderA !== orderB) return orderA - orderB;

        return (
          new Date(a.date + "T" + a.start_time).getTime() -
          new Date(b.date + "T" + b.start_time).getTime()
        );
      });

      return sorted;
    }

    return [];
  };

  // Fetch filter options
  const fetchFilterOptions = async (): Promise<{
    events: Event[];
    venues: Venue[];
    categories: Category[];
    departments: Department[];
  }> => {
    let eventsQuery = supabase
      .from("events")
      .select("id, name, icon, category, gender, division");
      
    if (tournamentId) {
      eventsQuery = eventsQuery.eq("tournament_id", tournamentId);
    }
    eventsQuery = eventsQuery.order("category,name");

    let deptQuery = supabase
      .from("tournament_departments")
      .select("id:department_id, name, image_url, abbreviation");
      
    if (tournamentId) {
      deptQuery = deptQuery.eq("tournament_id", tournamentId);
    }
    deptQuery = deptQuery.order("name");

    const [
      { data: events },
      { data: venues },
      { data: categories },
      { data: departments },
    ] = await Promise.all([
      eventsQuery,
      supabase.from("venues").select("id, name").order("name"),
      supabase.from("categories").select("id, name").order("name"),
      deptQuery,
    ]);

    return {
      events: (events as Event[]) || [],
      venues: venues || [],
      categories: categories || [],
      departments: (departments as Department[]) || [],
    };
  };

  if (!tournamentId) {
    return (
      <div className="h-screen bg-[#F5F5F7] dark:bg-black flex flex-col items-center justify-center text-center px-6 transition-colors">
        <div className="w-16 h-16 mb-6 drop-shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/monument-logo.png" alt="Monument" className="w-full h-full object-contain" />
        </div>
        <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-3">No Active Tournament</div>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-sm max-w-xs leading-relaxed">
          The season has concluded. Check back later for upcoming intramurals.
        </p>
      </div>
    );
  }

  const [schedules, { events, venues, categories, departments }] =
    await Promise.all([
      fetchSchedules(), 
      fetchFilterOptions()
    ]);

  return (
    <ScheduleClientPage
      initialSchedules={schedules}
      initialEvents={events}
      initialVenues={venues}
      initialCategories={categories}
      initialDepartments={departments}
      mysteryMode={mysteryMode}
    />
  );
}
