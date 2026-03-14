import fs from 'fs';
import path from 'path';
import os from 'os';

const POKEDEX_PATH = path.join(os.homedir(), '.statusmon', 'pokedex.json');

export function loadPokedex() {
  try { return JSON.parse(fs.readFileSync(POKEDEX_PATH, 'utf8')); }
  catch { return []; }
}

export function recordPokemon(state) {
  const dex = loadPokedex();
  dex.push({
    species: state.started_species || state.species,
    species_id: state.started_species_id || state.species_id,
    chain_id: state.chain_id,
    types: state.types,
    genus: state.genus,
    max_level: state.level,
    max_species: state.species,
    max_species_id: state.species_id,
    encountered_at: state.started_at,
    released_at: new Date().toISOString().slice(0, 10),
    sessions: state.sessions || 0,
  });
  fs.writeFileSync(POKEDEX_PATH, JSON.stringify(dex, null, 2));
}
