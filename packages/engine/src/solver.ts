import matrixData from './data/matrix.json' assert { type: 'json' };
import { getPrinciple } from './data/principles/index.js';
import type { ContradictionResult } from './types.js';

function validateParamId(id: number, role: 'improving' | 'worsening'): void {
  if (id < 1 || id > 39 || !Number.isInteger(id)) {
    throw new RangeError(`${role} parameter ID must be an integer between 1 and 39, got ${id}`);
  }
}

export function lookupMatrix(improving: number, worsening: number): ContradictionResult {
  validateParamId(improving, 'improving');
  validateParamId(worsening, 'worsening');

  const improvingParam = matrixData.parameters.find((p) => p.id === improving)!;
  const worseningParam = matrixData.parameters.find((p) => p.id === worsening)!;
  const cell = matrixData.cells.find((c) => c.improving === improving && c.worsening === worsening)!;

  return {
    improving: { id: improvingParam.id, name: improvingParam.name },
    worsening: { id: worseningParam.id, name: worseningParam.name },
    principles: cell.principles.map((id) => getPrinciple(id)!),
  };
}
