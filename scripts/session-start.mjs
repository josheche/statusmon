import { loadTrainer, saveTrainer, createTrainer } from '../lib/trainer.mjs';
import { newEncounter, resolveSpeciesMeta } from '../lib/evolution.mjs';
import { fetchCached } from '../lib/cache.mjs';

async function main() {
  let state = loadTrainer();

  if (!state || !state.species) {
    const encounter = await newEncounter();
    const meta = await resolveSpeciesMeta(encounter.speciesId, encounter.chainId, encounter.species);
    state = createTrainer(encounter.chainId, encounter.species, encounter.speciesId, meta);
  } else {
    // Pre-cache in parallel
    await Promise.all([
      fetchCached(`pokemon-species/${state.species_id}`),
      fetchCached(`evolution-chain/${state.chain_id}`),
      fetchCached(`pokemon/${state.species_id}`),
    ]).catch(() => {});

    // Backfill denormalized fields if missing (upgrade from older state format)
    if (!state.types) {
      const meta = await resolveSpeciesMeta(state.species_id, state.chain_id, state.species);
      Object.assign(state, { types: meta.types, genus: meta.genus, target_level: meta.targetLevel, is_final: meta.isFinal });
    }
  }

  state.sessions = (state.sessions || 0) + 1;
  saveTrainer(state);
}

main().catch(() => {}).finally(() => process.exit(0));
