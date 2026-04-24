import { Command } from 'commander';
import { generateIFR } from '@claw/engine';
import { printIFR } from '../format.js';
import type { OutputOpts } from '../format.js';

export const ifrCommand = new Command('ifr')
  .description('Gera a declaração de Resultado Final Ideal (IFR)')
  .requiredOption('--goal <desc>', 'objetivo ou problema a resolver')
  .action((opts, cmd) => {
    const globalOpts = cmd.optsWithGlobals() as OutputOpts;
    try {
      const result = generateIFR(opts.goal, globalOpts.lang);
      printIFR(result, globalOpts);
    } catch (error: unknown) {
      console.error((error as Error).message);
      process.exit(1);
    }
  });
