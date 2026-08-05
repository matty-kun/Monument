export interface Department {
  id: string;
  name: string;
  abbreviation?: string | null;
  image_url?: string;
  nickname?: string;
}

export interface Event {
  id: string;
  name: string;
  abbreviation?: string;
  icon: string | null;
  category: string | { name: string } | null;
  division: string | null;
  gender: string | null;
}

export interface Category {
  id: string;
  name: string;
}

export interface Venue {
  id?: string;
  name: string;
}
