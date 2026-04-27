import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { withTempFixture } from './helpers/fs-fixture.mjs';

const scriptPath = path.resolve('scripts/setup-integrations.mjs');

test('setup-integrations installs both Claude and Codex artifacts', async () => {
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
      const claudeTargetDir = path.join(tempDir, '.claude', 'skills', 'clawmatrix');
      const codexTargetRoot = path.join(tempDir, 'codex-root');

      const result = spawnSync(process.execPath, [
        scriptPath,
        '--backend-path',
        backendPath,
        '--claude-target-dir',
        claudeTargetDir,
        '--codex-target-root',
        codexTargetRoot,
      ], {
        cwd: path.resolve('.'),
        encoding: 'utf8',
      });

      assert.equal(result.status, 0, result.stderr);
      assert.equal(fs.existsSync(path.join(claudeTargetDir, 'SKILL.md')), true);
      assert.equal(fs.existsSync(path.join(codexTargetRoot, 'plugins', 'clawmatrix', '.codex-plugin', 'local.json')), true);
    },
  );
});
