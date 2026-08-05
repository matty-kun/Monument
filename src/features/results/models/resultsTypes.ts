export interface ProcessedResult {
  event_name: string;
  category: string | null;
  division: string | null;
  gender: string | null;
  event_icon: string | null;
  department_id: string | null;
  department_name: string | null;
  department_abbreviation: string | null;
  department_image_url?: string;
  medal_type: "gold" | "silver" | "bronze";
  created_at?: string;
}

export interface WinnerInfo {
  department_id: string | null;
  department_name: string | null;
  department_abbreviation: string | null;
  image_url?: string;
}

export interface GroupedResult {
  icon: string | null;
  category: string | null;
  division: string | null;
  gender: string | null;
  winners: Partial<Record<"gold" | "silver" | "bronze", WinnerInfo>>;
}

export interface EventsClientPageProps {
  initialResults: ProcessedResult[];
  initialCategories: { id: string; name: string; icon?: string }[];
  mysteryMode?: boolean;
}
