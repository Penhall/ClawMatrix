import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

async function writeTree(rootDir, tree) {
  for (const [relativePath, value] of Object.entries(tree)) {
    const targetPath = path.join(rootDir, relativePath);

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      await mkdir(targetPath, { recursive: true });
      await writeTree(targetPath, value);
      continue;
    }

    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, String(value));
  }
}

export async function withTempFixture(tree, run) {
  const rootDir = await mkdtemp(path.join(tmpdir(), 'clawmatrix-fixture-'));

  try {
    await writeTree(rootDir, tree);
    return await run(rootDir);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
}
