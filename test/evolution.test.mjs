import { describe, it, expect } from 'vitest';
import {
  computeLevel,
  flattenChain,
  tokensToXp,
  checkEvolution,
  shouldRelease,
  TOKENS_PER_XP,
} from '../lib/evolution.mjs';

describe('computeLevel', () => {
  it('returns 1 at 0 xp', () => {
    expect(computeLevel(0)).toBe(1);
  });

  it('returns 2 at 3 xp', () => {
    expect(computeLevel(3)).toBe(2);
  });

  it('returns correct level for larger xp values', () => {
    expect(computeLevel(9)).toBe(4);
    expect(computeLevel(30)).toBe(11);
  });

  it('floors fractional results', () => {
    expect(computeLevel(1)).toBe(1);
    expect(computeLevel(2)).toBe(1);
    expect(computeLevel(4)).toBe(2);
  });
});

describe('tokensToXp', () => {
  it('returns 0 for tokens below threshold', () => {
    expect(tokensToXp(1000)).toBe(0);
  });

  it('converts tokens at TOKENS_PER_XP rate', () => {
    expect(tokensToXp(TOKENS_PER_XP)).toBe(1);
    expect(tokensToXp(TOKENS_PER_XP * 5)).toBe(5);
  });

  it('floors partial XP', () => {
    expect(tokensToXp(TOKENS_PER_XP * 2.7)).toBe(2);
  });
});

const CHARMANDER_STAGES = [
  { species: 'charmander', speciesId: 4, minLevel: null },
  { species: 'charmeleon', speciesId: 5, minLevel: 16 },
  { species: 'charizard', speciesId: 6, minLevel: 36 },
];

describe('checkEvolution', () => {
  it('returns null when below evolution level', () => {
    expect(checkEvolution('charmander', 15, CHARMANDER_STAGES)).toBeNull();
  });

  it('returns next stage when at evolution level', () => {
    const result = checkEvolution('charmander', 16, CHARMANDER_STAGES);
    expect(result.species).toBe('charmeleon');
  });

  it('returns null for final form', () => {
    expect(checkEvolution('charizard', 99, CHARMANDER_STAGES)).toBeNull();
  });

  it('returns null for single-stage pokemon', () => {
    const ditto = [{ species: 'ditto', speciesId: 132, minLevel: null }];
    expect(checkEvolution('ditto', 99, ditto)).toBeNull();
  });
});

describe('shouldRelease', () => {
  it('releases non-evolving pokemon at level 30', () => {
    const ditto = [{ species: 'ditto', speciesId: 132, minLevel: null }];
    expect(shouldRelease('ditto', 29, ditto)).toBe(false);
    expect(shouldRelease('ditto', 30, ditto)).toBe(true);
  });

  it('releases final form at level cap', () => {
    expect(shouldRelease('charizard', 59, CHARMANDER_STAGES)).toBe(false);
    expect(shouldRelease('charizard', 60, CHARMANDER_STAGES)).toBe(true);
  });

  it('does not release mid-evolution pokemon', () => {
    expect(shouldRelease('charmeleon', 99, CHARMANDER_STAGES)).toBe(false);
  });
});

describe('flattenChain', () => {
  it('flattens a single-stage chain', () => {
    const chainData = {
      chain: {
        species: {
          name: 'eevee',
          url: 'https://pokeapi.co/api/v2/pokemon-species/133/',
        },
        evolution_details: [],
        evolves_to: [],
      },
    };
    const stages = flattenChain(chainData);
    expect(stages).toEqual([
      { species: 'eevee', speciesId: 133, minLevel: null },
    ]);
  });

  it('flattens a multi-stage chain', () => {
    const chainData = {
      chain: {
        species: {
          name: 'charmander',
          url: 'https://pokeapi.co/api/v2/pokemon-species/4/',
        },
        evolution_details: [],
        evolves_to: [
          {
            species: {
              name: 'charmeleon',
              url: 'https://pokeapi.co/api/v2/pokemon-species/5/',
            },
            evolution_details: [{ min_level: 16 }],
            evolves_to: [
              {
                species: {
                  name: 'charizard',
                  url: 'https://pokeapi.co/api/v2/pokemon-species/6/',
                },
                evolution_details: [{ min_level: 36 }],
                evolves_to: [],
              },
            ],
          },
        ],
      },
    };
    const stages = flattenChain(chainData);
    expect(stages).toEqual(CHARMANDER_STAGES);
  });

  it('uses DEFAULT_EVOLVE_LEVEL (20) when min_level is falsy', () => {
    const chainData = {
      chain: {
        species: {
          name: 'pikachu',
          url: 'https://pokeapi.co/api/v2/pokemon-species/25/',
        },
        evolution_details: [],
        evolves_to: [
          {
            species: {
              name: 'raichu',
              url: 'https://pokeapi.co/api/v2/pokemon-species/26/',
            },
            evolution_details: [{ min_level: null }],
            evolves_to: [],
          },
        ],
      },
    };
    const stages = flattenChain(chainData);
    expect(stages[1].minLevel).toBe(20);
  });
});
