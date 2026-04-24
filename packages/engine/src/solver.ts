import matrixData from './data/matrix.json' assert { type: 'json' };
import { getPrinciple } from './data/principles/index.js';
import type { ContradictionResult, Principle, DetectedStack } from './types.js';

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

const STACK_EXAMPLES: Record<string, Record<number, string[]>> = {
  'Next.js': {
    28: ['Substitua polling por WebSockets ou Server-Sent Events', 'Use ISR (Incremental Static Regeneration) no lugar de SSR em cada request'],
    1:  ['Divida pages/ em feature modules com co-location de componentes, hooks e testes'],
    10: ['Execute builds com Turbopack (--turbo) para pré-compilação incremental'],
    35: ['Mude a estratégia de cache por rota: `export const revalidate = 60` em vez de no-cache global'],
  },
  Prisma: {
    1:  ['Divida o schema em múltiplos arquivos usando `prisma generate --schema`'],
    23: ['Use `prisma.$transaction` para agrupar operações e evitar perda de dados parciais'],
    28: ['Substitua queries N+1 por `include` ou `select` com relações aninhadas'],
  },
  'Node.js': {
    19: ['Use workers com `worker_threads` para tarefas CPU-bound periódicas'],
    25: ['Use o event loop para auto-gerenciar filas sem serviço externo'],
  },
};

export function explainPrinciple(id: number, stack?: DetectedStack): Principle {
  if (id < 1 || id > 40 || !Number.isInteger(id)) {
    throw new RangeError(`Principle ID must be an integer between 1 and 40, got ${id}`);
  }
  const principle = getPrinciple(id);
  if (!principle) throw new Error(`Principle #${id} not found`);

  if (!stack) return principle;

  const examples: string[] = [];
  for (const [stackName, map] of Object.entries(STACK_EXAMPLES)) {
    const stackValues = Object.values(stack);
    if (stackValues.some((v) => v?.includes(stackName))) {
      examples.push(...(map[id] ?? []));
    }
  }

  return examples.length > 0 ? { ...principle, examples } : principle;
}
