import { describe, it, expect } from 'vitest';
import { solveContradiction } from '../src/solver.js';

describe('solveContradiction', () => {
  it('returns a SolveReport with system and problem fields', () => {
    const report = solveContradiction('API Gateway', 'latência alta ao escalar');
    expect(report.system).toBe('API Gateway');
    expect(report.problem).toBe('latência alta ao escalar');
  });

  it('returns a non-empty IFR statement', () => {
    const report = solveContradiction('cache layer', 'dados inconsistentes');
    expect(typeof report.ifr.statement).toBe('string');
    expect(report.ifr.statement.length).toBeGreaterThan(10);
  });

  it('returns a contradiction with improving and worsening parameters', () => {
    const report = solveContradiction('API Gateway', 'latência alta ao escalar');
    expect(report.contradiction.improving.id).toBeGreaterThanOrEqual(1);
    expect(report.contradiction.worsening.id).toBeGreaterThanOrEqual(1);
  });

  it('returns 5 workflow steps in Portuguese', () => {
    const report = solveContradiction('sistema', 'qualquer problema');
    expect(Array.isArray(report.steps)).toBe(true);
    expect(report.steps.length).toBe(5);
    report.steps.forEach((s) => expect(typeof s).toBe('string'));
  });

  it('detects "latência" keyword → Speed parameter (#9)', () => {
    const report = solveContradiction('API', 'latência alta');
    expect(report.contradiction.improving.id).toBe(9);
  });

  it('detects "confiabilidade" keyword → Reliability worsening (#27)', () => {
    const report = solveContradiction('API', 'latência alta, confiabilidade cai');
    expect(report.contradiction.improving.id).toBe(9);
    expect(report.contradiction.worsening.id).toBe(27);
  });

  it('falls back to Speed↑/Reliability↓ when no keywords match', () => {
    const report = solveContradiction('sistema', 'problema genérico sem palavras-chave');
    expect(report.contradiction.improving.id).toBe(9);
    expect(report.contradiction.worsening.id).toBe(27);
  });
});
