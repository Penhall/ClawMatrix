import { describe, expect, it } from 'vitest';
import matrixData from '../src/data/matrix.json' assert { type: 'json' };
import { principles } from '../src/data/principles/index.js';
import { explainPrinciple, lookupMatrix } from '../src/solver.js';

describe('Matrix integrity', () => {
  it('has exactly 1521 cells', () => {
    expect(matrixData.cells.length).toBe(1521);
  });

  it('has exactly 39 parameters', () => {
    expect(matrixData.parameters.length).toBe(39);
  });

  it('all parameter IDs are 1-39', () => {
    matrixData.parameters.forEach((parameter) => {
      expect(parameter.id).toBeGreaterThanOrEqual(1);
      expect(parameter.id).toBeLessThanOrEqual(39);
    });
  });

  it('all cell improving and worsening values are 1-39', () => {
    matrixData.cells.forEach((cell) => {
      expect(cell.improving).toBeGreaterThanOrEqual(1);
      expect(cell.improving).toBeLessThanOrEqual(39);
      expect(cell.worsening).toBeGreaterThanOrEqual(1);
      expect(cell.worsening).toBeLessThanOrEqual(39);
    });
  });

  it('no duplicate (improving, worsening) pairs', () => {
    const keys = matrixData.cells.map((cell) => `${cell.improving}-${cell.worsening}`);
    expect(new Set(keys).size).toBe(1521);
  });

  it('all principle IDs referenced in cells exist in the 40 principles', () => {
    const validIds = new Set(principles.map((principle) => principle.id));
    matrixData.cells.forEach((cell) => {
      cell.principles.forEach((id) => {
        expect(validIds.has(id), `Principle #${id} referenced but not defined`).toBe(true);
      });
    });
  });

  it('principles array has exactly 40 entries with IDs 1-40', () => {
    expect(principles.length).toBe(40);
    principles.forEach((principle, index) => {
      expect(principle.id).toBe(index + 1);
      expect(typeof principle.name).toBe('string');
      expect(typeof principle.description).toBe('string');
    });
  });
});

describe('lookupMatrix', () => {
  it('Force up + Temperature down -> [35, 2, 40, 11] (spec test case)', () => {
    const result = lookupMatrix(10, 17);
    expect(result.improving.id).toBe(10);
    expect(result.improving.name).toBe('Force');
    expect(result.worsening.id).toBe(17);
    expect(result.worsening.name).toBe('Temperature');
    expect(result.principles.map((principle) => principle.id)).toEqual([35, 2, 40, 11]);
  });

  it('Speed up + Reliability down -> [28, 13, 18]', () => {
    const result = lookupMatrix(9, 27);
    expect(result.principles.map((principle) => principle.id)).toEqual([28, 13, 18]);
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
    result.principles.forEach((principle) => {
      expect(typeof principle.id).toBe('number');
      expect(typeof principle.name).toBe('string');
      expect(typeof principle.description).toBe('string');
    });
  });

  it('returns English descriptions when lang is en', () => {
    const result = lookupMatrix(10, 17, 'en');
    expect(result.principles[0]?.description).toContain('Change an object');
  });
});

describe('explainPrinciple', () => {
  it('returns principle #1 Segmentation', () => {
    const principle = explainPrinciple(1);
    expect(principle.id).toBe(1);
    expect(principle.name).toBe('Segmentation');
    expect(principle.description.length).toBeGreaterThan(10);
  });

  it('throws for ID out of range', () => {
    expect(() => explainPrinciple(0)).toThrow();
    expect(() => explainPrinciple(41)).toThrow();
  });

  it('returns principle #28 with stack-specific example for Next.js', () => {
    const principle = explainPrinciple(28, { framework: 'Next.js' });
    expect(principle.examples).toBeDefined();
    expect(principle.examples!.length).toBeGreaterThan(0);
  });

  it('returns English examples when lang is en', () => {
    const principle = explainPrinciple(28, { framework: 'Next.js' }, 'en');
    expect(principle.examples?.[0]).toContain('Replace polling');
  });

  it('returns principle without examples when no stack provided', () => {
    const principle = explainPrinciple(35);
    expect(principle.examples).toBeUndefined();
  });
});
