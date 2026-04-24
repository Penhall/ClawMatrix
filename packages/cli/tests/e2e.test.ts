import { execSync } from 'child_process';
import { describe, expect, it } from 'vitest';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(__dirname, '../src/index.ts');
const TSX = 'npx tsx';

function run(args: string): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(`${TSX} ${CLI} ${args}`, { encoding: 'utf-8' });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error: unknown) {
    const err = error as { stdout: string; stderr: string; status: number };
    return { stdout: err.stdout ?? '', stderr: err.stderr ?? '', exitCode: err.status ?? 1 };
  }
}

describe('claw CLI - E2E', () => {
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

  it('concept --lang en renders English description text', () => {
    const { exitCode, stdout } = run('--lang en concept --principle 1');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Divide an object into independent parts');
  });

  it('ifr --goal "test goal" exits 0', () => {
    const { exitCode, stdout } = run('ifr --goal "test goal"');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('test goal');
  });

  it('ifr --lang en renders English labels and statement', () => {
    const { exitCode, stdout } = run('--lang en ifr --goal "test goal"');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Ideal Final Result (IFR)');
    expect(stdout).toContain('The system achieves');
  });

  it('audit fixture exits 0 and reports Next.js + Prisma', () => {
    const { exitCode, stdout } = run('audit --dir ../engine/tests/fixtures/nextjs-prisma');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Next.js');
    expect(stdout).toContain('Prisma');
  });

  it('solve exits 0 and prints TRIZ workflow', () => {
    const { exitCode, stdout } = run('solve --system "API Gateway" --problem "latencia alta e confiabilidade baixa"');
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Workflow TRIZ');
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
