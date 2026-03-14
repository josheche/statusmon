import { PNG } from 'pngjs';
import { fetchSprite } from './cache.mjs';

// Convert a Pokemon sprite PNG to ANSI half-block terminal art.
// Uses ▀ (upper half block) with foreground = top pixel, background = bottom pixel.
// Each character cell represents 2 vertical pixels.
export async function renderSprite(pokemonId, maxWidth = 32) {
  const buffer = await fetchSprite(pokemonId);
  const png = PNG.sync.read(buffer);
  const { width, height, data } = png;

  // Scale factor to fit within maxWidth
  const scale = Math.max(1, Math.ceil(width / maxWidth));
  const scaledW = Math.floor(width / scale);
  const scaledH = Math.floor(height / scale);
  // Ensure even height for half-block pairing
  const evenH = scaledH - (scaledH % 2);

  const lines = [];
  for (let y = 0; y < evenH; y += 2) {
    let line = '';
    for (let x = 0; x < scaledW; x++) {
      const top = getPixel(data, width, x * scale, y * scale);
      const bot = getPixel(data, width, x * scale, (y + 1) * scale);

      if (top.a < 64 && bot.a < 64) {
        line += ' ';
      } else if (top.a < 64) {
        line += `\x1b[38;2;${bot.r};${bot.g};${bot.b}m▄\x1b[0m`;
      } else if (bot.a < 64) {
        line += `\x1b[38;2;${top.r};${top.g};${top.b}m▀\x1b[0m`;
      } else {
        line += `\x1b[38;2;${top.r};${top.g};${top.b};48;2;${bot.r};${bot.g};${bot.b}m▀\x1b[0m`;
      }
    }
    lines.push(line);
  }

  // Trim empty lines from top and bottom
  while (lines.length > 0 && lines[0].trim() === '') lines.shift();
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();

  return lines.join('\n');
}

// Generate an iTerm2/WezTerm inline image escape sequence for a Pokemon sprite.
// Embeds a downscaled PNG directly in terminal output (OSC 1337 protocol).
export async function inlineSprite(pokemonId, size = 32) {
  const buffer = await fetchSprite(pokemonId);
  const src = PNG.sync.read(buffer);

  // Downscale to target size
  const dst = new PNG({ width: size, height: size });
  const scale = src.width / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const srcIdx =
        (Math.floor(y * scale) * src.width + Math.floor(x * scale)) * 4;
      const dstIdx = (y * size + x) * 4;
      dst.data[dstIdx] = src.data[srcIdx];
      dst.data[dstIdx + 1] = src.data[srcIdx + 1];
      dst.data[dstIdx + 2] = src.data[srcIdx + 2];
      dst.data[dstIdx + 3] = src.data[srcIdx + 3];
    }
  }

  const pngBuf = PNG.sync.write(dst);
  const b64 = pngBuf.toString('base64');
  return `\x1b]1337;File=inline=1;width=2;height=1;preserveAspectRatio=1:${b64}\x07`;
}

// Check if the current terminal supports inline images (iTerm2, WezTerm, Kitty)
export function supportsInlineImages() {
  const term = process.env.TERM_PROGRAM || '';
  return /iterm|wezterm/i.test(term);
}

function getPixel(data, width, x, y) {
  const idx = (y * width + x) * 4;
  return { r: data[idx], g: data[idx + 1], b: data[idx + 2], a: data[idx + 3] };
}

// Test: render sprite if run directly
if (process.argv[1] && process.argv[1].endsWith('sprite.mjs')) {
  const id = parseInt(process.argv[2] || '4', 10);
  const mode = process.argv[3] || 'ansi';
  if (mode === 'inline') {
    inlineSprite(id)
      .then((seq) => {
        process.stdout.write(seq + '\n');
      })
      .catch(console.error);
  } else {
    renderSprite(id)
      .then((art) => {
        console.log(art);
      })
      .catch(console.error);
  }
}
