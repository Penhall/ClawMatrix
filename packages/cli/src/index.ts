#!/usr/bin/env node
import { Command } from 'commander';
import { matrixCommand } from './commands/matrix.js';
import { conceptCommand } from './commands/concept.js';
import { ifrCommand } from './commands/ifr.js';
import { auditCommand } from './commands/audit.js';
import { solveCommand } from './commands/solve.js';

const program = new Command();

program
  .name('claw')
  .description('ClawMatrix — TRIZ problem-solving engine for engineers')
  .version('0.1.0')
  .option('--json', 'output as JSON (suppresses colors and formatting)', false)
  .option('--no-color', 'disable ANSI colors')
  .option('--lang <lang>', 'description language: pt or en', 'pt');

program.addCommand(matrixCommand);
program.addCommand(conceptCommand);
program.addCommand(ifrCommand);
program.addCommand(auditCommand);
program.addCommand(solveCommand);

program.parse();
