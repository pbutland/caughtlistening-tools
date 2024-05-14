import log4js from 'log4js';
import { Command } from 'commander';
import { run } from './json-transformers/json-to-text.js';
import { configureLogger } from './utils/logger.js';

/**
 * Iterates over a list of json files and generates a plain text file
 */

const APP_NAME = 'json2txt';
configureLogger(APP_NAME);
const logger = log4js.getLogger(APP_NAME);

const program = new Command();

program
  .name(APP_NAME)
  .description('CLI to read json transcript files and generate plain text')
  .option('-o --output <string>', 'output file name', 'transcript.txt')
  .argument('<files...>', 'json files to process')
  .action((files, options) => run(files, options.output));

await program.parseAsync(process.argv);
