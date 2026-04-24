import { describe, expect, it } from 'vitest';
import { generateIFR } from '../src/ifr.js';

describe('generateIFR', () => {
  it('returns an IFRResult with the same goal as input', () => {
    const result = generateIFR('autenticar usuarios sem armazenar senha');
    expect(result.goal).toBe('autenticar usuarios sem armazenar senha');
  });

  it('statement is a non-empty string in PT by default', () => {
    const result = generateIFR('reduzir latencia da API');
    expect(typeof result.statement).toBe('string');
    expect(result.statement.length).toBeGreaterThan(10);
    expect(result.statement).toContain('O sistema alcança');
  });

  it('resources is an array of at least 3 strings', () => {
    const result = generateIFR('eliminar etapa de compilacao');
    expect(Array.isArray(result.resources)).toBe(true);
    expect(result.resources.length).toBeGreaterThanOrEqual(3);
    result.resources.forEach((resource) => expect(typeof resource).toBe('string'));
  });

  it('statement references the goal', () => {
    const goal = 'processar pagamentos offline';
    const result = generateIFR(goal);
    expect(result.statement).toContain(goal);
  });

  it('returns English IFR text when lang is en', () => {
    const result = generateIFR('test goal', 'en');
    expect(result.statement).toContain('The system achieves');
    expect(result.resources[0]).toContain('Internal resources');
  });
});
