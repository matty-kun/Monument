export function getTournamentRealtimeFilter(tournamentId: string): string {
  return `id=eq.${tournamentId}`;
}

export function getTournamentDataFilter(tournamentId: string): string {
  return `tournament_id=eq.${tournamentId}`;
}

export function readMysteryMode(payload: Record<string, unknown>): boolean {
  return payload.mystery_mode === true;
}
