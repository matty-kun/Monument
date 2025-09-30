// src/utils/scoring.ts
export function calculateTotalPoints(golds: number, silvers: number, bronzes: number): number {
  return golds * 1 + silvers * 0.20 + bronzes * 0.04;
}
