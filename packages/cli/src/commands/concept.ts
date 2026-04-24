import { Command } from 'commander';
import { explainPrinciple } from '@claw/engine';
import { printPrinciple } from '../format.js';
import type { OutputOpts } from '../format.js';

export const conceptCommand = new Command('concept')
  .description('Explica um princípio inventivo (1–40)')
  .requiredOption('--principle <id>', 'ID do princípio (1–40)', parseInt)
  .action((opts, cmd) => {
    const globalOpts = cmd.parent!.opts() as OutputOpts;
    try {
      const principle = explainPrinciple(opts.principle);
      printPrinciple(principle, globalOpts);
    } catch (e: unknown) {
      console.error((e as Error).message);
      process.exit(1);
    }
  });
