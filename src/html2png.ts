import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { getLogger } from './utils/logger.js';

/**
 * Iterates over a list of html transcript files and extracts an image for each file and saves each image as a png
 */

const IMAGE_DATA_REGEX = /<img src="data:image\/png;base64,(.*)" .*>/;

const APP_NAME = 'html2png';
const logger = getLogger(APP_NAME);

const program = new Command();

program
  .name(APP_NAME)
  .description('CLI to read HTML transcript files and extract images')
  .option('-o --output <string>', 'output directory', '.')
  .argument('<files...>', 'HTML files to process')
  .action((files, options) => run(files, options.output));

await program.parseAsync(process.argv);

async function run(files: ReadonlyArray<string>, outputDir: string) {
  logger.info(`Processing ${files.length} files`);
  files.forEach(file => {
    logger.info(`Processing ${file}`);
    const inputHtml = fs.readFileSync(file, 'utf8');
    const imageMatch = inputHtml.match(IMAGE_DATA_REGEX);
    if (!imageMatch) {
      logger.error(`Failed to extract image from ${file}`);
      return;
    }

    const directoryPath = path.dirname(file);
    const outputFile = file.replace('.html', '.png').replace(directoryPath, '');
    const outputPath = `${outputDir}${outputFile}`;
    
    logger.info(`Writing to ${outputPath}`);
    fs.writeFileSync(outputPath, Buffer.from(imageMatch[1], 'base64'));
  });
}
