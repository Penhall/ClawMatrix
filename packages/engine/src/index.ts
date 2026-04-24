export type {
  AuditResult,
  ContradictionResult,
  DetectedContradiction,
  DetectedStack,
  IFRResult,
  MatrixCell,
  MatrixData,
  OutputLanguage,
  Parameter,
  ParameterId,
  Principle,
  SolveReport,
} from './types.js';

export { analyzeProject } from './audit.js';
export { generateIFR } from './ifr.js';
export { explainPrinciple, lookupMatrix, solveContradiction } from './solver.js';
