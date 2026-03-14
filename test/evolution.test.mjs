import { describe, it, expect } from 'vitest';
import { computeLevel, flattenChain } from '../lib/evolution.mjs';

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
    expect(stages).toEqual([
      { species: 'charmander', speciesId: 4, minLevel: null },
      { species: 'charmeleon', speciesId: 5, minLevel: 16 },
      { species: 'charizard', speciesId: 6, minLevel: 36 },
    ]);
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
