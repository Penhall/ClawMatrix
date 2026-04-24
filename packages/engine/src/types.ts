export type ParameterId = number; // 1–39

export interface Parameter {
  id: ParameterId;
  name: string;
}

export interface MatrixCell {
  improving: ParameterId;
  worsening: ParameterId;
  principles: number[]; // [] if no data for this intersection
}

export interface MatrixData {
  parameters: Parameter[];
  cells: MatrixCell[];
}

export interface Principle {
  id: number;          // 1–40
  name: string;        // EN: "Segmentation"
  description: string; // PT: "Divida o objeto em partes independentes"
  examples?: string[]; // PT: stack-specific examples (populated by explainPrinciple)
}

export interface ContradictionResult {
  improving: { id: number; name: string };
  worsening: { id: number; name: string };
  principles: Principle[];
}

export interface IFRResult {
  goal: string;
  statement: string;   // PT
  resources: string[]; // PT
}

export interface DetectedStack {
  runtime?: string;    // "Node.js 20"
  framework?: string;  // "Next.js 14"
  orm?: string;        // "Prisma"
  language?: string;   // "TypeScript" | "C#" | "Python"
}

export interface DetectedContradiction {
  improving: ParameterId;
  worsening: ParameterId;
  source: string; // file that triggered detection, e.g. "schema.prisma"
}

export interface SolveReport {
  system: string;
  problem: string;
  ifr: IFRResult;
  contradiction: ContradictionResult;
  steps: string[]; // PT: 5 TRIZ workflow steps as human-readable strings
}

export interface AuditResult {
  stack: DetectedStack;
  contradictions: DetectedContradiction[];
  idleResources: string[];
  suggestions: ContradictionResult[];
}
