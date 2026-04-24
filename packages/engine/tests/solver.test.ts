import { describe, expect, it } from 'vitest';
import { solveContradiction } from '../src/solver.js';

describe('solveContradiction', () => {
  it('returns a SolveReport with system and problem fields', () => {
    const report = solveContradiction('API Gateway', 'latencia alta ao escalar');
    expect(report.system).toBe('API Gateway');
    expect(report.problem).toBe('latencia alta ao escalar');
  });

  it('returns a non-empty IFR statement', () => {
    const report = solveContradiction('cache layer', 'dados inconsistentes');
    expect(typeof report.ifr.statement).toBe('string');
    expect(report.ifr.statement.length).toBeGreaterThan(10);
  });

  it('returns a contradiction with improving and worsening parameters', () => {
    const report = solveContradiction('API Gateway', 'latencia alta ao escalar');
    expect(report.contradiction.improving.id).toBeGreaterThanOrEqual(1);
    expect(report.contradiction.worsening.id).toBeGreaterThanOrEqual(1);
  });

  it('returns 5 workflow steps in Portuguese by default', () => {
    const report = solveContradiction('sistema', 'qualquer problema');
    expect(Array.isArray(report.steps)).toBe(true);
    expect(report.steps.length).toBe(5);
    report.steps.forEach((step) => expect(typeof step).toBe('string'));
    expect(report.steps[0]).toContain('Resultado Final Ideal');
  });

  it('returns workflow steps in English when lang is en', () => {
    const report = solveContradiction('API Gateway', 'high latency and low reliability', 'en');
    expect(report.steps[0]).toContain('Ideal Final Result');
    expect(report.steps[1]).toContain('Identified contradiction');
  });

  it('detects latency keyword -> Speed parameter (#9)', () => {
    const report = solveContradiction('API', 'latencia alta');
    expect(report.contradiction.improving.id).toBe(9);
  });

  it('detects reliability keyword -> Reliability worsening (#27)', () => {
    const report = solveContradiction('API', 'latencia alta, confiabilidade cai');
    expect(report.contradiction.improving.id).toBe(9);
    expect(report.contradiction.worsening.id).toBe(27);
  });

  it('falls back to Speed up / Reliability down when no keywords match', () => {
    const report = solveContradiction('sistema', 'problema generico sem palavras-chave');
    expect(report.contradiction.improving.id).toBe(9);
    expect(report.contradiction.worsening.id).toBe(27);
  });
});
