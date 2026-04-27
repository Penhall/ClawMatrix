import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const pluginRoot = path.resolve(path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const localConfigPath = path.join(pluginRoot, '.codex-plugin', 'local.json');

if (!fs.existsSync(localConfigPath)) {
  console.error('ClawMatrix Codex plugin is not configured. Run "pnpm setup:codex" from the ClawMatrix repository.');
  process.exit(1);
}

const localConfig = JSON.parse(fs.readFileSync(localConfigPath, 'utf8'));
const child = spawnSync(process.execPath, [localConfig.backendPath, ...process.argv.slice(2)], {
  stdio: 'inherit',
});

process.exit(child.status ?? 1);
