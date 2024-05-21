import * as fs from 'fs';
import log4js from 'log4js';
import { Command } from 'commander';
import { PdfReader } from 'pdfreader';

import { configureLogger } from './utils/logger.js';
import { isPageNumber } from './utils/utils.js';

const APP_NAME = 'pdf2txt';
configureLogger(APP_NAME);
const logger = log4js.getLogger(APP_NAME);

const LINE_NUMBER_REGEX = /^\d{1,2}$/;
const LINE_WITH_NUMBER_REGEX = /^\d{1,2}\s+.+/;

const program = new Command();

program
  .name(APP_NAME)
  .description('CLI to read a PDF and generate text files')
  .option('-o --output <string>', 'output directory', '.')
  .option('-v --verify')
  .argument('<file>', 'PDF file to process')
  .action((file, options) => {
    run(file, options.output, options.verify);
  });

await program.parseAsync(process.argv);

async function run(file: string, outputDir: string, verify: boolean) {

  let fileNumber = 1;
  let outputPath: string;
  let lines: string[] = [];
  let lineIdx = 0;
  let lineNumber = false;
  let headerFooter: string[] = [];
  let hasPageNumber = false;
  let index = false;

  new PdfReader({debug: false}).parseFileItems(file, function (err, item) {
    if (!index) {
      if (item?.text === 'A') {
        index = true;
        if (verify) {
          verifyFiles(outputDir, fileNumber-1)
        }
      }
      if (item?.page) {
        if (item?.page && item?.page > 1) { // ignore title page - too hard to parse in a meaningful way
          if (outputPath) {
            const header = headerFooter.shift();
            if (header) {
              lines.unshift(header);
            }
            lines.push(...headerFooter.reverse());
            logger.info(`Writing to ${outputPath}`);
            fs.writeFileSync(outputPath, lines.join('\n'));
          }
          const filename = `${('00000'+fileNumber).slice(-5)}.txt`;
          outputPath = `${outputDir}/${filename}`;
          ++fileNumber;
          lines = [];
          headerFooter = [];
          lineIdx = 0;
          lineNumber = false;
          hasPageNumber = false;
        }
      } else if (item?.text) {
        if (!hasPageNumber && isPageNumber(item.text)) { // Page number
          lines.push(item.text);
          ++lineIdx;
          hasPageNumber = true;
        } else if (LINE_NUMBER_REGEX.test(item.text.trim())) { // Line number row
          lineNumber = true;
          lines.push(item.text);
          ++lineIdx;
        } else if (lineNumber) { // Row after line number
          lineNumber = false;
          lines[lineIdx-1] += `   ${item.text}`;
        } else if (LINE_WITH_NUMBER_REGEX.test(item.text.trim())) { // Line number row with text
          lines.push(item.text);
          ++lineIdx;
        } else {
          // Header/Footer text is not always placed in the correct order
          headerFooter.push(item.text);
        }
      } else if (item === undefined) { // End of buffer, so write to last file
        const header = headerFooter.shift();
        if (header) {
          lines.unshift(header);
        }
        lines.push(...headerFooter.reverse());
        logger.info(`Writing to ${outputPath}`);
        fs.writeFileSync(outputPath, lines.join('\n'));

        if (verify) {
          verifyFiles(outputDir, fileNumber-1)
        }
      }
    }
  });
}

function verifyFiles(outputDir: string, numFiles: number) {
  for (let idx = 1; idx < numFiles; idx++) {
    const filename = `${('00000'+idx).slice(-5)}.txt`;
    const outputPath = `${outputDir}/${filename}`;
    logger.info(`Verifying ${outputPath}`);
    const allFileContents = fs.readFileSync(outputPath, 'utf-8');
    const lines = allFileContents.split(/\r?\n/);
  
    const indent = 72;
    lines.forEach((line, idx) => {
      switch ( idx ) {
        case 0: // Header
          break;
        case 1: // Page number
          if(!/\d+/.test(line)) {
            logger.warn(`Invalid page number ${line} in ${outputPath}`);
          }
          break;
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
        case 8:
        case 9:
        case 10:
        case 11:
        case 12:
        case 13:
        case 14:
        case 15:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 21:
        case 22:
        case 23:
        case 24:
        case 25:
        case 26:
            // Separate line numbers from transcript text
          const values = line.split(/(^\w{1,2} ?)(.*)/);
          const lineNumber = values[1]?.trim();
          if (isNaN(parseInt(lineNumber))) {
            logger.warn(`Invalid line number ${line} in ${outputPath}`);
          }
          break;
      }
    });
  }
}