import matrixData from './data/matrix.json' with { type: 'json' };
import { getPrinciple } from './data/principles/index.js';
import { generateIFR } from './ifr.js';
import type {
  ContradictionResult,
  DetectedStack,
  OutputLanguage,
  Principle,
  SolveReport,
} from './types.js';

function validateParamId(id: number, role: 'improving' | 'worsening'): void {
  if (id < 1 || id > 39 || !Number.isInteger(id)) {
    throw new RangeError(`${role} parameter ID must be an integer between 1 and 39, got ${id}`);
  }
}

export function lookupMatrix(
  improving: number,
  worsening: number,
  lang: OutputLanguage = 'pt',
): ContradictionResult {
  validateParamId(improving, 'improving');
  validateParamId(worsening, 'worsening');

  const improvingParam = matrixData.parameters.find((parameter) => parameter.id === improving)!;
  const worseningParam = matrixData.parameters.find((parameter) => parameter.id === worsening)!;
  const cell = matrixData.cells.find(
    (candidate) => candidate.improving === improving && candidate.worsening === worsening,
  )!;

  return {
    improving: { id: improvingParam.id, name: improvingParam.name },
    worsening: { id: worseningParam.id, name: worseningParam.name },
    principles: cell.principles.map((id) => getPrinciple(id, lang)!),
  };
}

const STACK_EXAMPLES: Record<string, Record<OutputLanguage, Record<number, string[]>>> = {
  'Next.js': {
    pt: {
      1: ['Divida o diretório app em módulos por feature com componentes, hooks e testes co-localizados.'],
      10: ['Execute builds com Turbopack para pré-compilação incremental.'],
      28: [
        'Substitua polling por WebSockets ou Server-Sent Events.',
        'Use ISR no lugar de SSR em cada request quando o dado permitir.',
      ],
      35: ['Mude a estratégia de cache por rota com `revalidate` em vez de `no-store` global.'],
    },
    en: {
      1: ['Split the app directory into feature modules with co-located components, hooks, and tests.'],
      10: ['Run builds with Turbopack for incremental precompilation.'],
      28: [
        'Replace polling with WebSockets or Server-Sent Events.',
        'Use ISR instead of per-request SSR when the data model allows it.',
      ],
      35: ['Change cache strategy per route with `revalidate` instead of a global `no-store` approach.'],
    },
  },
  Prisma: {
    pt: {
      1: ['Divida o schema em múltiplos arquivos com geração centralizada.'],
      23: ['Use `prisma.$transaction` para agrupar operações e evitar perda parcial de dados.'],
      28: ['Substitua queries N+1 por `include` ou `select` com relações aninhadas.'],
    },
    en: {
      1: ['Split the schema into multiple files with centralized generation.'],
      23: ['Use `prisma.$transaction` to group operations and avoid partial data loss.'],
      28: ['Replace N+1 queries with `include` or `select` over nested relations.'],
    },
  },
  'Node.js': {
    pt: {
      19: ['Use `worker_threads` para tarefas periódicas CPU-bound.'],
      25: ['Use o próprio event loop para auto-gerenciar filas leves sem serviço externo.'],
    },
    en: {
      19: ['Use `worker_threads` for periodic CPU-bound tasks.'],
      25: ['Use the event loop itself to self-manage lightweight queues without an external service.'],
    },
  },
};

export function explainPrinciple(
  id: number,
  stack?: DetectedStack,
  lang: OutputLanguage = 'pt',
): Principle {
  if (id < 1 || id > 40 || !Number.isInteger(id)) {
    throw new RangeError(`Principle ID must be an integer between 1 and 40, got ${id}`);
  }

  const principle = getPrinciple(id, lang);
  if (!principle) throw new Error(`Principle #${id} not found`);
  if (!stack) return principle;

  const examples: string[] = [];
  const stackValues = Object.values(stack);
  for (const [stackName, localizedMap] of Object.entries(STACK_EXAMPLES)) {
    if (stackValues.some((value) => value?.includes(stackName))) {
      examples.push(...(localizedMap[lang][id] ?? []));
    }
  }

  return examples.length > 0 ? { ...principle, examples } : principle;
}

const KEYWORD_TO_PARAM: Record<string, number> = {
  accuracy: 28,
  adaptability: 35,
  automation: 38,
  calor: 17,
  complexity: 36,
  complexidade: 36,
  confiabilidade: 27,
  disponibilidade: 27,
  energy: 19,
  exatidão: 28,
  fast: 9,
  force: 10,
  forca: 10,
  força: 10,
  heat: 17,
  instabilidade: 27,
  latency: 9,
  latencia: 9,
  latência: 9,
  peso: 1,
  power: 21,
  precisão: 28,
  productivity: 39,
  rapidez: 9,
  reliability: 27,
  resistência: 14,
  rigidez: 14,
  speed: 9,
  strength: 14,
  temperatura: 17,
  throughput: 39,
  velocidade: 9,
  weight: 1,
};

function detectParams(text: string): { improving: number; worsening: number } {
  const lower = text.toLowerCase();
  const matches: Array<{ parameterId: number; index: number }> = [];
  for (const [keyword, parameterId] of Object.entries(KEYWORD_TO_PARAM)) {
    const index = lower.indexOf(keyword);
    if (index >= 0) matches.push({ parameterId, index });
  }
  const unique = [...new Set(matches.sort((a, b) => a.index - b.index).map((match) => match.parameterId))];
  if (unique.length >= 2) return { improving: unique[0]!, worsening: unique[1]! };
  if (unique.length === 1) return { improving: unique[0]!, worsening: 27 };
  return { improving: 9, worsening: 27 };
}

function buildSolveSteps(
  system: string,
  contradiction: ContradictionResult,
  ifrStatement: string,
  improving: number,
  worsening: number,
  lang: OutputLanguage,
): string[] {
  if (lang === 'en') {
    return [
      `1. Ideal Final Result (IFR): ${ifrStatement}`,
      `2. Identified contradiction: improving "${contradiction.improving.name}" (parameter #${improving}) worsens "${contradiction.worsening.name}" (parameter #${worsening}).`,
      `3. Altshuller Matrix lookup: ${contradiction.principles.length} suggested principle(s).`,
      `4. Inventive principles: ${contradiction.principles.map((principle) => `#${principle.id} ${principle.name}`).join(', ')}.`,
      `5. Next step: apply these principles to "${system}" using the available resources.`,
    ];
  }

  return [
    `1. Resultado Final Ideal (IFR): ${ifrStatement}`,
    `2. Contradição identificada: melhorar "${contradiction.improving.name}" (parâmetro #${improving}) piora "${contradiction.worsening.name}" (parâmetro #${worsening}).`,
    `3. Consulta à Matriz de Altshuller: ${contradiction.principles.length} princípio(s) sugerido(s).`,
    `4. Princípios inventivos: ${contradiction.principles.map((principle) => `#${principle.id} ${principle.name}`).join(', ')}.`,
    `5. Próximo passo: aplique os princípios ao sistema "${system}" considerando os recursos disponíveis.`,
  ];
}

export function solveContradiction(
  system: string,
  problem: string,
  lang: OutputLanguage = 'pt',
): SolveReport {
  const { improving, worsening } = detectParams(problem);
  const contradiction = lookupMatrix(improving, worsening, lang);
  const ifr = generateIFR(`${system}: ${problem}`, lang);
  const steps = buildSolveSteps(
    system,
    contradiction,
    ifr.statement,
    improving,
    worsening,
    lang,
  );

  return { system, problem, ifr, contradiction, steps };
}
