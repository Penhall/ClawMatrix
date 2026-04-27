import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { withTempFixture } from './helpers/fs-fixture.mjs';

const scriptPath = path.resolve('scripts/setup-claude-code.mjs');

test('setup-claude-code fails with actionable build instructions when backend is missing', async () => {
  await withTempFixture(
    {},
    async (tempDir) => {
      const targetDir = path.join(tempDir, '.claude', 'skills', 'clawmatrix');
      const missingBackend = path.join(tempDir, 'missing.js');
      const result = spawnSync(process.execPath, [scriptPath, '--target-dir', targetDir, '--backend-path', missingBackend], {
        cwd: path.resolve('.'),
        encoding: 'utf8',
      });

      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /pnpm install/);
      assert.match(result.stderr, /pnpm build/);
    },
  );
});

test('setup-claude-code renders the skill with the resolved backend command', async () => {
  await withTempFixture(
    {
      packages: {
        cli: {
          dist: {
            'index.js': 'console.log("claw ok");\n',
          },
        },
      },
    },
    async (tempDir) => {
      const targetDir = path.join(tempDir, '.claude', 'skills', 'clawmatrix');
      const backendPath = path.join(tempDir, 'packages', 'cli', 'dist', 'index.js');
      const result = spawnSync(process.execPath, [scriptPath, '--target-dir', targetDir, '--backend-path', backendPath], {
        cwd: path.resolve('.'),
        encoding: 'utf8',
      });

      assert.equal(result.status, 0, result.stderr);

      const installedSkill = fs.readFileSync(path.join(targetDir, 'SKILL.md'), 'utf8');
      assert.match(installedSkill, /claw matrix/);
      assert.match(installedSkill, /node "/);
      assert.match(installedSkill, new RegExp(backendPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    },
  );
});
