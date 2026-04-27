import fs from 'node:fs';
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

function render(template, replacements) {
  return Object.entries(replacements).reduce(
    (output, [needle, value]) => output.replaceAll(needle, value),
    template,
  );
}

export function installClaudeSkill({
  targetDir = path.join(repoRoot, '.claude', 'skills', 'clawmatrix'),
  backendPath,
} = {}) {
  const resolvedBackendPath = resolveBackendPath({ repoRoot, backendPath });
  const sourceSkillPath = path.join(repoRoot, 'integrations', 'claude-code', 'skill', 'SKILL.md');
  const renderedSkill = render(fs.readFileSync(sourceSkillPath, 'utf8'), {
    '{{CLAW_BACKEND_COMMAND}}': `node "${resolvedBackendPath}"`,
  });

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'SKILL.md'), renderedSkill, 'utf8');

  return {
    targetDir,
    backendPath: resolvedBackendPath,
  };
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const result = installClaudeSkill({
      targetDir: args.get('--target-dir') ?? undefined,
      backendPath: args.get('--backend-path') ?? undefined,
    });

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
