import { createReadOnlyClient } from "@/utils/supabase/server";
import UpdatesClientPage, { type PublicUpdate } from "./UpdatesClientPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Updates | MONUMENT",
  description: "Latest tournament activity, posted results, live matches, and upcoming schedules.",
};

export const dynamic = "force-dynamic";

type TournamentRef = {
  id: string;
  mystery_mode: boolean;
};

type ResultRow = {
  id: string;
  created_at: string;
  medal_type: "gold" | "silver" | "bronze";
  department_id: string | null;
  events: {
    name: string | null;
    icon: string | null;
    category: string | null;
  } | null;
};

type ScheduleRow = {
  id: string;
  date: string;
  start_time: string;
  end_time: string | null;
  end_date: string | null;
  status: "scheduled" | "live" | "finished" | null;
  departments: string[] | null;
  winner_id: string | null;
  events: {
    name: string | null;
    icon: string | null;
    category: string | null;
  } | null;
  venues: {
    name: string | null;
  } | null;
};

type CategoryRow = {
  id: string;
  name: string;
};

const formatTeamList = (teams?: string[] | null) => {
  if (!teams || teams.length === 0) return "Teams TBA";
  if (teams.length === 1) return teams[0];
  if (teams.length === 2) return `${teams[0]} vs ${teams[1]}`;
  return teams.join(", ");
};

const getScheduleStatus = (schedule: ScheduleRow) => {
  const now = new Date();
  const start = new Date(`${schedule.date}T${schedule.start_time}`);
  const end = new Date(`${schedule.end_date || schedule.date}T${schedule.end_time || "23:59"}`);

  if (Number.isNaN(start.getTime())) return "upcoming";
  if (now >= start && now <= end) return "live";
  if (now > end) return "finished";
  return "upcoming";
};

export default async function UpdatesPage({
  searchParams,
}: {
  searchParams: Promise<{ tournament?: string }>;
}) {
  const supabase = await createReadOnlyClient();
  const resolvedParams = await searchParams;
  const tSlug = resolvedParams?.tournament;

  let tournament: TournamentRef | null = null;

  if (tSlug) {
    const { data } = await supabase
      .from("tournaments")
      .select("id, mystery_mode")
      .eq("slug", tSlug)
      .single();
    tournament = data;
  } else {
    const { data } = await supabase
      .from("tournaments")
      .select("id, mystery_mode")
      .eq("is_active", true)
      .single();
    tournament = data;
  }

  if (!tournament) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black px-6 text-center text-white">
        <img src="/monument-logo.png" alt="Monument" className="mb-6 h-16 w-16 object-contain" />
        <h1 className="text-2xl font-black tracking-tight">No active tournament</h1>
        <p className="mt-3 max-w-xs text-sm font-medium leading-relaxed text-white/45">
          Updates will appear once a tournament is available.
        </p>
      </div>
    );
  }

  const [resultsRes, schedulesRes, departmentsRes, categoriesRes] = await Promise.all([
    tournament.mystery_mode
      ? Promise.resolve({ data: [] as ResultRow[] })
      : supabase
          .from("results")
          .select("id, created_at, medal_type, department_id, events!inner(name, icon, category)")
          .eq("tournament_id", tournament.id)
          .order("created_at", { ascending: false })
          .limit(12),
    supabase
      .from("schedules")
      .select("id, date, start_time, end_time, end_date, status, departments, winner_id, events(name, icon, category), venues(name)")
      .eq("tournament_id", tournament.id)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(24),
    supabase
      .from("tournament_departments")
      .select("department_id, name, abbreviation")
      .eq("tournament_id", tournament.id),
    supabase
      .from("categories")
      .select("id, name"),
  ]);

  const departmentNameById = new Map(
    (departmentsRes.data || []).map((department) => [
      department.department_id,
      department.abbreviation || department.name,
    ])
  );
  const categoryNameById = new Map(
    ((categoriesRes.data || []) as CategoryRow[]).map((category) => [
      category.id,
      category.name,
    ])
  );

  const getCategoryName = (categoryId?: string | null) => {
    if (!categoryId) return null;
    return categoryNameById.get(categoryId) || null;
  };

  const resultUpdates: PublicUpdate[] = ((resultsRes.data || []) as unknown as ResultRow[]).map((result) => {
    const teamName = result.department_id
      ? departmentNameById.get(result.department_id) || "A team"
      : "A team";
    const eventName = result.events?.name || "an event";
    const medal = result.medal_type.charAt(0).toUpperCase() + result.medal_type.slice(1);

    return {
      id: `result-${result.id}`,
      type: "result",
      tone: result.medal_type,
      title: `${medal} result posted`,
      description: `${teamName} earned ${result.medal_type} in ${eventName}.`,
      meta: getCategoryName(result.events?.category) || result.events?.name || "Result",
      timestamp: result.created_at,
    };
  });

  const scheduleUpdates = ((schedulesRes.data || []) as unknown as ScheduleRow[])
    .map((schedule): PublicUpdate => {
      const status = getScheduleStatus(schedule);
      const startsAt = new Date(`${schedule.date}T${schedule.start_time}`);
      const eventName = schedule.events?.name || "Scheduled event";
      const teams = formatTeamList(schedule.departments);

      if (status === "live") {
        return {
          id: `schedule-live-${schedule.id}`,
          type: "live",
          tone: "live",
          title: "Live now",
          description: `${eventName} is happening now. ${teams}.`,
          meta: schedule.venues?.name || "Venue TBA",
          timestamp: new Date().toISOString(),
        };
      }

      if (status === "upcoming") {
        return {
          id: `schedule-upcoming-${schedule.id}`,
          type: "upcoming",
          tone: "upcoming",
          title: "Up next",
          description: `${eventName} is scheduled for ${startsAt.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}. ${teams}.`,
          meta: schedule.venues?.name || "Venue TBA",
          timestamp: startsAt.toISOString(),
        };
      }

      return {
        id: `schedule-finished-${schedule.id}`,
        type: "finished",
        tone: "finished",
        title: "Match finished",
        description: `${eventName} has wrapped. ${teams}.`,
        meta: schedule.venues?.name || "Finished",
        timestamp: startsAt.toISOString(),
      };
    })
    .filter((update): update is PublicUpdate => update.type !== "finished")
    .slice(0, 8);

  const updates = [...resultUpdates, ...scheduleUpdates]
    .sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();
      return bTime - aTime;
    })
    .slice(0, 20);

  return (
    <UpdatesClientPage
      tournamentId={tournament.id}
      mysteryMode={tournament.mystery_mode}
      updates={updates}
    />
  );
}
