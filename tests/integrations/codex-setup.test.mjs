import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { withTempFixture } from './helpers/fs-fixture.mjs';

const scriptPath = path.resolve('scripts/setup-codex.mjs');

test('setup-codex fails with actionable build instructions when backend is missing', async () => {
  await withTempFixture(
    {},
    async (tempDir) => {
      const targetRoot = path.join(tempDir, 'target-root');
      const missingBackend = path.join(tempDir, 'missing.js');
      const result = spawnSync(process.execPath, [scriptPath, '--target-root', targetRoot, '--backend-path', missingBackend], {
        cwd: path.resolve('.'),
        encoding: 'utf8',
      });

      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /pnpm install/);
      assert.match(result.stderr, /pnpm build/);
    },
  );
});

test('setup-codex installs a rendered plugin and marketplace entry', async () => {
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
      const backendPath = path.join(tempDir, 'packages', 'cli', 'dist', 'index.js');
      const targetRoot = path.join(tempDir, 'target-root');
      const result = spawnSync(process.execPath, [scriptPath, '--target-root', targetRoot, '--backend-path', backendPath], {
        cwd: path.resolve('.'),
        encoding: 'utf8',
      });

      assert.equal(result.status, 0, result.stderr);

      const localConfigPath = path.join(targetRoot, 'plugins', 'clawmatrix', '.codex-plugin', 'local.json');
      const marketplacePath = path.join(targetRoot, '.agents', 'plugins', 'marketplace.json');
      const installedSkillPath = path.join(targetRoot, 'plugins', 'clawmatrix', 'skills', 'clawmatrix', 'SKILL.md');

      assert.equal(JSON.parse(fs.readFileSync(localConfigPath, 'utf8')).backendPath, backendPath);
      assert.match(fs.readFileSync(installedSkillPath, 'utf8'), /run-claw\.mjs/);
      assert.equal(JSON.parse(fs.readFileSync(marketplacePath, 'utf8')).plugins[0].name, 'clawmatrix');
    },
  );
});
