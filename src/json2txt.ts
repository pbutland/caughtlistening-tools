import * as fs from 'fs';
import { Command } from 'commander';
import log4js from 'log4js';
import { getLogger } from './utils/logger.js';

/**
 * Iterates over a list of json files and generates a plain text file
 */

const APP_NAME = 'json2txt';
const logger = getLogger(APP_NAME);

const program = new Command();

program
  .name(APP_NAME)
  .description('CLI to read json transcript files and generate plain text')
  .option('-o --output <string>', 'output file name', 'transcript.txt')
  .argument('<files...>', 'json files to process')
  .action((files, options) => run(files, options.output));

await program.parseAsync(process.argv);

async function run(files: ReadonlyArray<string>, outputFilename: string) {
  logger.info(`Processing ${files.length} files`);
  const allLines = files.map(file => readFile(file));

  const numCharacters = allLines.flat()
    .filter(line => !!line.text).map(line => line.text.length)
    .reduce((partialSum, a) => partialSum + a, 0);

  const lines = allLines.flat()
    .map(line => line.text ? `${line.character} ${line.text}` : line.character)
    .filter(text => !!text);

  logger.info(`Writing to ${outputFilename} (${numCharacters} characters)`);
  fs.writeFileSync(outputFilename, lines.join('\n\n'));
}

function readFile(file: string) {
  logger.info(`Processing ${file}`);
  const json = fs.readFileSync(file, 'utf-8');
  return JSON.parse(json);
}
