import { loadTrainer, saveTrainer } from '../lib/trainer.mjs';
import {
  computeLevel,
  tokensToXp,
  checkEvolution,
  shouldRelease,
  newEncounter,
  resolveSpeciesMeta,
  GEN_CAPS,
} from '../lib/evolution.mjs';
import {
  renderSprite,
  inlineSprite,
  supportsInlineImages,
} from '../lib/sprite.mjs';
import { recordPokemon } from '../lib/pokedex.mjs';

const TYPE_EMOJI = {
  normal: '⬜',
  fire: '🔥',
  water: '💧',
  grass: '🌿',
  electric: '⚡',
  ice: '❄️',
  fighting: '🥊',
  poison: '☠️',
  ground: '🌍',
  flying: '🪽',
  psychic: '🔮',
  bug: '🐛',
  rock: '🪨',
  ghost: '👻',
  dragon: '🐉',
  dark: '🌑',
  steel: '⚙️',
  fairy: '🧚',
};

const G = '\x1b[32m',
  Y = '\x1b[33m',
  C = '\x1b[36m',
  DIM = '\x1b[2m',
  RESET = '\x1b[0m';

let input = '';
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  main().catch((e) => process.stderr.write(`statusmon: ${e.message}\n`));
});

async function main() {
  const state = loadTrainer();
  if (!state || !state.species) {
    console.log(' ❓ MissingNo. Lv.???');
    console.log('    ??? · Run /pokemon to get started');
    process.exit(0);
    return;
  }

  // Compute level from banked XP + live session tokens
  let session = {};
  try {
    session = JSON.parse(input);
  } catch {}
  const totalTokens =
    (session.context_window?.total_input_tokens || 0) +
    (session.context_window?.total_output_tokens || 0);

  const sessionXp = tokensToXp(totalTokens);
  const level = computeLevel((state.banked_xp || 0) + sessionXp);

  // Persist session tokens periodically so session-start can bank them
  if (totalTokens - (state.last_session_tokens || 0) >= 10000) {
    state.last_session_tokens = totalTokens;
    saveTrainer(state);
  }

  // Check evolution/release when level crosses threshold
  const stages = state.stages || [];
  if (stages.length > 0 && level >= (state.target_level || 30)) {
    try {
      const evolved = checkEvolution(state.species, level, stages);
      if (evolved) {
        const oldName = capitalize(state.species);
        const meta = await resolveSpeciesMeta(
          evolved.speciesId,
          evolved.species,
          stages,
        );
        Object.assign(state, {
          species: evolved.species,
          species_id: evolved.speciesId,
          just_evolved: true,
          types: meta.types,
          genus: meta.genus,
          target_level: meta.targetLevel,
          release_level: meta.releaseLevel,
          is_final: meta.isFinal,
        });
        saveTrainer(state);

        try {
          const sprite = await renderSprite(evolved.speciesId);
          console.log(
            `\n  What? ${oldName} is evolving!\n\n${sprite}\n\n  Congratulations! ${oldName} evolved into ${capitalize(evolved.species)}!\n`,
          );
        } catch {
          console.log(
            `\n  What? ${oldName} is evolving!\n\n  Congratulations! ${oldName} evolved into ${capitalize(evolved.species)}!\n`,
          );
        }
        await render(state, level);
        process.exit(0);
        return;
      }

      if (shouldRelease(state.species, level, stages)) {
        recordPokemon({ ...state, level });
        const gen = state.generation || 1;
        const maxSpecies = GEN_CAPS[Math.min(gen, GEN_CAPS.length) - 1];
        const encounter = await newEncounter(maxSpecies);
        const newState = {
          ...state,
          chain_id: encounter.chainId,
          species: encounter.species,
          species_id: encounter.speciesId,
          started_species: encounter.species,
          started_species_id: encounter.speciesId,
          banked_xp: 0,
          last_session_tokens: 0,
          just_evolved: false,
          types: encounter.types,
          genus: encounter.genus,
          target_level: encounter.targetLevel,
          release_level: encounter.releaseLevel,
          is_final: encounter.isFinal,
          stages: encounter.stages,
          dex_count: (state.dex_count || 0) + 1,
        };
        saveTrainer(newState);

        try {
          const sprite = await renderSprite(encounter.speciesId);
          console.log(
            `\n  A wild ${capitalize(encounter.species)} appeared!\n\n${sprite}\n\n  Your new companion awaits...\n`,
          );
        } catch {
          console.log(
            `\n  A wild ${capitalize(encounter.species)} appeared!\n\n  Your new companion awaits...\n`,
          );
        }
        await render(newState, 1);
        process.exit(0);
        return;
      }
    } catch (e) {
      process.stderr.write(`statusmon evolution: ${e.message}\n`);
    }
  }

  // Clear sparkle after one render
  if (state.just_evolved) {
    state.just_evolved = false;
    saveTrainer(state);
  }

  await render(state, level);
  process.exit(0);
}

// Cached inline sprite for the current Pokemon (generated once per process)
let cachedInline = null;
let cachedInlineId = null;

async function render(state, level) {
  const name = capitalize(state.species);
  const typeStr = (state.types || ['normal']).map(capitalize).join('/');
  const genus = state.genus || 'Pokémon';
  const indicator = state.just_evolved ? ' ✨' : state.is_final ? ' ★' : '';
  const releaseLevel = state.release_level || 60;

  const pct = Math.min(1, level / releaseLevel);
  const barW = 12;
  const filled = Math.round(pct * barW);
  const barColor = pct > 0.5 ? G : pct > 0.25 ? Y : C;
  const barStr = `  ${barColor}${'█'.repeat(filled)}${'░'.repeat(barW - filled)}${RESET} → Lv.${releaseLevel}`;

  const dexStr = state.dex_count > 0 ? ` · #${state.dex_count}` : '';

  // Use inline PNG sprite if terminal supports it, otherwise type emoji
  let icon = TYPE_EMOJI[state.types?.[0]] || '❓';
  if (supportsInlineImages()) {
    try {
      if (cachedInlineId !== state.species_id) {
        cachedInline = await inlineSprite(state.species_id);
        cachedInlineId = state.species_id;
      }
      icon = cachedInline;
    } catch {}
  }

  console.log(` ${icon} ${name}${indicator} Lv.${level}${barStr}`);
  console.log(`    ${DIM}${typeStr} · ${genus}${dexStr}${RESET}`);
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
