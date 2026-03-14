import { loadTrainer, saveTrainer } from '../lib/trainer.mjs';

// Deliver pending evolution/encounter announcements as system messages
const state = loadTrainer();
if (state?.pending_announcement) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'Stop',
      systemMessage: state.pending_announcement,
    },
  }));
  delete state.pending_announcement;
  saveTrainer(state);
}
process.exit(0);
