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

export const revalidate = 60; // Revalidate data every 60 seconds

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
  category: string | { name: string } | null; // Allow string for UUID
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
  status: "upcoming" | "ongoing" | "finished";
}

type ScheduleStatus = "ongoing" | "upcoming" | "finished";

// Type for the raw data from Supabase before normalization
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
      status: "upcoming",
      label: "Upcoming",
      color: "bg-yellow-500",
      icon: "⏳",
    };

  const now = new Date();
  const start = new Date(`${schedule.date}T${schedule.start_time}`);
  const end = new Date(`${schedule.date}T${schedule.end_time}`);

  if (isNaN(start.getTime()))
    return {
      status: "upcoming",
      label: "Upcoming",
      color: "bg-yellow-500",
      icon: "⏳",
    };

  if (now < start)
    return {
      status: "upcoming",
      label: "Upcoming",
      color: "bg-yellow-500",
      icon: "⏳",
    };

  if (now >= start && now <= end)
    return {
      status: "ongoing",
      label: "Live Now",
      color: "bg-green-500 animate-pulse",
      icon: "🔴",
    };

  return {
    status: "finished",
    label: "Finished",
    color: "bg-red-500",
    icon: "✅",
  };
};

export default async function SchedulePage() {
  // Fetch schedules
  const fetchSchedules = async () => {
    const supabase = await createClient(); // FIXED: Added await

    const { data, error } = await supabase
      .from("schedules")
      .select(`
        id,
        event_id,
        venue_id,
        start_time,
        end_time,
        date,
        status,
        departments,
        events ( id, name, icon, division, gender, category ),
        venues ( name )
      `)
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

      const { data: deptData, error: deptError } = await supabase
        .from("departments")
        .select("id, name, image_url, abbreviation")
        .in("name", allDeptNames);

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
        ongoing: 1,
        upcoming: 2,
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
    const supabase = await createClient(); // FIXED: Added await
    const [
      { data: events },
      { data: venues },
      { data: categories },
      { data: departments },
    ] = await Promise.all([
      supabase
        .from("events")
        .select("id, name, icon, category, gender, division")
        .order("category,name"),
      supabase.from("venues").select("id, name").order("name"),
      supabase.from("categories").select("id, name").order("name"),
      supabase
        .from("departments")
        .select("id, name, image_url, abbreviation")
        .order("name"),
    ]);

    return {
      events: (events as Event[]) || [],
      venues: venues || [],
      categories: categories || [],
      departments: (departments as Department[]) || [],
    };
  };

  const [schedules, { events, venues, categories, departments }] =
    await Promise.all([fetchSchedules(), fetchFilterOptions()]);

  return (
    <ScheduleClientPage
      initialSchedules={schedules}
      initialEvents={events}
      initialVenues={venues}
      initialCategories={categories}
      initialDepartments={departments}
    />
  );
}
