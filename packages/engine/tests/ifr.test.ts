import { describe, it, expect } from 'vitest';
import { generateIFR } from '../src/ifr.js';

describe('generateIFR', () => {
  it('returns an IFRResult with the same goal as input', () => {
    const result = generateIFR('autenticar usuários sem armazenar senha');
    expect(result.goal).toBe('autenticar usuários sem armazenar senha');
  });

  it('statement is a non-empty string in PT', () => {
    const result = generateIFR('reduzir latência da API');
    expect(typeof result.statement).toBe('string');
    expect(result.statement.length).toBeGreaterThan(10);
  });

  it('resources is an array of at least 3 strings', () => {
    const result = generateIFR('eliminar etapa de compilação');
    expect(Array.isArray(result.resources)).toBe(true);
    expect(result.resources.length).toBeGreaterThanOrEqual(3);
    result.resources.forEach((r) => expect(typeof r).toBe('string'));
  });

  it('statement references the goal', () => {
    const goal = 'processar pagamentos offline';
    const result = generateIFR(goal);
    expect(result.statement).toContain(goal);
  });
});
