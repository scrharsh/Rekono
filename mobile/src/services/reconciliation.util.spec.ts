import { absMinutesDiff, selectClosestByAmountAndTime } from './reconciliation.util';

describe('reconciliation.util', () => {
  it('computes absolute minute difference', () => {
    const a = '2026-01-01T10:00:00.000Z';
    const b = '2026-01-01T10:30:00.000Z';
    expect(absMinutesDiff(a, b)).toBe(30);
    expect(absMinutesDiff(b, a)).toBe(30);
  });

  it('returns null when no candidates pass tolerance filters', () => {
    const targetTs = '2026-01-01T10:00:00.000Z';
    const items = [
      { id: 'a', amount: 500, ts: '2026-01-01T20:00:00.000Z' },
      { id: 'b', amount: 700, ts: '2026-01-01T11:00:00.000Z' },
    ];

    const picked = selectClosestByAmountAndTime(
      items,
      (i) => i.amount,
      (i) => i.ts,
      1000,
      targetTs,
    );

    expect(picked).toBeNull();
  });

  it('picks best candidate using weighted amount and time score', () => {
    const targetTs = '2026-01-01T10:00:00.000Z';
    const items = [
      { id: 'a', amount: 999.8, ts: '2026-01-01T10:50:00.000Z' },
      { id: 'b', amount: 999.9, ts: '2026-01-01T10:20:00.000Z' },
      { id: 'c', amount: 1000.8, ts: '2026-01-01T10:05:00.000Z' },
    ];

    const picked = selectClosestByAmountAndTime(
      items,
      (i) => i.amount,
      (i) => i.ts,
      1000,
      targetTs,
    );

    expect(picked?.id).toBe('c');
  });
});
