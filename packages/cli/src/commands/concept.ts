import { Command } from 'commander';
import { explainPrinciple } from '@claw/engine';
import { printPrinciple } from '../format.js';
import type { OutputOpts } from '../format.js';

export const conceptCommand = new Command('concept')
  .description('Explica um princípio inventivo (1-40)')
  .requiredOption('--principle <id>', 'ID do princípio (1-40)', parseInt)
  .action((opts, cmd) => {
    const globalOpts = cmd.optsWithGlobals() as OutputOpts;
    try {
      const principle = explainPrinciple(opts.principle, undefined, globalOpts.lang);
      printPrinciple(principle, globalOpts);
    } catch (error: unknown) {
      console.error((error as Error).message);
      process.exit(1);
    }
  });
