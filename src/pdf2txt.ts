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
  .option('-d --dryrun')
  .argument('<file>', 'PDF file to process')
  .action((file, options) => {
    run(file, options.output, options.dryrun);
  });

await program.parseAsync(process.argv);

async function run(file: string, outputDir: string, dryrun: boolean) {

  let fileNumber = 1;
  let lineNumber: string | undefined;
  let index = false;
  const pages: any = [];
  let lines: any = [];

  new PdfReader({debug: false}).parseFileItems(file, function (err, item) {
    if(item !== undefined && !index) {
      if (item?.text === 'A') {
        index = true;
      } else if (item?.page) {
        if (lines.length > 0) {
          lines = lines.sort((lhs: any, rhs: any) => lhs.y - rhs.y);
          pages.push(lines);
        }
        lines = [];
      } else if (item?.text) {
        lines.push(item);
      }
    } else if (item === undefined) {
      lines = lines.sort((lhs: any, rhs: any) => lhs.y - rhs.y);
      if (!index) {
        pages.push(lines); // add last page
      }
      pages.shift(); // remove first page
      pages.forEach((page: any) => {      
        const formattedLines: string[] = [];
        formattedLines.push(page.shift().text);
        formattedLines.push(page.shift().text);
      
        const footers = []
        let lineIdx = 2;
        for (const line of page) {
          if (line.text && LINE_NUMBER_REGEX.test(line.text.trim())) { // Line number row
            lineNumber = line.text;
            formattedLines.push(line.text);
            ++lineIdx;
          } else if (lineNumber) { // Row after line number
            lineNumber = undefined;
            formattedLines[lineIdx-1] += `   ${line.text}`;
          } else if (line.text && LINE_WITH_NUMBER_REGEX.test(line.text.trim())) { // Line number row with text
            formattedLines.push(line.text);
            ++lineIdx;
          } else if (line.text) {
            footers.push(line.text);
          }
        }

        if (isPageNumber(formattedLines[0])) {
          // Sometimes page number comes first - in this case, swap first two lines
          const tmp = formattedLines[0];
          formattedLines[0] = formattedLines[1];
          formattedLines[1] = tmp;
        }

        formattedLines.push(...footers);

        const filename = `${('00000'+fileNumber).slice(-5)}.txt`;
        const outputPath = `${outputDir}/${filename}`;

        verify(filename, formattedLines);
        
        if (!dryrun) {
          logger.info(`Writing to ${outputPath}`);
          fs.writeFileSync(outputPath, formattedLines.join('\n'));
        }
        ++fileNumber;
      });
    }
  });
}

function verify(outputPath: string, lines: string[]) {
  lines.forEach((line, idx) => {
    if (idx === 1) {
      if(!/\d+/.test(line)) {
        logger.warn(`Invalid page number ${line} in ${outputPath}`);
      }
    } else if (idx > 1 && idx < 27) {
        // Separate line numbers from transcript text
        const values = line.split(/(^\w{1,2} ?)(.*)/);
        const lineNumber = values[1]?.trim();
        if (isNaN(parseInt(lineNumber))) {
          logger.warn(`Invalid line number ${line} in ${outputPath}`);
        }
    }
  });
}