import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// lib/trainer.mjs
import fs from 'fs';
import path from 'path';
import os from 'os';
var STATE_DIR = path.join(os.homedir(), '.statusmon');
var TRAINER_PATH = path.join(STATE_DIR, 'trainer.json');
var stateDirReady = false;
function loadTrainer() {
  try {
    return JSON.parse(fs.readFileSync(TRAINER_PATH, 'utf8'));
  } catch {
    return null;
  }
}
function saveTrainer(state2) {
  if (!stateDirReady) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    stateDirReady = true;
  }
  const tmp = TRAINER_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state2, null, 2));
  fs.renameSync(tmp, TRAINER_PATH);
}

// scripts/announce.mjs
var state = loadTrainer();
if (state?.pending_announcement) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'Stop',
        systemMessage: state.pending_announcement,
      },
    }),
  );
  delete state.pending_announcement;
  saveTrainer(state);
}
process.exit(0);
