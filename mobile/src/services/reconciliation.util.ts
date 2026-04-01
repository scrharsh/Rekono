export type ScoredCandidate<T> = {
  item: T;
  amountDiff: number;
  timeDiff: number;
};

export function absMinutesDiff(aIso: string, bIso: string): number {
  return Math.abs(new Date(aIso).getTime() - new Date(bIso).getTime()) / 60000;
}

export function selectClosestByAmountAndTime<T>(
  items: T[],
  getAmount: (item: T) => number,
  getTimestampIso: (item: T) => string,
  targetAmount: number,
  targetTimestampIso: string,
  amountTolerance = 1,
  timeToleranceMinutes = 120,
): T | null {
  const candidates: ScoredCandidate<T>[] = items
    .map((item) => ({
      item,
      amountDiff: Math.abs(getAmount(item) - targetAmount),
      timeDiff: absMinutesDiff(getTimestampIso(item), targetTimestampIso),
    }))
    .filter((c) => c.amountDiff <= amountTolerance && c.timeDiff <= timeToleranceMinutes)
    .sort((a, b) => a.amountDiff + a.timeDiff * 0.1 - (b.amountDiff + b.timeDiff * 0.1));

  return candidates[0]?.item || null;
}
