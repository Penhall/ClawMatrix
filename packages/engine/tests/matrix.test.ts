import { describe, it, expect } from 'vitest';
import matrixData from '../src/data/matrix.json' assert { type: 'json' };
import { principles } from '../src/data/principles/index.js';
import { lookupMatrix } from '../src/solver.js';

describe('Matrix integrity', () => {
  it('has exactly 1521 cells', () => {
    expect(matrixData.cells.length).toBe(1521);
  });

  it('has exactly 39 parameters', () => {
    expect(matrixData.parameters.length).toBe(39);
  });

  it('all parameter IDs are 1–39', () => {
    matrixData.parameters.forEach((p) => {
      expect(p.id).toBeGreaterThanOrEqual(1);
      expect(p.id).toBeLessThanOrEqual(39);
    });
  });

  it('all cell improving and worsening values are 1–39', () => {
    matrixData.cells.forEach((c) => {
      expect(c.improving).toBeGreaterThanOrEqual(1);
      expect(c.improving).toBeLessThanOrEqual(39);
      expect(c.worsening).toBeGreaterThanOrEqual(1);
      expect(c.worsening).toBeLessThanOrEqual(39);
    });
  });

  it('no duplicate (improving, worsening) pairs', () => {
    const keys = matrixData.cells.map((c) => `${c.improving}-${c.worsening}`);
    expect(new Set(keys).size).toBe(1521);
  });

  it('all principle IDs referenced in cells exist in the 40 principles', () => {
    const validIds = new Set(principles.map((p) => p.id));
    matrixData.cells.forEach((c) => {
      c.principles.forEach((id) => {
        expect(validIds.has(id), `Principle #${id} referenced but not defined`).toBe(true);
      });
    });
  });

  it('principles array has exactly 40 entries with IDs 1–40', () => {
    expect(principles.length).toBe(40);
    principles.forEach((p, i) => {
      expect(p.id).toBe(i + 1);
      expect(typeof p.name).toBe('string');
      expect(typeof p.description).toBe('string');
    });
  });
});

describe('lookupMatrix', () => {
  it('Force↑ + Temperature↓ → [35, 2, 40, 11] (spec test case)', () => {
    const result = lookupMatrix(10, 17);
    expect(result.improving.id).toBe(10);
    expect(result.improving.name).toBe('Force');
    expect(result.worsening.id).toBe(17);
    expect(result.worsening.name).toBe('Temperature');
    expect(result.principles.map((p) => p.id)).toEqual([35, 2, 40, 11]);
  });

  it('Speed↑ + Reliability↓ → [28, 13, 18]', () => {
    const result = lookupMatrix(9, 27);
    expect(result.principles.map((p) => p.id)).toEqual([28, 13, 18]);
  });

  it('returns empty principles array for cells with no data', () => {
    const result = lookupMatrix(1, 1);
    expect(result.principles).toEqual([]);
  });

  it('throws for improving param out of range', () => {
    expect(() => lookupMatrix(0, 5)).toThrow();
    expect(() => lookupMatrix(40, 5)).toThrow();
  });

  it('throws for worsening param out of range', () => {
    expect(() => lookupMatrix(5, 0)).toThrow();
    expect(() => lookupMatrix(5, 40)).toThrow();
  });

  it('returned principles have id, name and description', () => {
    const result = lookupMatrix(10, 17);
    result.principles.forEach((p) => {
      expect(typeof p.id).toBe('number');
      expect(typeof p.name).toBe('string');
      expect(typeof p.description).toBe('string');
    });
  });
});
