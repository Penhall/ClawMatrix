# ClawMatrix Integrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a unified integration layer for Claude Code and Codex that uses the compiled `claw` CLI as the only TRIZ backend.

**Architecture:** Keep `@claw/engine` and `@claw/cli` unchanged as the domain/runtime core, then add thin integration artifacts around them: shared backend resolution, Claude-facing skill content, Codex-facing plugin assets, setup scripts, and lightweight integration tests. All install flows must fail clearly when `packages/cli/dist/index.js` is missing and must never duplicate TRIZ logic in prompts.

**Tech Stack:** Node.js ESM scripts (`.mjs`), existing pnpm monorepo, existing Vitest package tests, Node built-in test runner for integration checks, Markdown docs, Codex plugin manifest JSON.

---

## File Map

- Modify: `package.json`
  - Add root setup commands and a root integration test command.
- Modify: `CLAUDE.md`
  - Document the project-local Claude Code skill after setup.
- Modify: `README.md`
  - Add an "Agent Integrations" section pointing to the new install docs.
- Modify: `README.pt-BR.md`
  - Add the PT-BR equivalent section and links.
- Create: `integrations/shared/runtime/resolve-backend.mjs`
  - Resolve repo root, validate the compiled CLI, and expose a reusable runtime summary.
- Create: `integrations/claude-code/skill/SKILL.md`
  - Claude Code skill template with command routing and backend placeholders.
- Create: `integrations/claude-code/docs/README.md`
  - Claude-specific install and troubleshooting instructions.
- Create: `integrations/claude-code/templates/settings.local.json`
  - Optional permission template for local Claude Code usage.
- Create: `plugins/clawmatrix/.codex-plugin/plugin.json`
  - Codex plugin manifest.
- Create: `plugins/clawmatrix/skills/clawmatrix/SKILL.md`
  - Codex skill template rendered by the installer.
- Create: `plugins/clawmatrix/docs/README.md`
  - Codex plugin usage and local install notes.
- Create: `plugins/clawmatrix/scripts/run-claw.mjs`
  - Thin local runner that reads installed config and proxies to the compiled CLI.
- Create: `.agents/plugins/marketplace.json`
  - Repo-local marketplace entry for the bundled Codex plugin.
- Create: `scripts/setup-claude-code.mjs`
  - Install the Claude skill into a target `.claude/skills/clawmatrix/` directory.
- Create: `scripts/setup-codex.mjs`
  - Install the Codex plugin into a target home-style root and upsert marketplace metadata.
- Create: `scripts/setup-integrations.mjs`
  - Run both setup flows in one command.
- Create: `docs/integrations/README.md`
  - Shared manual install guide and command map.
- Create: `docs/integrations/troubleshooting.md`
  - Shared failure modes, especially missing build artifacts.
- Create: `tests/integrations/helpers/fs-fixture.mjs`
  - Shared temp-dir helpers for Node integration tests.
- Create: `tests/integrations/backend-resolver.test.mjs`
  - Validate clear backend resolution and failure messaging.
- Create: `tests/integrations/claude-setup.test.mjs`
  - Validate Claude setup failure and success flows.
- Create: `tests/integrations/plugin-manifest.test.mjs`
  - Validate Codex plugin manifest shape.
- Create: `tests/integrations/codex-setup.test.mjs`
  - Validate Codex setup, rendered skill, and marketplace entry.
- Create: `tests/integrations/setup-integrations.test.mjs`
  - Validate the unified setup command path.

### Task 1: Shared Runtime Foundation

**Files:**
- Create: `tests/integrations/helpers/fs-fixture.mjs`
- Create: `tests/integrations/backend-resolver.test.mjs`
- Create: `integrations/shared/runtime/resolve-backend.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing temp-fixture helper and backend resolver test**

```js
// tests/integrations/helpers/fs-fixture.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, 'utf8');
}

export function createRepoFixture(prefix = 'clawmatrix-repo-') {
  const repoRoot = makeTempDir(prefix);
  writeFile(path.join(repoRoot, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n');
  return repoRoot;
}

export function createBackendFixture(repoRoot, source = "console.log('claw ok');\n") {
  const backendPath = path.join(repoRoot, 'packages', 'cli', 'dist', 'index.js');
  writeFile(backendPath, source);
  return backendPath;
}
```

```js
// tests/integrations/backend-resolver.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { createBackendFixture, createRepoFixture } from './helpers/fs-fixture.mjs';
import {
  createBackendCommand,
  resolveBackendPath,
  runtimeSummary,
} from '../../integrations/shared/runtime/resolve-backend.mjs';

test('resolveBackendPath throws with build instructions when dist is missing', () => {
  const repoRoot = createRepoFixture();

  assert.throws(
    () => resolveBackendPath({ repoRoot }),
    /pnpm install" and "pnpm build"/,
  );
});

test('runtimeSummary returns repo root, backend path, and node command when dist exists', () => {
  const repoRoot = createRepoFixture();
  const backendPath = createBackendFixture(repoRoot);

  assert.equal(resolveBackendPath({ repoRoot }), backendPath);
  assert.deepEqual(createBackendCommand({ repoRoot }), ['node', backendPath]);
  assert.deepEqual(runtimeSummary({ repoRoot }), {
    repoRoot,
    backendPath,
    command: `node "${backendPath}"`,
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/integrations/backend-resolver.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `integrations/shared/runtime/resolve-backend.mjs`

- [ ] **Step 3: Implement the shared backend resolver**

```js
// integrations/shared/runtime/resolve-backend.mjs
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const DEFAULT_BACKEND = path.join('packages', 'cli', 'dist', 'index.js');

export function findRepoRoot(startDir = process.cwd()) {
  let current = path.resolve(startDir);

  while (true) {
    if (fs.existsSync(path.join(current, 'pnpm-workspace.yaml'))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error(`Could not find ClawMatrix repository root from ${startDir}`);
    }

    current = parent;
  }
}

export function resolveBackendPath({ repoRoot = findRepoRoot(), backendPath } = {}) {
  const resolved = backendPath ? path.resolve(backendPath) : path.join(repoRoot, DEFAULT_BACKEND);

  if (!fs.existsSync(resolved)) {
    throw new Error(
      `ClawMatrix CLI build not found at ${resolved}. Run "pnpm install" and "pnpm build" before installing integrations.`,
    );
  }

  return resolved;
}

export function createBackendCommand(options = {}) {
  const resolved = resolveBackendPath(options);
  return ['node', resolved];
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
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  console.log(JSON.stringify(runtimeSummary(), null, 2));
}
```

- [ ] **Step 4: Expose root integration commands in `package.json`**

```json
{
  "name": "claw-matrix-root",
  "private": true,
  "scripts": {
    "test": "pnpm -r test && node --test tests/integrations/*.test.mjs",
    "test:coverage": "pnpm -r test:coverage",
    "test:integrations": "node --test tests/integrations/*.test.mjs",
    "build": "pnpm -r build",
    "typecheck": "pnpm -r typecheck",
    "setup:claude-code": "node scripts/setup-claude-code.mjs",
    "setup:codex": "node scripts/setup-codex.mjs",
    "setup:integrations": "node scripts/setup-integrations.mjs"
  },
  "devDependencies": {
    "tsx": "^4.21.0"
  }
}
```

- [ ] **Step 5: Run the resolver test again**

Run: `node --test tests/integrations/backend-resolver.test.mjs`

Expected: PASS with both resolver tests green

- [ ] **Step 6: Commit**

```bash
git add package.json integrations/shared/runtime/resolve-backend.mjs tests/integrations/helpers/fs-fixture.mjs tests/integrations/backend-resolver.test.mjs
git commit -m "feat: add integration backend resolver"
```

### Task 2: Claude Code Skill and Installer

**Files:**
- Create: `tests/integrations/claude-setup.test.mjs`
- Create: `integrations/claude-code/skill/SKILL.md`
- Create: `integrations/claude-code/docs/README.md`
- Create: `integrations/claude-code/templates/settings.local.json`
- Create: `scripts/setup-claude-code.mjs`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Write the failing Claude setup test**

```js
// tests/integrations/claude-setup.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { createBackendFixture, makeTempDir } from './helpers/fs-fixture.mjs';

const scriptPath = path.resolve('scripts/setup-claude-code.mjs');

test('setup-claude-code fails with actionable build instructions when backend is missing', () => {
  const targetDir = path.join(makeTempDir('clawmatrix-claude-missing-'), '.claude', 'skills', 'clawmatrix');
  const missingBackend = path.join(makeTempDir('clawmatrix-claude-backend-'), 'missing.js');

  const result = spawnSync(process.execPath, [scriptPath, '--target-dir', targetDir, '--backend-path', missingBackend], {
    encoding: 'utf8',
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /pnpm install/);
  assert.match(result.stderr, /pnpm build/);
});

test('setup-claude-code renders the skill with the resolved backend command', () => {
  const repoRoot = makeTempDir('clawmatrix-claude-success-');
  const backendPath = createBackendFixture(repoRoot);
  const targetDir = path.join(makeTempDir('clawmatrix-claude-target-'), '.claude', 'skills', 'clawmatrix');

  const result = spawnSync(process.execPath, [scriptPath, '--target-dir', targetDir, '--backend-path', backendPath], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 0);

  const installedSkill = fs.readFileSync(path.join(targetDir, 'SKILL.md'), 'utf8');
  assert.match(installedSkill, /claw matrix/);
  assert.match(installedSkill, new RegExp(backendPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/integrations/claude-setup.test.mjs`

Expected: FAIL with `Cannot find module` for `scripts/setup-claude-code.mjs`

- [ ] **Step 3: Create the Claude skill source, docs, and settings template**

```markdown
<!-- integrations/claude-code/skill/SKILL.md -->
---
name: clawmatrix
description: Use ClawMatrix for TRIZ contradiction mapping, IFR framing, principle lookup, stack audits, and guided solve workflows.
---

# ClawMatrix

Use this skill when the user asks for:
- TRIZ principles for a contradiction between two engineering parameters
- a principle explanation by id
- an IFR statement
- a codebase or stack audit for hidden contradictions
- a five-step TRIZ workflow for a concrete system/problem pair

## Runtime Contract

All authoritative answers must come from the compiled ClawMatrix CLI:

```bash
{{CLAW_BACKEND_COMMAND}}
```

If the backend command fails because the build is missing, stop and instruct the user to run:

```bash
pnpm install
pnpm build
```

## Command Routing

Contradiction lookup:

```bash
{{CLAW_BACKEND_COMMAND}} matrix --improve <id> --worsen <id> --lang <pt|en>
```

Principle lookup:

```bash
{{CLAW_BACKEND_COMMAND}} concept --principle <id> --lang <pt|en>
```

IFR generation:

```bash
{{CLAW_BACKEND_COMMAND}} ifr --goal "<goal>" --lang <pt|en>
```

Project audit:

```bash
{{CLAW_BACKEND_COMMAND}} audit --dir <path> --lang <pt|en>
```

Guided solve flow:

```bash
{{CLAW_BACKEND_COMMAND}} solve --system "<system>" --problem "<problem>" --lang <pt|en>
```

## Output Rules

- Prefer formatted text for direct human answers.
- Prefer `--json` when the response will be transformed, summarized, or cross-referenced programmatically.
- Preserve `--lang en` when the user asked for English output.
- Add `--no-color` when the command output will be embedded verbatim into another tool response.
```

```markdown
<!-- integrations/claude-code/docs/README.md -->
# Claude Code Integration

## Manual Install

1. Run `pnpm install`
2. Run `pnpm build`
3. Copy `integrations/claude-code/skill/SKILL.md` into `.claude/skills/clawmatrix/SKILL.md`
4. Replace `{{CLAW_BACKEND_COMMAND}}` with `node "<absolute-path-to-repo>/packages/cli/dist/index.js"`

## Automated Install

```bash
node scripts/setup-claude-code.mjs
```

This installs the rendered skill into `.claude/skills/clawmatrix/SKILL.md`.

## Troubleshooting

- If setup fails with a missing backend message, run `pnpm install` and `pnpm build`.
- If the skill exists but commands fail, verify that `packages/cli/dist/index.js` exists.
- If you need structured output for downstream processing, add `--json` to the subcommand.
```

```json
// integrations/claude-code/templates/settings.local.json
{
  "permissions": {
    "allow": [
      "Bash(node packages/cli/dist/index.js *)",
      "Bash(pnpm install)",
      "Bash(pnpm build)",
      "Bash(pnpm test)"
    ]
  }
}
```

- [ ] **Step 4: Implement the Claude installer**

```js
// scripts/setup-claude-code.mjs
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

    if (key.startsWith('--')) {
      args.set(key, value && !value.startsWith('--') ? value : 'true');
      if (value && !value.startsWith('--')) {
        index += 1;
      }
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
  const resolvedBackend = resolveBackendPath({ repoRoot, backendPath });
  const sourceSkillPath = path.join(repoRoot, 'integrations', 'claude-code', 'skill', 'SKILL.md');
  const renderedSkill = render(fs.readFileSync(sourceSkillPath, 'utf8'), {
    '{{CLAW_BACKEND_COMMAND}}': `node "${resolvedBackend}"`,
  });

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'SKILL.md'), renderedSkill, 'utf8');

  return {
    targetDir,
    backendPath: resolvedBackend,
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
```

- [ ] **Step 5: Document the installed Claude skill in `CLAUDE.md`**

```markdown
# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project

ClawMatrix — TRIZ CLI tool implementing the Altshuller Contradiction Matrix (39×39).

## Architecture

pnpm monorepo with two packages:
- `@claw/engine` — pure TypeScript logic (no I/O except analyzeProject)
- `@claw/cli` — Commander.js CLI, binary `claw`

## Commands

```
pnpm test          # run all tests (engine + cli E2E + integration checks)
pnpm build         # build both packages
pnpm typecheck     # TypeScript check
pnpm setup:claude-code
pnpm setup:codex
```

## Local Claude Skill

After running `pnpm setup:claude-code`, the project-local skill is installed at `.claude/skills/clawmatrix/SKILL.md`.
Use that skill whenever the task is best served by `claw matrix`, `claw concept`, `claw ifr`, `claw audit`, or `claw solve`.

## Key invariant

`packages/engine/src/data/matrix.json` must have exactly 1521 cells. Matrix integrity tests run before build and fail if violated.

## Test runner

Vitest. Engine tests are pure unit tests. CLI tests are E2E subprocess tests via execSync + tsx. Integration tests use the Node built-in test runner.
```

- [ ] **Step 6: Run the Claude setup test again**

Run: `node --test tests/integrations/claude-setup.test.mjs`

Expected: PASS with both failure-path and success-path checks green

- [ ] **Step 7: Commit**

```bash
git add CLAUDE.md integrations/claude-code/skill/SKILL.md integrations/claude-code/docs/README.md integrations/claude-code/templates/settings.local.json scripts/setup-claude-code.mjs tests/integrations/claude-setup.test.mjs
git commit -m "feat: add Claude Code integration"
```

### Task 3: Codex Plugin, Marketplace, and Installer

**Files:**
- Create: `tests/integrations/plugin-manifest.test.mjs`
- Create: `tests/integrations/codex-setup.test.mjs`
- Create: `plugins/clawmatrix/.codex-plugin/plugin.json`
- Create: `plugins/clawmatrix/skills/clawmatrix/SKILL.md`
- Create: `plugins/clawmatrix/docs/README.md`
- Create: `plugins/clawmatrix/scripts/run-claw.mjs`
- Create: `.agents/plugins/marketplace.json`
- Create: `scripts/setup-codex.mjs`

- [ ] **Step 1: Write the failing Codex manifest and installer tests**

```js
// tests/integrations/plugin-manifest.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const manifestPath = path.resolve('plugins/clawmatrix/.codex-plugin/plugin.json');

test('plugin manifest contains the minimum Codex metadata', () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  assert.equal(manifest.name, 'clawmatrix');
  assert.equal(manifest.skills, './skills/');
  assert.equal(manifest.repository, 'https://github.com/Penhall/ClawMatrix');
  assert.ok(Array.isArray(manifest.interface.defaultPrompt));
  assert.ok(manifest.interface.defaultPrompt.length <= 3);
});
```

```js
// tests/integrations/codex-setup.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { createBackendFixture, makeTempDir } from './helpers/fs-fixture.mjs';

const scriptPath = path.resolve('scripts/setup-codex.mjs');

test('setup-codex fails with actionable build instructions when backend is missing', () => {
  const targetRoot = makeTempDir('clawmatrix-codex-missing-');
  const missingBackend = path.join(makeTempDir('clawmatrix-codex-backend-'), 'missing.js');

  const result = spawnSync(process.execPath, [scriptPath, '--target-root', targetRoot, '--backend-path', missingBackend], {
    encoding: 'utf8',
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /pnpm install/);
  assert.match(result.stderr, /pnpm build/);
});

test('setup-codex installs a rendered plugin and marketplace entry', () => {
  const repoRoot = makeTempDir('clawmatrix-codex-success-');
  const backendPath = createBackendFixture(repoRoot);
  const targetRoot = makeTempDir('clawmatrix-codex-target-');

  const result = spawnSync(process.execPath, [scriptPath, '--target-root', targetRoot, '--backend-path', backendPath], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 0);

  const localConfigPath = path.join(targetRoot, 'plugins', 'clawmatrix', '.codex-plugin', 'local.json');
  const marketplacePath = path.join(targetRoot, '.agents', 'plugins', 'marketplace.json');
  const installedSkillPath = path.join(targetRoot, 'plugins', 'clawmatrix', 'skills', 'clawmatrix', 'SKILL.md');

  assert.equal(JSON.parse(fs.readFileSync(localConfigPath, 'utf8')).backendPath, backendPath);
  assert.match(fs.readFileSync(installedSkillPath, 'utf8'), /run-claw\.mjs/);
  assert.equal(JSON.parse(fs.readFileSync(marketplacePath, 'utf8')).plugins[0].name, 'clawmatrix');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/integrations/plugin-manifest.test.mjs tests/integrations/codex-setup.test.mjs`

Expected: FAIL because `plugin.json` and `scripts/setup-codex.mjs` do not exist yet

- [ ] **Step 3: Create the Codex plugin assets**

```json
// plugins/clawmatrix/.codex-plugin/plugin.json
{
  "name": "clawmatrix",
  "version": "0.1.0",
  "description": "TRIZ contradiction matrix, IFR, audit, and solve workflows for Codex.",
  "author": {
    "name": "Penhall",
    "url": "https://github.com/Penhall"
  },
  "homepage": "https://github.com/Penhall/ClawMatrix/tree/master/docs/integrations",
  "repository": "https://github.com/Penhall/ClawMatrix",
  "license": "UNLICENSED",
  "keywords": ["triz", "engineering", "problem-solving", "cli", "innovation"],
  "skills": "./skills/",
  "interface": {
    "displayName": "ClawMatrix",
    "shortDescription": "TRIZ workflows backed by the ClawMatrix CLI.",
    "longDescription": "Uses the compiled ClawMatrix CLI to analyze contradictions, IFRs, audits, and guided solve flows without duplicating TRIZ logic.",
    "developerName": "Penhall",
    "category": "Productivity",
    "capabilities": ["Interactive", "CLI"],
    "websiteURL": "https://github.com/Penhall/ClawMatrix",
    "defaultPrompt": [
      "Find TRIZ principles for faster APIs without losing reliability.",
      "Generate an IFR for passwordless authentication.",
      "Audit this codebase for hidden engineering contradictions."
    ],
    "brandColor": "#0F766E"
  }
}
```

```markdown
<!-- plugins/clawmatrix/skills/clawmatrix/SKILL.md -->
---
name: clawmatrix
description: Use the ClawMatrix plugin for TRIZ contradiction lookup, IFR generation, principle explanation, audits, and guided solve workflows.
---

# ClawMatrix Plugin

This plugin is only authoritative when it calls the installed runner:

```bash
{{PLUGIN_RUNNER_COMMAND}}
```

Route requests as follows:

- Contradiction lookup:

```bash
{{PLUGIN_RUNNER_COMMAND}} matrix --improve <id> --worsen <id> --lang <pt|en>
```

- Principle lookup:

```bash
{{PLUGIN_RUNNER_COMMAND}} concept --principle <id> --lang <pt|en>
```

- IFR generation:

```bash
{{PLUGIN_RUNNER_COMMAND}} ifr --goal "<goal>" --lang <pt|en>
```

- Project audit:

```bash
{{PLUGIN_RUNNER_COMMAND}} audit --dir <path> --lang <pt|en>
```

- Guided solve flow:

```bash
{{PLUGIN_RUNNER_COMMAND}} solve --system "<system>" --problem "<problem>" --lang <pt|en>
```

Prefer `--json` when the next step needs structured machine-readable output.
```

```markdown
<!-- plugins/clawmatrix/docs/README.md -->
# Codex Plugin Integration

This plugin keeps all TRIZ logic in the compiled ClawMatrix CLI and uses the plugin only as a workflow layer.

## Install

```bash
node scripts/setup-codex.mjs
```

## Manual Notes

- The installer copies the plugin into a Codex-style local root.
- The installer writes `.codex-plugin/local.json` with the resolved backend path.
- The installer updates `.agents/plugins/marketplace.json` with a `clawmatrix` entry.

## Failure Mode

If the installer says the backend build is missing, run:

```bash
pnpm install
pnpm build
```
```

```js
// plugins/clawmatrix/scripts/run-claw.mjs
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
```

```json
// .agents/plugins/marketplace.json
{
  "name": "clawmatrix-local",
  "interface": {
    "displayName": "ClawMatrix Local Plugins"
  },
  "plugins": [
    {
      "name": "clawmatrix",
      "source": {
        "source": "local",
        "path": "./plugins/clawmatrix"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Productivity"
    }
  ]
}
```

- [ ] **Step 4: Implement the Codex installer**

```js
// scripts/setup-codex.mjs
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

    if (key.startsWith('--')) {
      args.set(key, value && !value.startsWith('--') ? value : 'true');
      if (value && !value.startsWith('--')) {
        index += 1;
      }
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
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
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
  const resolvedBackend = resolveBackendPath({ repoRoot, backendPath });
  const sourcePluginRoot = path.join(repoRoot, 'plugins', 'clawmatrix');
  const targetPluginRoot = path.join(targetRoot, 'plugins', 'clawmatrix');
  const runnerPath = path.join(targetPluginRoot, 'scripts', 'run-claw.mjs');

  copyDir(sourcePluginRoot, targetPluginRoot);

  const localConfigPath = path.join(targetPluginRoot, '.codex-plugin', 'local.json');
  fs.writeFileSync(
    localConfigPath,
    `${JSON.stringify({ repoRoot, backendPath: resolvedBackend }, null, 2)}\n`,
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
    backendPath: resolvedBackend,
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
```

- [ ] **Step 5: Run the Codex tests again**

Run: `node --test tests/integrations/plugin-manifest.test.mjs tests/integrations/codex-setup.test.mjs`

Expected: PASS with manifest validation and installer checks green

- [ ] **Step 6: Commit**

```bash
git add .agents/plugins/marketplace.json plugins/clawmatrix/.codex-plugin/plugin.json plugins/clawmatrix/skills/clawmatrix/SKILL.md plugins/clawmatrix/docs/README.md plugins/clawmatrix/scripts/run-claw.mjs scripts/setup-codex.mjs tests/integrations/plugin-manifest.test.mjs tests/integrations/codex-setup.test.mjs
git commit -m "feat: add Codex plugin integration"
```

### Task 4: Shared Docs and Unified Setup

**Files:**
- Create: `tests/integrations/setup-integrations.test.mjs`
- Create: `docs/integrations/README.md`
- Create: `docs/integrations/troubleshooting.md`
- Create: `scripts/setup-integrations.mjs`
- Modify: `README.md`
- Modify: `README.pt-BR.md`

- [ ] **Step 1: Write the failing unified setup test**

```js
// tests/integrations/setup-integrations.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { createBackendFixture, makeTempDir } from './helpers/fs-fixture.mjs';

const scriptPath = path.resolve('scripts/setup-integrations.mjs');

test('setup-integrations installs both Claude and Codex artifacts', () => {
  const repoRoot = makeTempDir('clawmatrix-unified-success-');
  const backendPath = createBackendFixture(repoRoot);
  const claudeTargetDir = path.join(makeTempDir('clawmatrix-unified-claude-'), '.claude', 'skills', 'clawmatrix');
  const codexTargetRoot = makeTempDir('clawmatrix-unified-codex-');

  const result = spawnSync(process.execPath, [
    scriptPath,
    '--backend-path',
    backendPath,
    '--claude-target-dir',
    claudeTargetDir,
    '--codex-target-root',
    codexTargetRoot,
  ], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 0);
  assert.equal(fs.existsSync(path.join(claudeTargetDir, 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(codexTargetRoot, 'plugins', 'clawmatrix', '.codex-plugin', 'local.json')), true);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/integrations/setup-integrations.test.mjs`

Expected: FAIL with `Cannot find module` for `scripts/setup-integrations.mjs`

- [ ] **Step 3: Write the shared docs and unified installer**

```markdown
<!-- docs/integrations/README.md -->
# Agent Integrations

ClawMatrix ships two agent-facing integration layers:

- Claude Code skill: project-local skill rendered into `.claude/skills/clawmatrix/`
- Codex plugin: local plugin rendered into a Codex-style plugin root with marketplace metadata

## Prerequisites

```bash
pnpm install
pnpm build
```

Both installers fail intentionally when `packages/cli/dist/index.js` is missing.

## Manual Install

### Claude Code

1. Copy `integrations/claude-code/skill/SKILL.md` into `.claude/skills/clawmatrix/SKILL.md`
2. Replace `{{CLAW_BACKEND_COMMAND}}` with `node "<repo-root>/packages/cli/dist/index.js"`

### Codex

1. Copy `plugins/clawmatrix/` into your local plugin root as `plugins/clawmatrix/`
2. Create `.codex-plugin/local.json` with `repoRoot` and `backendPath`
3. Add a `clawmatrix` entry to `.agents/plugins/marketplace.json`

## Automated Install

```bash
pnpm setup:claude-code
pnpm setup:codex
pnpm setup:integrations
```

## Command Map

- `matrix`: contradiction lookup between improving and worsening parameters
- `concept`: explanation of one TRIZ principle by id
- `ifr`: ideal final result framing for one goal
- `audit`: stack-aware contradiction hints for a local project
- `solve`: five-step workflow for a named system and problem
```

```markdown
<!-- docs/integrations/troubleshooting.md -->
# Integration Troubleshooting

## Missing Build Artifact

Symptom:

- setup scripts fail before writing files
- error mentions `packages/cli/dist/index.js`

Fix:

```bash
pnpm install
pnpm build
```

## Wrong Language Output

Symptom:

- the user explicitly asked for English output
- the integration response is still in Portuguese

Fix:

- preserve `--lang en` in the command
- use `--json` only when the next processing step needs structured output

## Embedded Output Has ANSI Noise

Symptom:

- copied command output contains escape sequences

Fix:

```bash
node "<backend>" --no-color <subcommand> ...
```
```

```js
// scripts/setup-integrations.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installClaudeSkill } from './setup-claude-code.mjs';
import { installCodexPlugin } from './setup-codex.mjs';

function parseArgs(argv) {
  const args = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];

    if (key.startsWith('--')) {
      args.set(key, value && !value.startsWith('--') ? value : 'true');
      if (value && !value.startsWith('--')) {
        index += 1;
      }
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
```

```markdown
<!-- README.md addition -->
## Agent Integrations

ClawMatrix also ships an integration layer for Claude Code and Codex that uses the compiled CLI as the backend runtime.

- Shared install guide: `docs/integrations/README.md`
- Shared troubleshooting: `docs/integrations/troubleshooting.md`
- Claude-specific notes: `integrations/claude-code/docs/README.md`
- Codex-specific notes: `plugins/clawmatrix/docs/README.md`
```

```markdown
<!-- README.pt-BR.md addition -->
## Integrações com Agentes

O ClawMatrix também inclui uma camada de integração para Claude Code e Codex usando a CLI compilada como backend real.

- Guia compartilhado: `docs/integrations/README.md`
- Troubleshooting compartilhado: `docs/integrations/troubleshooting.md`
- Notas do Claude Code: `integrations/claude-code/docs/README.md`
- Notas do Codex: `plugins/clawmatrix/docs/README.md`
```

- [ ] **Step 4: Run the unified setup test**

Run: `node --test tests/integrations/setup-integrations.test.mjs`

Expected: PASS with both target directories populated

- [ ] **Step 5: Run the full integration test suite**

Run: `pnpm test:integrations`

Expected: PASS with resolver, Claude setup, Codex setup, manifest, and unified setup checks green

- [ ] **Step 6: Commit**

```bash
git add README.md README.pt-BR.md docs/integrations/README.md docs/integrations/troubleshooting.md scripts/setup-integrations.mjs tests/integrations/setup-integrations.test.mjs
git commit -m "docs: add unified agent integration guides"
```

### Task 5: Full Verification and Finish

**Files:**
- Verify only: existing workspace plus all files from Tasks 1-4

- [ ] **Step 1: Run the full project test suite**

Run: `pnpm test`

Expected: PASS for engine tests, CLI E2E tests, and all integration tests

- [ ] **Step 2: Run the build**

Run: `pnpm build`

Expected: PASS for `@claw/engine` and `@claw/cli`

- [ ] **Step 3: Run the typecheck**

Run: `pnpm typecheck`

Expected: PASS for both workspace packages

- [ ] **Step 4: Smoke-test the unified installer with the real built CLI**

Run: `node scripts/setup-integrations.mjs --claude-target-dir .claude/skills/clawmatrix --codex-target-root .codex-home-smoke`

Expected: exit 0, `.claude/skills/clawmatrix/SKILL.md` updated, and `.codex-home-smoke/plugins/clawmatrix/.codex-plugin/local.json` created

- [ ] **Step 5: Inspect the installed artifacts**

Run: `Get-ChildItem -Recurse .claude\skills\clawmatrix, .codex-home-smoke\plugins\clawmatrix`

Expected: rendered `SKILL.md`, `plugin.json`, `run-claw.mjs`, and `local.json` present

- [ ] **Step 6: Commit the completed feature**

```bash
git add .agents/plugins/marketplace.json CLAUDE.md README.md README.pt-BR.md docs/integrations docs/integrations/troubleshooting.md integrations plugins scripts package.json tests/integrations
git commit -m "feat: add agent integrations for Claude Code and Codex"
```

## Self-Review

**Spec coverage:** Task 1 implements shared backend detection and clear build failures. Task 2 delivers the Claude Code skill, docs, and automated setup. Task 3 delivers the Codex plugin, plugin manifest, marketplace metadata, runner, and automated setup. Task 4 adds shared install docs, troubleshooting docs, README links, and the unified setup command. Task 5 verifies that the repo still builds/tests cleanly while preserving `@claw/engine` and `@claw/cli` as the only TRIZ runtime.

**Placeholder scan:** No `TODO`, `TBD`, or "implement later" placeholders remain. Every code-changing step includes concrete file paths, code, commands, and expected outcomes.

**Type consistency:** The plan uses one backend contract everywhere: `packages/cli/dist/index.js`, resolved through `resolveBackendPath()`. All installer tasks use the same optional `--backend-path` override for testability, and both agent layers depend on the same stable CLI subcommands: `matrix`, `concept`, `ifr`, `audit`, and `solve`.
