import chalk, { type ChalkInstance } from 'chalk';
import type { ContradictionResult, IFRResult, AuditResult, Principle, SolveReport } from '@claw/engine';

export interface OutputOpts {
  json: boolean;
  noColor: boolean;
  lang: 'pt' | 'en';
}

function c(text: string, color: ChalkInstance, opts: OutputOpts): string {
  return opts.noColor || opts.json ? text : color(text);
}

export function printContradiction(result: ContradictionResult, opts: OutputOpts): void {
  if (opts.json) { console.log(JSON.stringify(result, null, 2)); return; }

  console.log('');
  console.log(c('Contradição Técnica', chalk.bold.cyan, opts));
  console.log(`  Melhorando : ${c(`#${result.improving.id} ${result.improving.name}`, chalk.green, opts)}`);
  console.log(`  Piorando   : ${c(`#${result.worsening.id} ${result.worsening.name}`, chalk.red, opts)}`);
  console.log('');

  if (result.principles.length === 0) {
    console.log(c('  (nenhum princípio documentado para esta combinação)', chalk.gray, opts));
    return;
  }

  console.log(c('Princípios sugeridos:', chalk.bold, opts));
  for (const p of result.principles) {
    console.log(`  ${c(`#${String(p.id).padEnd(2)} ${p.name}`, chalk.yellow, opts)}`);
    console.log(`      ${p.description}`);
    if (p.examples?.length) {
      p.examples.forEach((ex) => console.log(`      ${c('→', chalk.gray, opts)} ${ex}`));
    }
    console.log('');
  }
}

export function printIFR(result: IFRResult, opts: OutputOpts): void {
  if (opts.json) { console.log(JSON.stringify(result, null, 2)); return; }

  console.log('');
  console.log(c('Resultado Final Ideal (IFR)', chalk.bold.cyan, opts));
  console.log(`  Objetivo : ${result.goal}`);
  console.log('');
  console.log(c('  ' + result.statement, chalk.white, opts));
  console.log('');
  console.log(c('Recursos a explorar:', chalk.bold, opts));
  result.resources.forEach((r) => console.log(`  ${c('•', chalk.yellow, opts)} ${r}`));
  console.log('');
}

export function printPrinciple(p: Principle, opts: OutputOpts): void {
  if (opts.json) { console.log(JSON.stringify(p, null, 2)); return; }

  console.log('');
  console.log(`${c(`#${p.id}`, chalk.bold.yellow, opts)} ${c(p.name, chalk.bold, opts)}`);
  console.log(`  ${p.description}`);
  if (p.examples?.length) {
    console.log('');
    console.log(c('  Exemplos no stack atual:', chalk.bold, opts));
    p.examples.forEach((ex) => console.log(`  ${c('→', chalk.gray, opts)} ${ex}`));
  }
  console.log('');
}

export function printAudit(result: AuditResult, opts: OutputOpts): void {
  if (opts.json) { console.log(JSON.stringify(result, null, 2)); return; }

  const { stack } = result;
  console.log('');
  console.log(c('Stack detectado', chalk.bold.cyan, opts));
  if (stack.runtime)   console.log(`  Runtime  : ${stack.runtime}`);
  if (stack.framework) console.log(`  Framework: ${stack.framework}`);
  if (stack.orm)       console.log(`  ORM      : ${stack.orm}`);
  if (stack.language)  console.log(`  Linguagem: ${stack.language}`);
  console.log('');

  if (result.idleResources.length > 0) {
    console.log(c(`Recursos ociosos detectados (${result.idleResources.length})`, chalk.bold, opts));
    result.idleResources.forEach((r) => console.log(`  ${c('•', chalk.yellow, opts)} ${r}`));
    console.log('');
  }

  if (result.contradictions.length > 0) {
    console.log(c(`Contradições encontradas (${result.contradictions.length})`, chalk.bold, opts));
    result.contradictions.forEach((cont, i) => {
      const s = result.suggestions[i];
      console.log(`  ${c(`${i + 1}.`, chalk.bold, opts)} ${s.improving.name} (#${cont.improving}) ↔ ${s.worsening.name} (#${cont.worsening})`);
      console.log(`     ${c('Fonte:', chalk.gray, opts)} ${cont.source}`);
      console.log(`     ${c('Sugestão:', chalk.gray, opts)} claw matrix --improve ${cont.improving} --worsen ${cont.worsening}`);
    });
    console.log('');
  } else {
    console.log(c('Nenhuma contradição detectada.', chalk.green, opts));
    console.log('');
  }
}

export function printSolveReport(report: SolveReport, opts: OutputOpts): void {
  if (opts.json) { console.log(JSON.stringify(report, null, 2)); return; }

  console.log('');
  console.log(c('Workflow TRIZ — 5 Passos', chalk.bold.cyan, opts));
  console.log(`  Sistema : ${report.system}`);
  console.log(`  Problema: ${report.problem}`);
  console.log('');
  report.steps.forEach((step) => {
    console.log(`  ${step}`);
    console.log('');
  });
}
