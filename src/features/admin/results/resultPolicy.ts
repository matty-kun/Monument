export type MedalType = "gold" | "silver" | "bronze";

export interface ResultAssignmentInput {
  departmentId: string | null;
  medalType: MedalType;
}

export interface ReplaceEventResultsInput {
  eventId: string;
  tournamentId: string;
  assignments: ResultAssignmentInput[];
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MEDAL_TYPES = new Set<MedalType>(["gold", "silver", "bronze"]);

export function validateResultReplacement(input: ReplaceEventResultsInput) {
  if (!UUID_PATTERN.test(input.eventId) || !UUID_PATTERN.test(input.tournamentId)) {
    return "Invalid event or tournament.";
  }

  if (!Array.isArray(input.assignments) || input.assignments.length > 3) {
    return "A maximum of three medal results is allowed.";
  }

  const medals = new Set<MedalType>();
  const departments = new Set<string>();

  for (const assignment of input.assignments) {
    if (!MEDAL_TYPES.has(assignment.medalType)) return "Invalid medal type.";
    if (medals.has(assignment.medalType)) return "Each medal can only be assigned once.";
    medals.add(assignment.medalType);

    if (assignment.departmentId !== null) {
      if (!UUID_PATTERN.test(assignment.departmentId)) return "Invalid team selection.";
      if (departments.has(assignment.departmentId)) return "A team cannot receive more than one medal.";
      departments.add(assignment.departmentId);
    }
  }

  return null;
}
