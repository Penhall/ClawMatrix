export type {
  ParameterId,
  Parameter,
  MatrixCell,
  MatrixData,
  Principle,
  ContradictionResult,
  IFRResult,
  DetectedStack,
  DetectedContradiction,
  SolveReport,
  AuditResult,
} from './types.js';

export { lookupMatrix, solveContradiction, explainPrinciple } from './solver.js';
export { generateIFR } from './ifr.js';
export { analyzeProject } from './audit.js';
