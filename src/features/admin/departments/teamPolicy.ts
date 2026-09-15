export interface TournamentTeamInput {
  teamId?: string | null;
  tournamentId: string;
  name: string;
  abbreviation: string;
  imageUrl: string | null;
}

export interface TournamentTeamPayload {
  name: string;
  abbreviation: string | null;
  image_url: string | null;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateTournamentTeamInput(input: TournamentTeamInput): string | null {
  if (!UUID_PATTERN.test(input.tournamentId)) return "Select a valid tournament.";
  if (input.teamId && !UUID_PATTERN.test(input.teamId)) return "The selected team is invalid.";

  const name = input.name.trim();
  const abbreviation = input.abbreviation.trim();
  if (!name) return "Team name is required.";
  if (name.length > 100) return "Team name must be 100 characters or fewer.";
  if (abbreviation.length > 40) return "Team abbreviation must be 40 characters or fewer.";
  if (input.imageUrl && input.imageUrl.length > 2_000) return "Team image URL is too long.";
  return null;
}


export function buildTournamentTeamPayload(input: TournamentTeamInput): TournamentTeamPayload {
  return {
    name: input.name.trim(),
    abbreviation: input.abbreviation.trim() || null,
    image_url: input.imageUrl?.trim() || null,
  };
}
