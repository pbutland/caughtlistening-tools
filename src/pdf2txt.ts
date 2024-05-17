import * as fs from 'fs';
import log4js from 'log4js';
import { Command } from 'commander';
import { PdfReader } from 'pdfreader';

import { configureLogger } from './utils/logger.js';

const APP_NAME = 'pdf2txt';
configureLogger(APP_NAME);
const logger = log4js.getLogger(APP_NAME);

const program = new Command();

program
  .name(APP_NAME)
  .description('CLI to read a PDF and generate text files')
  .option('-o --output <string>', 'output directory', '.')
  .argument('<file>', 'PDF file to process')
  .action((file, options) => {
    run(file, options.output);
  });

await program.parseAsync(process.argv);

async function run(file: string, outputDir: string) {

  let pageNumber = 1;
  let outputPath: string;
  let lines: string[] = [];
  let lineIdx = 0;
  let lineNumber = false;
  let footer: string[] = [];
  new PdfReader({debug: false}).parseFileItems(file, function (err, item) {
    if (item?.page) {
      if (item?.page && item?.page > 1) {
        if (outputPath) {
          lines.push(...footer.reverse());
          logger.info(`Writing to ${outputPath}`);
          fs.writeFileSync(outputPath, lines.join('\n'));
        }
        const filename = `${('00000'+pageNumber).slice(-5)}.txt`;
        outputPath = `${outputDir}/${filename}`;
        ++pageNumber;
        lines = [];
        footer = [];
        lineIdx = 0;
        lineNumber = false;
      }
    } else if (item?.text) {
      if (lineIdx === 1 || lineIdx === 2) {
        // For some reason the PDF reader is reading the footer before the content, so need to cater for that
        footer.push(item.text);
        ++lineIdx;
      } else {
        if (item.text.match(/^\d{1,2}/)) {
          lineNumber = true;
          lines.push(item.text);
          ++lineIdx;
        } else if (lineNumber) {
          lineNumber = false;
          lines[lineIdx-3] += `   ${item.text}`;
        } else {
          lines.push(item.text);
          ++lineIdx;
        }
      }
    } else if (item === undefined) {
      lines.push(...footer.reverse());
      logger.info(`Writing to ${outputPath}`);
      fs.writeFileSync(outputPath, lines.join('\n'));
    }
  });
}