import ffmpeg from 'fluent-ffmpeg';
import log4js from 'log4js';
import { Command, Option } from 'commander';
import { configureLogger } from '../utils/logger.js';

/**
 * Takes a list of mp3 files and concatenates them into a single mp3 file
 */

const APP_NAME = 'mergemp3s';
configureLogger(APP_NAME);
const logger = log4js.getLogger(APP_NAME);

const program = new Command();

program
  .name(APP_NAME)
  .description('CLI to concatenate mp3 files into a single mp3 file. Requires ffmpeg')
  .option('-o --output <string>', 'output file name', 'transcript.mp3')
  .argument('<files...>', 'mp3 files to process')
  .action((files, options) => run(files, options.output));

await program.parseAsync(process.argv);

async function run(files: ReadonlyArray<string>, outputFilename: string) {
  logger.info(`Processing ${files.length} files`);
  const concat = ffmpeg();

  files.forEach(file => {
    logger.info(`Processing ${file}`);
    concat.input(file);
  });

  logger.info(`Writing to ${outputFilename}`);
  concat
    .on('end', function () {
      logger.info('Concatenation finished.');
    })
    .on('error', function (err) {
      logger.error('Error:', err);
    })
    .mergeToFile(outputFilename, '.');
}
