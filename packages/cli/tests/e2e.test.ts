import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(__dirname, '../src/index.ts');
const TSX = 'npx tsx';

function run(args: string): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(`${TSX} ${CLI} ${args}`, { encoding: 'utf-8' });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (e: unknown) {
    const err = e as { stdout: string; stderr: string; status: number };
    return { stdout: err.stdout ?? '', stderr: err.stderr ?? '', exitCode: err.status ?? 1 };
  }
}

describe('claw CLI — E2E', () => {
  it('--help exits 0 and shows usage', () => {
    const { exitCode, stdout } = run('--help');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('claw');
    expect(stdout).toContain('matrix');
    expect(stdout).toContain('solve');
  });

  it('matrix --improve 10 --worsen 17 exits 0 and shows #35', () => {
    const { exitCode, stdout } = run('matrix --improve 10 --worsen 17');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('#35');
    expect(stdout).toContain('Parameter Changes');
  });

  it('matrix --json outputs valid JSON with principles array', () => {
    const { exitCode, stdout } = run('--json matrix --improve 10 --worsen 17');
    expect(exitCode).toBe(0);
    const data = JSON.parse(stdout);
    expect(Array.isArray(data.principles)).toBe(true);
    expect(data.principles[0].id).toBe(35);
  });

  it('concept --principle 1 shows Segmentation', () => {
    const { exitCode, stdout } = run('concept --principle 1');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Segmentation');
  });

  it('ifr --goal "test goal" exits 0', () => {
    const { exitCode, stdout } = run('ifr --goal "test goal"');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('test goal');
  });

  it('matrix with out-of-range param exits 1', () => {
    const { exitCode } = run('matrix --improve 40 --worsen 1');
    expect(exitCode).toBe(1);
  });

  it('concept with out-of-range id exits 1', () => {
    const { exitCode } = run('concept --principle 99');
    expect(exitCode).toBe(1);
  });
});
