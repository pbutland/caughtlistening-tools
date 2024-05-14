import * as fs from 'fs';
import * as path from 'path';
import log4js from 'log4js';
import { createWorker, OEM } from 'tesseract.js';
import { Command, Option } from 'commander';
import { configureLogger } from './utils/logger.js';

/**
 * Iterates over a list of images and creates a text version for each image file
 */

const APP_NAME = 'png2txt';
configureLogger(APP_NAME);
const logger = log4js.getLogger(APP_NAME);

const program = new Command();

program
  .name(APP_NAME)
  .description('CLI to convert image files to text')
  .option('-o --output <string>', 'output directory', '.')
  .addOption(new Option('-e --engine <engine>', 'OCR engine to use').default('legacy').choices(['legacy', 'LTSM', 'combined']))
  .argument('<files...>', 'image files to process')
  .action((files, options) => run(files, options.output, options.engine));

await program.parseAsync(process.argv);

async function run(files: ReadonlyArray<string>, outputDir: string, engine: string) {
  const oem = engine === 'legacy' ? OEM.TESSERACT_ONLY : engine === 'LTSM' ? OEM.LSTM_ONLY : OEM.TESSERACT_LSTM_COMBINED;
  logger.info(`Processing ${files.length} files with ${engine} OCR engine`);
  for (const file of files) {
    const lines = await processImage(file, oem);

    const directoryPath = path.dirname(file);
    const outputFile = file.replace('.png', '.txt').replace(directoryPath, '');
    const outputPath = `${outputDir}${outputFile}`;
    
    logger.info(`Writing to ${outputPath}`);
    fs.writeFileSync(outputPath, lines.join('\n'));
  }
}

async function processImage(image: string, oem: OEM) {
  logger.info(`Processing ${image}`);
  const worker = await createWorker('eng', oem);
  const ret = await worker.recognize(image);
  const lines = ret.data.text.split(/\r?\n/).filter(str => /\w+/.test(str));
  await worker.terminate();
  return lines;
}
