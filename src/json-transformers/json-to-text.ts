import * as fs from 'fs';
import log4js from 'log4js';

const logger = log4js.getLogger('json-to-text');

export async function run(files: ReadonlyArray<string>, outputFilename: string) {
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
