import https from 'https';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CACHE_DIR = path.join(os.homedir(), '.statusmon', 'cache');
let cacheDirReady = false;

function ensureCacheDir() {
  if (cacheDirReady) return;
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  cacheDirReady = true;
}

export async function fetchSprite(pokemonId) {
  ensureCacheDir();
  const pngPath = path.join(CACHE_DIR, `sprite-${pokemonId}.png`);
  if (fs.existsSync(pngPath)) {
    return fs.readFileSync(pngPath);
  }
  const buf = await fetchRaw(
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`,
  );
  fs.writeFileSync(pngPath, buf);
  return buf;
}

function fetchRaw(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          return fetchRaw(res.headers.location).then(resolve, reject);
        }
        if (res.statusCode >= 400) {
          return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
        }
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}
