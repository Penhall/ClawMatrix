import { Command } from 'commander';
import { solveContradiction } from '@claw/engine';
import { printSolveReport } from '../format.js';
import type { OutputOpts } from '../format.js';

export const solveCommand = new Command('solve')
  .description('Executa o workflow TRIZ de 5 passos para um problema')
  .requiredOption('--system <desc>', 'descrição do sistema')
  .requiredOption('--problem <desc>', 'descrição do problema ou contradição')
  .action((opts, cmd) => {
    const globalOpts = cmd.optsWithGlobals() as OutputOpts;
    try {
      const report = solveContradiction(opts.system, opts.problem, globalOpts.lang);
      printSolveReport(report, globalOpts);
    } catch (error: unknown) {
      console.error((error as Error).message);
      process.exit(1);
    }
  });
