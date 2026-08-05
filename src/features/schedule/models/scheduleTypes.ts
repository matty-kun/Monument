import { Department, Event, Venue, Category } from "@/shared/models/tournamentTypes";

export interface Schedule {
  id: string;
  event_id: string;
  venue_id: string;
  events: Event | null;
  venues: Venue | null;
  departments: (Department | string)[];
  start_time: string;
  end_time: string | null;
  date: string;
  end_date?: string | null;
  status: "scheduled" | "live" | "finished";
  winner_id?: string | null;
  score_a?: number | null;
  score_b?: number | null;
}

export type ScheduleStatus = "live" | "scheduled" | "finished";

export interface ScheduleClientPageProps {
  initialSchedules: Schedule[];
  initialEvents: Event[];
  initialVenues: Venue[];
  initialCategories: Category[];
  initialDepartments: Department[];
  mysteryMode?: boolean;
}
