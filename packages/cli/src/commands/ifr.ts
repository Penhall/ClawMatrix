import { Command } from 'commander';
import { generateIFR } from '@claw/engine';
import { printIFR } from '../format.js';
import type { OutputOpts } from '../format.js';

export const ifrCommand = new Command('ifr')
  .description('Gera a declaração de Resultado Final Ideal (IFR)')
  .requiredOption('--goal <desc>', 'objetivo ou problema a resolver')
  .action((opts, cmd) => {
    const globalOpts = cmd.parent!.opts() as OutputOpts;
    try {
      const result = generateIFR(opts.goal);
      printIFR(result, globalOpts);
    } catch (e: unknown) {
      console.error((e as Error).message);
      process.exit(1);
    }
  });
