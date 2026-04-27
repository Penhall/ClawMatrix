import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { installClaudeSkill } from './setup-claude-code.mjs';
import { installCodexPlugin } from './setup-codex.mjs';

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

export function setupIntegrations({
  backendPath,
  claudeTargetDir,
  codexTargetRoot,
} = {}) {
  const claude = installClaudeSkill({
    backendPath,
    targetDir: claudeTargetDir,
  });

  const codex = installCodexPlugin({
    backendPath,
    targetRoot: codexTargetRoot,
  });

  return { claude, codex };
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const result = setupIntegrations({
      backendPath: args.get('--backend-path') ?? undefined,
      claudeTargetDir: args.get('--claude-target-dir') ?? undefined,
      codexTargetRoot: args.get('--codex-target-root') ?? undefined,
    });

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
