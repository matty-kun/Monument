export interface LeaderboardRow {
  id: string;
  name: string;
  abbreviation: string | null;
  image_url?: string;
  mascot_url?: string | null;
  total_points: number;
  golds: number;
  silvers: number;
  bronzes: number;
}

export interface LeaderboardRPCData {
  id: string;
  name: string;
  abbreviation: string | null;
  image_url?: string;
  mascot_url?: string | null;
  golds: number;
  silvers: number;
  bronzes: number;
}

export interface LeaderboardClientPageProps {
  initialLeaderboard: LeaderboardRow[];
  initialMysteryMode: boolean;
  tournamentId?: string;
  tournamentName: string;
}
