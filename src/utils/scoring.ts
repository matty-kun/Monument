export function calculateTotalPoints(golds: number, silvers: number, bronzes: number): number {
  return golds * 200 + silvers * 150 + bronzes * 100;
}
