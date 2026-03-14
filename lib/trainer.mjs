import fs from 'fs';
import path from 'path';
import os from 'os';

const STATE_DIR = path.join(os.homedir(), '.statusmon');
const TRAINER_PATH = path.join(STATE_DIR, 'trainer.json');
let stateDirReady = false;

export function loadTrainer() {
  try {
    return JSON.parse(fs.readFileSync(TRAINER_PATH, 'utf8'));
  } catch {
    return null;
  }
}

export function saveTrainer(state) {
  if (!stateDirReady) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    stateDirReady = true;
  }
  const tmp = TRAINER_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, TRAINER_PATH);
}

export function createTrainer(encounter) {
  return {
    chain_id: encounter.chainId,
    species: encounter.species,
    species_id: encounter.speciesId,
    started_species: encounter.species,
    started_species_id: encounter.speciesId,
    banked_xp: 0,
    last_session_tokens: 0,
    just_evolved: false,
    sessions: 0,
    started_at: new Date().toISOString().slice(0, 10),
    types: encounter.types,
    genus: encounter.genus,
    target_level: encounter.targetLevel,
    release_level: encounter.releaseLevel,
    is_final: encounter.isFinal,
    dex_count: 0,
    stages: encounter.stages,
  };
}
