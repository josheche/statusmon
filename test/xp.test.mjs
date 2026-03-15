import { describe, it, expect } from 'vitest';
import { computeLevel, tokensToXp, TOKENS_PER_XP } from '../lib/evolution.mjs';

describe('XP banking model', () => {
  it('session XP computed from total tokens', () => {
    expect(tokensToXp(TOKENS_PER_XP * 10)).toBe(10);
  });

  it('banked + session XP gives correct level', () => {
    const banked = 30;
    const sessionXp = tokensToXp(TOKENS_PER_XP * 5);
    const level = computeLevel(banked + sessionXp);
    expect(level).toBe(Math.floor((30 + 5) / 3) + 1);
  });

  it('zero tokens gives zero session XP', () => {
    expect(tokensToXp(0)).toBe(0);
  });

  it('tokens below threshold give zero XP', () => {
    expect(tokensToXp(TOKENS_PER_XP - 1)).toBe(0);
  });

  it('exactly one threshold gives 1 XP', () => {
    expect(tokensToXp(TOKENS_PER_XP)).toBe(1);
  });

  it('level 1 at zero total XP', () => {
    expect(computeLevel(0)).toBe(1);
  });

  it('level progresses correctly through evolution thresholds', () => {
    const xpNeeded = 45;
    expect(computeLevel(xpNeeded)).toBe(16);
    expect(computeLevel(xpNeeded - 1)).toBe(15);
  });

  it('heavy session gives meaningful progress', () => {
    const xp = tokensToXp(TOKENS_PER_XP * 50);
    const level = computeLevel(xp);
    expect(level).toBeGreaterThanOrEqual(16);
  });
});
