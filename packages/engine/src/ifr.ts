import type { IFRResult } from './types.js';

export function generateIFR(goal: string): IFRResult {
  return {
    goal,
    statement: `O sistema alcança "${goal}" usando apenas os recursos já existentes, sem custo, complexidade ou danos adicionais — o problema se resolve por si mesmo.`,
    resources: [
      'Recursos internos: subprodutos, energia residual, propriedades inexploradas dos componentes atuais',
      'Recursos do supersistema: ambiente (ar, gravidade, campos), sistemas adjacentes, infraestrutura existente',
      'Recursos temporais: tempo ocioso no ciclo, operações paralelas, pré-processamento antecipado',
    ],
  };
}
