#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pkg = JSON.parse(
  fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
);
const version = pkg.version;

// Sync plugin.json
const pluginPath = path.join(root, '.claude-plugin', 'plugin.json');
const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
plugin.version = version;
fs.writeFileSync(pluginPath, JSON.stringify(plugin, null, 2) + '\n');

// Sync marketplace.json
const marketplacePath = path.join(root, '.claude-plugin', 'marketplace.json');
const marketplace = JSON.parse(fs.readFileSync(marketplacePath, 'utf8'));
marketplace.plugins[0].version = version;
fs.writeFileSync(marketplacePath, JSON.stringify(marketplace, null, 2) + '\n');

console.log(`Synced version → ${version}`);
