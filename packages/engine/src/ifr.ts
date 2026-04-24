import type { IFRResult, OutputLanguage } from './types.js';

const IFR_TEMPLATES: Record<OutputLanguage, { statement: (goal: string) => string; resources: string[] }> = {
  pt: {
    statement: (goal) =>
      `O sistema alcança "${goal}" usando apenas os recursos já existentes, sem custo, complexidade ou danos adicionais; o problema se resolve por si mesmo.`,
    resources: [
      'Recursos internos: subprodutos, energia residual, propriedades inexploradas dos componentes atuais',
      'Recursos do supersistema: ambiente, sistemas adjacentes e infraestrutura existente',
      'Recursos temporais: tempo ocioso no ciclo, operações paralelas e pré-processamento antecipado',
    ],
  },
  en: {
    statement: (goal) =>
      `The system achieves "${goal}" using only existing resources, with no extra cost, complexity, or harm; the problem resolves itself.`,
    resources: [
      'Internal resources: by-products, residual energy, and unexplored properties of current components',
      'Supersystem resources: environment, adjacent systems, and existing infrastructure',
      'Time resources: idle time in the cycle, parallel operations, and advance preprocessing',
    ],
  },
};

export function generateIFR(goal: string, lang: OutputLanguage = 'pt'): IFRResult {
  const template = IFR_TEMPLATES[lang];
  return {
    goal,
    statement: template.statement(goal),
    resources: template.resources,
  };
}
