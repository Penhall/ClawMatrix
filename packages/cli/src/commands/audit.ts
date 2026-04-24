import { Command } from 'commander';
import { analyzeProject } from '@claw/engine';
import { printAudit } from '../format.js';
import type { OutputOpts } from '../format.js';

export const auditCommand = new Command('audit')
  .description('Analisa o repositório local em busca de contradições e recursos ociosos')
  .option('--dir <path>', 'diretório raiz do projeto (padrão: cwd)')
  .action(async (opts, cmd) => {
    const globalOpts = cmd.optsWithGlobals() as OutputOpts;
    const rootDir = opts.dir ?? process.cwd();
    try {
      const result = await analyzeProject(rootDir, globalOpts.lang);
      printAudit(result, globalOpts);
    } catch (error: unknown) {
      console.error((error as Error).message);
      process.exit(1);
    }
  });
