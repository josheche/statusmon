import crypto from 'crypto';
import { P } from './api.mjs';

const TOTAL_CHAINS = 541;
const DEFAULT_EVOLVE_LEVEL = 20;
const RELEASE_LEVEL = 30;
const POST_FINAL_LEVELS = 30;
const MAX_LEVEL_CAP = 60;
export const TOKENS_PER_XP = 25000;

export function computeLevel(xp) {
  return Math.floor(xp / 3) + 1;
}

export function tokensToXp(tokens) {
  return Math.floor(tokens / TOKENS_PER_XP);
}

export function flattenChain(chainData) {
  const stages = [];
  function walk(node) {
    const speciesId = parseInt(
      node.species.url.split('/').filter(Boolean).pop(),
      10,
    );
    let minLevel = null;
    if (node.evolution_details && node.evolution_details.length > 0) {
      minLevel = node.evolution_details[0].min_level || DEFAULT_EVOLVE_LEVEL;
    }
    stages.push({ species: node.species.name, speciesId, minLevel });
    if (node.evolves_to && node.evolves_to.length > 0) {
      walk(node.evolves_to[0]);
    }
  }
  walk(chainData.chain);
  return stages;
}

export function findCurrentStageIndex(stages, species) {
  return stages.findIndex((s) => s.species === species);
}

export function checkEvolution(species, level, stages) {
  const idx = findCurrentStageIndex(stages, species);
  if (idx < 0 || idx >= stages.length - 1) return null;
  const nextStage = stages[idx + 1];
  return level >= nextStage.minLevel ? nextStage : null;
}

export function shouldRelease(species, level, stages) {
  const idx = findCurrentStageIndex(stages, species);
  const isFinalForm = idx === stages.length - 1;
  const canEvolve = stages.length > 1;

  if (!canEvolve && level >= RELEASE_LEVEL) return true;
  if (isFinalForm) {
    const finalMinLevel = stages[stages.length - 1].minLevel || 0;
    if (level >= finalMinLevel + POST_FINAL_LEVELS || level >= MAX_LEVEL_CAP)
      return true;
  }
  return false;
}

export function computeReleaseLevel(species, stages) {
  const idx = findCurrentStageIndex(stages, species);
  const isFinalForm = idx === stages.length - 1;
  const canEvolve = stages.length > 1;

  if (!canEvolve) return RELEASE_LEVEL;
  if (isFinalForm) {
    const finalMinLevel = stages[stages.length - 1].minLevel || 0;
    return Math.min(finalMinLevel + POST_FINAL_LEVELS, MAX_LEVEL_CAP);
  }
  // Mid-chain: target is next evolution
  if (idx >= 0 && idx < stages.length - 1) return stages[idx + 1].minLevel;
  return RELEASE_LEVEL;
}

export async function newEncounter() {
  const chainId = crypto.randomInt(TOTAL_CHAINS) + 1;
  const chainData = await P.getEvolutionChainById(chainId);
  const stages = flattenChain(chainData);
  const base = stages[0];

  const [pokemon, speciesData] = await Promise.all([
    P.getPokemonByName(base.speciesId),
    P.getPokemonSpeciesByName(base.speciesId),
  ]);

  const types = pokemon.types.map((t) => t.type.name);
  const genusEntry = speciesData.genera.find((g) => g.language.name === 'en');
  const genus = genusEntry ? genusEntry.genus : 'Pokémon';
  const isFinal = stages.length === 1;
  const targetLevel = stages.length > 1 ? stages[1].minLevel : RELEASE_LEVEL;
  const releaseLevel = computeReleaseLevel(base.species, stages);

  return {
    chainId,
    stages,
    species: base.species,
    speciesId: base.speciesId,
    types,
    genus,
    targetLevel,
    releaseLevel,
    isFinal,
  };
}

export async function resolveSpeciesMeta(speciesId, speciesName, stages) {
  const [pokemon, speciesData] = await Promise.all([
    P.getPokemonByName(speciesId),
    P.getPokemonSpeciesByName(speciesId),
  ]);

  const types = pokemon.types.map((t) => t.type.name);
  const genusEntry = speciesData.genera.find((g) => g.language.name === 'en');
  const genus = genusEntry ? genusEntry.genus : 'Pokémon';
  const idx = findCurrentStageIndex(stages, speciesName);
  const isFinal = stages.length > 1 && idx === stages.length - 1;
  const targetLevel =
    idx >= 0 && idx < stages.length - 1
      ? stages[idx + 1].minLevel
      : RELEASE_LEVEL;
  const releaseLevel = computeReleaseLevel(speciesName, stages);

  return { types, genus, targetLevel, releaseLevel, isFinal };
}
