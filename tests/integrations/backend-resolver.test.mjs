import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { withTempFixture } from './helpers/fs-fixture.mjs';
import {
  createBackendCommand,
  findRepoRoot,
  resolveBackendPath,
  runtimeSummary,
} from '../../integrations/shared/runtime/resolve-backend.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runtimeScript = path.resolve(__dirname, '../../integrations/shared/runtime/resolve-backend.mjs');

test('findRepoRoot walks up to the monorepo root', async () => {
  await withTempFixture(
    {
      'package.json': '{"name":"root","private":true}',
      'pnpm-workspace.yaml': "packages:\n  - 'packages/*'\n",
      packages: {
        cli: {
          dist: {
            'index.js': 'console.log("claw");\n',
          },
        },
      },
      integrations: {
        codex: {},
      },
    },
    async (rootDir) => {
      const nestedDir = path.join(rootDir, 'integrations', 'codex');
      const repoRoot = findRepoRoot(nestedDir);

      assert.equal(repoRoot, rootDir);
    },
  );
});

test('resolveBackendPath returns the compiled CLI path by default', async () => {
  await withTempFixture(
    {
      'package.json': '{"name":"root","private":true}',
      'pnpm-workspace.yaml': "packages:\n  - 'packages/*'\n",
      packages: {
        cli: {
          dist: {
            'index.js': 'console.log("claw");\n',
          },
        },
      },
    },
    async (rootDir) => {
      const backendPath = resolveBackendPath({ repoRoot: rootDir });

      assert.equal(backendPath, path.join(rootDir, 'packages', 'cli', 'dist', 'index.js'));
    },
  );
});

test('resolveBackendPath throws an install and build instruction when the CLI build is missing', async () => {
  await withTempFixture(
    {
      'package.json': '{"name":"root","private":true}',
      'pnpm-workspace.yaml': "packages:\n  - 'packages/*'\n",
    },
    async (rootDir) => {
      assert.throws(
        () => resolveBackendPath({ repoRoot: rootDir }),
        /Run "pnpm install" and "pnpm build" before installing integrations\./,
      );
    },
  );
});

test('createBackendCommand returns a node invocation for the resolved backend', async () => {
  await withTempFixture(
    {
      'package.json': '{"name":"root","private":true}',
      'pnpm-workspace.yaml': "packages:\n  - 'packages/*'\n",
      packages: {
        cli: {
          dist: {
            'index.js': 'console.log("claw");\n',
          },
        },
      },
    },
    async (rootDir) => {
      const command = createBackendCommand({ repoRoot: rootDir });

      assert.deepEqual(command, {
        command: process.execPath,
        args: [path.join(rootDir, 'packages', 'cli', 'dist', 'index.js')],
      });
    },
  );
});

test('runtimeSummary reports repo root, backend path, and command details', async () => {
  await withTempFixture(
    {
      'package.json': '{"name":"root","private":true}',
      'pnpm-workspace.yaml': "packages:\n  - 'packages/*'\n",
      packages: {
        cli: {
          dist: {
            'index.js': 'console.log("claw");\n',
          },
        },
      },
    },
    async (rootDir) => {
      const summary = runtimeSummary({ repoRoot: rootDir });

      assert.deepEqual(summary, {
        repoRoot: rootDir,
        backendPath: path.join(rootDir, 'packages', 'cli', 'dist', 'index.js'),
        command: process.execPath,
        args: [path.join(rootDir, 'packages', 'cli', 'dist', 'index.js')],
      });
    },
  );
});

test('direct-run mode prints the runtime summary as JSON', async () => {
  await withTempFixture(
    {
      'package.json': '{"name":"root","private":true}',
      'pnpm-workspace.yaml': "packages:\n  - 'packages/*'\n",
      packages: {
        cli: {
          dist: {
            'index.js': 'console.log("claw");\n',
          },
        },
      },
    },
    async (rootDir) => {
      const result = spawnSync(process.execPath, [runtimeScript], {
        cwd: rootDir,
        encoding: 'utf8',
      });

      assert.equal(result.status, 0, result.stderr);

      const summary = JSON.parse(result.stdout);
      assert.deepEqual(summary, {
        repoRoot: rootDir,
        backendPath: path.join(rootDir, 'packages', 'cli', 'dist', 'index.js'),
        command: process.execPath,
        args: [path.join(rootDir, 'packages', 'cli', 'dist', 'index.js')],
      });
    },
  );
});
