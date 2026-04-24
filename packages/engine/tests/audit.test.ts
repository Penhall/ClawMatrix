import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { analyzeProject } from '../src/audit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, 'fixtures');

describe('analyzeProject — stack detection', () => {
  it('detects Next.js + Prisma stack from nextjs-prisma fixture', async () => {
    const result = await analyzeProject(path.join(FIXTURES, 'nextjs-prisma'));
    expect(result.stack.framework).toBe('Next.js');
    expect(result.stack.orm).toBe('Prisma');
    expect(result.stack.runtime).toMatch(/Node/);
  });

  it('detects plain Node.js from plain-node fixture', async () => {
    const result = await analyzeProject(path.join(FIXTURES, 'plain-node'));
    expect(result.stack.framework).toBeUndefined();
    expect(result.stack.runtime).toMatch(/Node/);
  });
});

describe('analyzeProject — idle resource detection', () => {
  it('detects API route without cache header', async () => {
    const result = await analyzeProject(path.join(FIXTURES, 'nextjs-prisma'));
    const routeIssue = result.idleResources.some((r) => r.includes('route') || r.includes('cache'));
    expect(routeIssue).toBe(true);
  });

  it('detects Prisma relation without explicit index', async () => {
    const result = await analyzeProject(path.join(FIXTURES, 'nextjs-prisma'));
    const indexIssue = result.idleResources.some((r) => r.includes('índice') || r.includes('index') || r.includes('schema'));
    expect(indexIssue).toBe(true);
  });

  it('detects unused environment variables from .env file', async () => {
    const result = await analyzeProject(path.join(FIXTURES, 'nextjs-prisma'));
    const envIssue = result.idleResources.some((r) => r.includes('env') || r.includes('ENV') || r.includes('UNUSED'));
    expect(envIssue).toBe(true);
  });
});

describe('analyzeProject — contradictions', () => {
  it('returns at least one contradiction for nextjs-prisma fixture', async () => {
    const result = await analyzeProject(path.join(FIXTURES, 'nextjs-prisma'));
    expect(result.contradictions.length).toBeGreaterThan(0);
  });

  it('returns contradiction suggestions (ContradictionResult array)', async () => {
    const result = await analyzeProject(path.join(FIXTURES, 'nextjs-prisma'));
    expect(Array.isArray(result.suggestions)).toBe(true);
    result.suggestions.forEach((s) => {
      expect(typeof s.improving.name).toBe('string');
      expect(typeof s.worsening.name).toBe('string');
    });
  });

  it('returns empty contradictions for plain-node fixture', async () => {
    const result = await analyzeProject(path.join(FIXTURES, 'plain-node'));
    expect(result.contradictions.length).toBe(0);
  });
});
