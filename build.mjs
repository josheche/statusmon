import esbuild from 'esbuild';
import fs from 'fs';

// Clean before build
fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist', { recursive: true });

await esbuild.build({
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node18',
  outdir: 'dist',
  outExtension: { '.js': '.mjs' },
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
  entryPoints: ['scripts/statusline.mjs', 'scripts/session-start.mjs'],
});

// Copy built files to plugin distribution
fs.mkdirSync('plugin/scripts', { recursive: true });
for (const f of fs.readdirSync('dist')) {
  fs.copyFileSync(`dist/${f}`, `plugin/scripts/${f}`);
}

console.log('Build complete → dist/ + plugin/scripts/');
