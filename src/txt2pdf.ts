import * as fs from 'fs';
import log4js from 'log4js';
import PDFDocument from "pdfkit";
import { Command, Option } from 'commander';
import { configureLogger } from './utils/logger.js';

/**
 * Iterates over a list of text transcript files and combines them all into a single PDF file
 */

const APP_NAME = 'txt2pdf';
configureLogger(APP_NAME);
const logger = log4js.getLogger(APP_NAME);

const program = new Command();

program
  .name(APP_NAME)
  .description('CLI to convert text files to a PDF document')
  .option('-o --output <string>', 'output file name', 'transcript.pdf')
  .argument('<files...>', 'text files to process')
  .action((files, options) => run(files, options.output));

await program.parseAsync(process.argv);

async function run(files: ReadonlyArray<string>, outputFilename: string) {
  logger.info(`Processing ${files.length} files`);
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(outputFilename));
  doc.font('Courier');
  doc.fontSize(10);
  
  logger.info(`Processing ${files.length} files`);
  files.forEach((file, idx) => {
    if (idx > 0){
      doc.addPage();
    }
    parseFile(file, doc);
  });
  
  doc.save().end();
}

function parseFile(file: string, doc: typeof PDFDocument) {
  logger.info(`Processing ${file}`);
  const allFileContents = fs.readFileSync(file, 'utf-8');
  const lines = allFileContents.split(/\r?\n/);

  const indent = 72;
  lines.forEach((line, idx) => {
    switch ( idx ) {
      case 0: // Header
        doc.text(line, {align: 'center'}).moveDown();
        break;
      case 1: // Page number
        doc.text(line, {align: 'right'}).moveDown();
        break;
      case 27: // Footer
        doc.moveDown().moveDown();
        doc.text(line, {align: 'center'}).moveDown(); // Footer
        break;
      case 28: // Footer
        doc.text(line, {align: 'center'}).moveDown(); // Footer
        break;
      default: 
        // Separate line numbers from transcript text
        const values = line.split(/(^\w{1,2} ?)(.*)/);
        if (values[2] === '') {
          values[2] = ' ';
        }
        doc.text(values[1]).moveUp(); // Line number
        doc.text(values[2], {indent: indent}).moveDown(); // Text
        break;
    }
  });
}
