import * as fs from 'fs';
import { ElevenLabsClient, play } from 'elevenlabs';
import { Command } from 'commander';
import { getLogger } from './utils/logger.js';

/**
 * Iterates over a list of json files and generates a series of mp3 files for each line in the json files
 */

const APP_NAME = 'json2mp3';
const logger = getLogger(APP_NAME);

const program = new Command();

program
  .name(APP_NAME)
  .description('CLI to read json transcript files and generate audio from it')
  .requiredOption('-k --key <string>', 'ElevenLabs API key')
  .option('-o --output <string>', 'output directory', '.')
  .argument('<files...>', 'json files to process')
  .action((files, options) => run(files, options.key, options.output));

await program.parseAsync(process.argv);

async function run(files: ReadonlyArray<string>, apiKey: string, outputDir: string) {
 const elevenlabs = new ElevenLabsClient({ apiKey });

  logger.info(`Processing ${files.length} files`);
  const linesArray = files.map(file => readFile(file));

  const lines = linesArray.flat()
    .filter(line => !!line.text);

  for (const line of lines) {
    const pageNumber = line.page.replace(/Page /i, '');
    const outputFileName = `p${pageNumber}-${line.lineNumber}.mp3`
    const outputPath = `${outputDir}/${outputFileName}`;

    logger.info(`Generating text for page ${pageNumber} line ${line.lineNumber} (${outputPath})`);
    try {
      const fileStream = fs.createWriteStream(outputPath);
  
      const audio = await elevenlabs.generate({
        voice: line.voice,
        text: line.text,
        model_id: "eleven_multilingual_v2"
      });

      logger.info(`Writing to ${outputPath}`);
      audio.pipe(fileStream);
    } catch (error) {
      logger.error(error);
    }
  };
}

function readFile(file: string) {
  logger.info(`Processing ${file}`);
  const json = fs.readFileSync(file, 'utf-8');
  return JSON.parse(json);
}
