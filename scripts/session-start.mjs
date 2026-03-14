import { loadTrainer, saveTrainer, createTrainer } from '../lib/trainer.mjs';
import {
  newEncounter,
  tokensToXp,
  computeLevel,
  GEN_CAPS,
  SESSIONS_PER_GEN,
} from '../lib/evolution.mjs';

async function main() {
  let state = loadTrainer();

  if (!state || !state.species) {
    // First run — assign a random Gen 1 starter
    const encounter = await newEncounter(GEN_CAPS[0]);
    state = createTrainer(encounter);
  } else {
    // Bank previous session's XP
    const prevSessionXp = tokensToXp(state.last_session_tokens || 0);
    const prevLevel = computeLevel(state.banked_xp || 0);
    state.banked_xp = (state.banked_xp || 0) + prevSessionXp;
    state.last_session_tokens = 0;
    const newLevel = computeLevel(state.banked_xp);

    // Session recap
    if (prevSessionXp > 0) {
      const name = capitalize(state.species);
      process.stderr.write(
        `Statusmon: ${name} gained ${newLevel - prevLevel} levels last session (Lv.${prevLevel} → Lv.${newLevel})\n`,
      );
    }

    // Generation progression
    state.gen_sessions = (state.gen_sessions || 0) + 1;
    const gen = state.generation || 1;
    if (gen < GEN_CAPS.length && state.gen_sessions >= SESSIONS_PER_GEN * gen) {
      state.generation = gen + 1;
      process.stderr.write(
        `Statusmon: Generation ${gen + 1} unlocked! New Pokemon available.\n`,
      );
    }
  }

  state.sessions = (state.sessions || 0) + 1;
  saveTrainer(state);
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

main()
  .catch((e) => {
    process.stderr.write(`statusmon session-start: ${e.message}\n`);
  })
  .finally(() => process.exit(0));
