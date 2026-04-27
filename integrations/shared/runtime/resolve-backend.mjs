import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_BACKEND_PATH = path.join('packages', 'cli', 'dist', 'index.js');
const MISSING_BUILD_MESSAGE =
  'Compiled ClawMatrix CLI backend not found. Run "pnpm install" and "pnpm build" before installing integrations.';

function isRepoRoot(candidateDir) {
  return (
    existsSync(path.join(candidateDir, 'package.json')) &&
    existsSync(path.join(candidateDir, 'pnpm-workspace.yaml'))
  );
}

export function findRepoRoot(startDir = process.cwd()) {
  let currentDir = path.resolve(startDir);

  if (existsSync(currentDir) && !statSync(currentDir).isDirectory()) {
    currentDir = path.dirname(currentDir);
  }

  while (true) {
    if (isRepoRoot(currentDir)) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      throw new Error(`Unable to find ClawMatrix repository root from "${startDir}".`);
    }

    currentDir = parentDir;
  }
}

export function resolveBackendPath({ repoRoot = findRepoRoot(), backendPath } = {}) {
  const candidatePath = backendPath
    ? path.resolve(repoRoot, backendPath)
    : path.join(repoRoot, DEFAULT_BACKEND_PATH);

  if (!existsSync(candidatePath)) {
    throw new Error(MISSING_BUILD_MESSAGE);
  }

  return candidatePath;
}

export function createBackendCommand(options = {}) {
  const resolvedBackendPath = resolveBackendPath(options);

  return ['node', resolvedBackendPath];
}

export function runtimeSummary(options = {}) {
  const repoRoot = options.repoRoot ?? findRepoRoot();
  const backendPath = resolveBackendPath({ ...options, repoRoot });

  return {
    repoRoot,
    backendPath,
    command: `node "${backendPath}"`,
  };
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  const summary = runtimeSummary();
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

export { DEFAULT_BACKEND_PATH, MISSING_BUILD_MESSAGE };
