import { Command } from 'commander';
import { lookupMatrix } from '@claw/engine';
import { printContradiction } from '../format.js';
import type { OutputOpts } from '../format.js';

export const matrixCommand = new Command('matrix')
  .description('Consulta a matriz de contradições 39×39')
  .requiredOption('--improve <id>', 'parâmetro que está melhorando (1–39)', parseInt)
  .requiredOption('--worsen <id>', 'parâmetro que está piorando (1–39)', parseInt)
  .action((opts, cmd) => {
    const globalOpts = cmd.parent!.opts() as OutputOpts;
    try {
      const result = lookupMatrix(opts.improve, opts.worsen);
      printContradiction(result, globalOpts);
    } catch (e: unknown) {
      console.error((e as Error).message);
      process.exit(1);
    }
  });
