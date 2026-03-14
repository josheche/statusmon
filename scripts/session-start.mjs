import { loadTrainer, saveTrainer, createTrainer } from '../lib/trainer.mjs';
import { newEncounter, tokensToXp } from '../lib/evolution.mjs';

async function main() {
  let state = loadTrainer();

  if (!state || !state.species) {
    // First run — assign a random starter
    const encounter = await newEncounter();
    state = createTrainer(encounter);
  } else {
    // Bank previous session's XP
    const sessionXp = tokensToXp(state.last_session_tokens || 0);
    state.banked_xp = (state.banked_xp || 0) + sessionXp;
    state.last_session_tokens = 0;
  }

  state.sessions = (state.sessions || 0) + 1;
  saveTrainer(state);
}

main()
  .catch((e) => {
    process.stderr.write(`statusmon session-start: ${e.message}\n`);
  })
  .finally(() => process.exit(0));
