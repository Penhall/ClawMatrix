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
