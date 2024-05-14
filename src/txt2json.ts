import log4js from 'log4js';
import { Command } from 'commander';
import { run } from './json-transformers/text-to-json.js';
import { configureLogger } from './utils/logger.js';
import { loadVoices } from './utils/voices.js';

const APP_NAME = 'txt2json';
configureLogger(APP_NAME);
const logger = log4js.getLogger(APP_NAME);

const program = new Command();

program
  .name(APP_NAME)
  .description('CLI to read text files and generate a json file')
  .option('-v --voices <string>', 'voice file to use for characters', 'voices.json')
  .option('-o --output <string>', 'output file name', 'transcript.json')
  .option('-p --pretty', 'format json output')
  .argument('<files...>', 'text files to process')
  .action((files, options) => {
    loadVoices(options.voices);
    run(files, options.output, options.pretty);
  });

await program.parseAsync(process.argv);
