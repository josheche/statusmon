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

function getPixel(data, width, x, y) {
  const idx = (y * width + x) * 4;
  return { r: data[idx], g: data[idx + 1], b: data[idx + 2], a: data[idx + 3] };
}

// Test: render Charmander if run directly
if (process.argv[1] && process.argv[1].endsWith('sprite.mjs')) {
  const id = parseInt(process.argv[2] || '4', 10); // default: Charmander
  renderSprite(id).then((art) => {
    console.log(art);
    console.log(`\n  Sprite #${id} rendered at terminal resolution`);
  }).catch(console.error);
}
