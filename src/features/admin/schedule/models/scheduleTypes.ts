export interface ScheduleDepartment {
  id: string;
  name: string;
  abbreviation: string;
  image_url: string | null;
}

export interface ScheduleEvent {
  id: string;
  name: string;
  icon: string | null;
  category: { id: string; name: string } | string | null;
}

export interface ScheduleVenue {
  id: string;
  name: string;
}

export interface AdminSchedule {
  id: string;
  event_id: string;
  venue_id: string;
  departments: string[];
  start_time: string;
  end_time: string | null;
  date: string;
  status: "scheduled" | "live" | "finished";
  winner_id: string | null;
  score_a: number | null;
  score_b: number | null;
  events: ScheduleEvent | null;
  venues: ScheduleVenue | null;
  end_date: string | null;
}
