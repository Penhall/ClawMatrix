import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveBackendPath } from '../integrations/shared/runtime/resolve-backend.mjs';

const repoRoot = path.resolve(path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));

function parseArgs(argv) {
  const args = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];

    if (!key.startsWith('--')) {
      continue;
    }

    args.set(key, value && !value.startsWith('--') ? value : 'true');

    if (value && !value.startsWith('--')) {
      index += 1;
    }
  }

  return args;
}

function copyDir(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
  }
}

function render(template, replacements) {
  return Object.entries(replacements).reduce(
    (output, [needle, value]) => output.replaceAll(needle, value),
    template,
  );
}

function upsertMarketplace(marketplacePath) {
  const initial = {
    name: 'clawmatrix-local',
    interface: {
      displayName: 'ClawMatrix Local Plugins',
    },
    plugins: [],
  };

  const marketplace = fs.existsSync(marketplacePath)
    ? JSON.parse(fs.readFileSync(marketplacePath, 'utf8'))
    : initial;

  const entry = {
    name: 'clawmatrix',
    source: {
      source: 'local',
      path: './plugins/clawmatrix',
    },
    policy: {
      installation: 'AVAILABLE',
      authentication: 'ON_INSTALL',
    },
    category: 'Productivity',
  };

  const existingIndex = marketplace.plugins.findIndex((plugin) => plugin.name === 'clawmatrix');

  if (existingIndex >= 0) {
    marketplace.plugins[existingIndex] = entry;
  } else {
    marketplace.plugins.push(entry);
  }

  fs.mkdirSync(path.dirname(marketplacePath), { recursive: true });
  fs.writeFileSync(marketplacePath, `${JSON.stringify(marketplace, null, 2)}\n`, 'utf8');
}

export function installCodexPlugin({
  targetRoot = os.homedir(),
  backendPath,
} = {}) {
  const resolvedBackendPath = resolveBackendPath({ repoRoot, backendPath });
  const sourcePluginRoot = path.join(repoRoot, 'plugins', 'clawmatrix');
  const targetPluginRoot = path.join(targetRoot, 'plugins', 'clawmatrix');
  const runnerPath = path.join(targetPluginRoot, 'scripts', 'run-claw.mjs');

  copyDir(sourcePluginRoot, targetPluginRoot);

  const localConfigPath = path.join(targetPluginRoot, '.codex-plugin', 'local.json');
  fs.writeFileSync(
    localConfigPath,
    `${JSON.stringify({ repoRoot, backendPath: resolvedBackendPath }, null, 2)}\n`,
    'utf8',
  );

  const installedSkillPath = path.join(targetPluginRoot, 'skills', 'clawmatrix', 'SKILL.md');
  const renderedSkill = render(fs.readFileSync(installedSkillPath, 'utf8'), {
    '{{PLUGIN_RUNNER_COMMAND}}': `node "${runnerPath}"`,
  });
  fs.writeFileSync(installedSkillPath, renderedSkill, 'utf8');

  const marketplacePath = path.join(targetRoot, '.agents', 'plugins', 'marketplace.json');
  upsertMarketplace(marketplacePath);

  return {
    targetPluginRoot,
    marketplacePath,
    backendPath: resolvedBackendPath,
  };
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const result = installCodexPlugin({
      targetRoot: args.get('--target-root') ?? undefined,
      backendPath: args.get('--backend-path') ?? undefined,
    });

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
