import chalk, { type ChalkInstance } from 'chalk';
import type {
  AuditResult,
  ContradictionResult,
  IFRResult,
  OutputLanguage,
  Principle,
  SolveReport,
} from '@claw/engine';

export interface OutputOpts {
  json: boolean;
  noColor: boolean;
  lang: OutputLanguage;
}

const UI_TEXT = {
  pt: {
    technicalContradiction: 'Contradição Técnica',
    improving: 'Melhorando',
    worsening: 'Piorando',
    noPrinciples: '(nenhum princípio documentado para esta combinação)',
    suggestedPrinciples: 'Princípios sugeridos:',
    ifrTitle: 'Resultado Final Ideal (IFR)',
    goal: 'Objetivo',
    resources: 'Recursos a explorar:',
    currentStackExamples: 'Exemplos no stack atual:',
    detectedStack: 'Stack detectado',
    language: 'Linguagem',
    idleResources: (count: number) => `Recursos ociosos detectados (${count})`,
    contradictions: (count: number) => `Contradições encontradas (${count})`,
    source: 'Fonte:',
    suggestion: 'Sugestão:',
    noContradictions: 'Nenhuma contradição detectada.',
    solveTitle: 'Workflow TRIZ - 5 Passos',
    system: 'Sistema',
    problem: 'Problema',
  },
  en: {
    technicalContradiction: 'Technical Contradiction',
    improving: 'Improving',
    worsening: 'Worsening',
    noPrinciples: '(no documented principles for this combination)',
    suggestedPrinciples: 'Suggested principles:',
    ifrTitle: 'Ideal Final Result (IFR)',
    goal: 'Goal',
    resources: 'Resources to explore:',
    currentStackExamples: 'Examples for the current stack:',
    detectedStack: 'Detected stack',
    language: 'Language',
    idleResources: (count: number) => `Idle resources detected (${count})`,
    contradictions: (count: number) => `Contradictions found (${count})`,
    source: 'Source:',
    suggestion: 'Suggestion:',
    noContradictions: 'No contradictions detected.',
    solveTitle: 'TRIZ Workflow - 5 Steps',
    system: 'System',
    problem: 'Problem',
  },
} satisfies Record<
  OutputLanguage,
  {
    technicalContradiction: string;
    improving: string;
    worsening: string;
    noPrinciples: string;
    suggestedPrinciples: string;
    ifrTitle: string;
    goal: string;
    resources: string;
    currentStackExamples: string;
    detectedStack: string;
    language: string;
    idleResources: (count: number) => string;
    contradictions: (count: number) => string;
    source: string;
    suggestion: string;
    noContradictions: string;
    solveTitle: string;
    system: string;
    problem: string;
  }
>;

function c(text: string, color: ChalkInstance, opts: OutputOpts): string {
  return opts.noColor || opts.json ? text : color(text);
}

function ui(opts: OutputOpts) {
  return UI_TEXT[opts.lang];
}

export function printContradiction(result: ContradictionResult, opts: OutputOpts): void {
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const text = ui(opts);
  console.log('');
  console.log(c(text.technicalContradiction, chalk.bold.cyan, opts));
  console.log(`  ${text.improving.padEnd(10)}: ${c(`#${result.improving.id} ${result.improving.name}`, chalk.green, opts)}`);
  console.log(`  ${text.worsening.padEnd(10)}: ${c(`#${result.worsening.id} ${result.worsening.name}`, chalk.red, opts)}`);
  console.log('');

  if (result.principles.length === 0) {
    console.log(c(`  ${text.noPrinciples}`, chalk.gray, opts));
    return;
  }

  console.log(c(text.suggestedPrinciples, chalk.bold, opts));
  for (const principle of result.principles) {
    console.log(`  ${c(`#${String(principle.id).padEnd(2)} ${principle.name}`, chalk.yellow, opts)}`);
    console.log(`      ${principle.description}`);
    if (principle.examples?.length) {
      principle.examples.forEach((example) => console.log(`      ${c('->', chalk.gray, opts)} ${example}`));
    }
    console.log('');
  }
}

export function printIFR(result: IFRResult, opts: OutputOpts): void {
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const text = ui(opts);
  console.log('');
  console.log(c(text.ifrTitle, chalk.bold.cyan, opts));
  console.log(`  ${text.goal} : ${result.goal}`);
  console.log('');
  console.log(c(`  ${result.statement}`, chalk.white, opts));
  console.log('');
  console.log(c(text.resources, chalk.bold, opts));
  result.resources.forEach((resource) => console.log(`  ${c('*', chalk.yellow, opts)} ${resource}`));
  console.log('');
}

export function printPrinciple(principle: Principle, opts: OutputOpts): void {
  if (opts.json) {
    console.log(JSON.stringify(principle, null, 2));
    return;
  }

  const text = ui(opts);
  console.log('');
  console.log(`${c(`#${principle.id}`, chalk.bold.yellow, opts)} ${c(principle.name, chalk.bold, opts)}`);
  console.log(`  ${principle.description}`);
  if (principle.examples?.length) {
    console.log('');
    console.log(c(`  ${text.currentStackExamples}`, chalk.bold, opts));
    principle.examples.forEach((example) => console.log(`  ${c('->', chalk.gray, opts)} ${example}`));
  }
  console.log('');
}

export function printAudit(result: AuditResult, opts: OutputOpts): void {
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const text = ui(opts);
  const { stack } = result;
  console.log('');
  console.log(c(text.detectedStack, chalk.bold.cyan, opts));
  if (stack.runtime) console.log(`  Runtime  : ${stack.runtime}`);
  if (stack.framework) console.log(`  Framework: ${stack.framework}`);
  if (stack.orm) console.log(`  ORM      : ${stack.orm}`);
  if (stack.language) console.log(`  ${text.language.padEnd(8)}: ${stack.language}`);
  console.log('');

  if (result.idleResources.length > 0) {
    console.log(c(text.idleResources(result.idleResources.length), chalk.bold, opts));
    result.idleResources.forEach((resource) => console.log(`  ${c('*', chalk.yellow, opts)} ${resource}`));
    console.log('');
  }

  if (result.contradictions.length > 0) {
    console.log(c(text.contradictions(result.contradictions.length), chalk.bold, opts));
    result.contradictions.forEach((contradiction, index) => {
      const suggestion = result.suggestions[index]!;
      console.log(
        `  ${c(`${index + 1}.`, chalk.bold, opts)} ${suggestion.improving.name} (#${contradiction.improving}) <-> ${suggestion.worsening.name} (#${contradiction.worsening})`,
      );
      console.log(`     ${c(text.source, chalk.gray, opts)} ${contradiction.source}`);
      console.log(
        `     ${c(text.suggestion, chalk.gray, opts)} claw matrix --improve ${contradiction.improving} --worsen ${contradiction.worsening}`,
      );
    });
    console.log('');
  } else {
    console.log(c(text.noContradictions, chalk.green, opts));
    console.log('');
  }
}

export function printSolveReport(report: SolveReport, opts: OutputOpts): void {
  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const text = ui(opts);
  console.log('');
  console.log(c(text.solveTitle, chalk.bold.cyan, opts));
  console.log(`  ${text.system} : ${report.system}`);
  console.log(`  ${text.problem}: ${report.problem}`);
  console.log('');
  report.steps.forEach((step) => {
    console.log(`  ${step}`);
    console.log('');
  });
}
