export interface ResultDepartment {
  id: string;
  name: string;
  abbreviation?: string | null;
  image_url?: string;
}

export interface ResultEvent {
  id: string;
  name: string;
  icon?: string;
  category?: string | null;
}

export interface ResultCategory {
  id: string;
  name: string;
}

export interface ResultWithDepartment {
  id: string;
  event_id: string;
  department_id: string;
  medal_type: 'gold' | 'silver' | 'bronze' | 'none';
  departments: ResultDepartment | ResultDepartment[] | null;
}
