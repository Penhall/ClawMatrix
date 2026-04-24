import { Command } from 'commander';
import { solveContradiction } from '@claw/engine';
import { printSolveReport } from '../format.js';
import type { OutputOpts } from '../format.js';

export const solveCommand = new Command('solve')
  .description('Executa o workflow TRIZ de 5 passos para um problema')
  .requiredOption('--system <desc>', 'descrição do sistema')
  .requiredOption('--problem <desc>', 'descrição do problema ou contradição')
  .action((opts, cmd) => {
    const globalOpts = cmd.parent!.opts() as OutputOpts;
    try {
      const report = solveContradiction(opts.system, opts.problem);
      printSolveReport(report, globalOpts);
    } catch (e: unknown) {
      console.error((e as Error).message);
      process.exit(1);
    }
  });
