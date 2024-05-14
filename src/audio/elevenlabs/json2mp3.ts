import * as fs from 'fs';
import log4js from 'log4js';
import { ElevenLabsClient, play } from 'elevenlabs';
import { Command } from 'commander';
import { configureLogger } from '../../utils/logger.js';

/**
 * Iterates over a list of json files and generates a series of mp3 files for each line in the json files
 */

const elevenLabsVoices = new Map([
  ['female_voice_1', 'Rachel'],
  ['female_voice_2', 'Sarah'],
  ['female_voice_3', 'Emily'],
  ['female_voice_4', 'Elli'],
  ['female_voice_5', 'Dorothy'],
  ['female_voice_6', 'Charlotte'],
  ['female_voice_7', 'Alice'],
  ['female_voice_8', 'Matilda'],
  ['female_voice_9', 'Freya'],
  ['female_voice_10', 'Grace'],
  ['female_voice_11', 'Lily'],
  ['female_voice_12', 'Serena'],
  ['female_voice_13', 'Nicole'],
  ['female_voice_14', 'Glinda'],
  ['female_voice_15', 'Mimi'],
  ['female_voice_16', 'Domi'],
  ['female_voice_17', 'Gigi'],
  ['female_voice_18', 'Samantha'],
  ['female_voice_19', 'Karen'],
  ['female_voice_20', 'Penny'],
  ['female_voice_21', 'Emma'],
  ['female_voice_22', 'Sophie'],
  ['male_voice_1', 'Jessie'],
  ['male_voice_2', 'Giovanni'],
  ['male_voice_3', 'Drew'],
  ['male_voice_4', 'Clyde'],
  ['male_voice_5', 'Paul'],
  ['male_voice_6', 'Dave'],
  ['male_voice_7', 'Fin'],
  ['male_voice_8', 'Antoni'],
  ['male_voice_9', 'Thomas'],
  ['male_voice_10', 'Charlie'],
  ['male_voice_11', 'George'],
  ['male_voice_12', 'Callum'],
  ['male_voice_13', 'Patrick'],
  ['male_voice_14', 'Harry'],
  ['male_voice_15', 'Liam'],
  ['male_voice_16', 'Josh'],
  ['male_voice_17', 'Arnold'],
  ['male_voice_18', 'James'],
  ['male_voice_19', 'Joseph'],
  ['male_voice_20', 'Jeremy'],
  ['male_voice_21', 'Michael'],
  ['male_voice_22', 'Ethan'],
  ['male_voice_23', 'Chris'],
  ['male_voice_24', 'Brian'],
  ['male_voice_25', 'Daniel'],
  ['male_voice_26', 'Adam'],
  ['male_voice_27', 'Bill']
]);

const APP_NAME = 'json2mp3';
configureLogger(APP_NAME);
const logger = log4js.getLogger(APP_NAME);

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
    const voice = elevenLabsVoices.get(line.voice);
    logger.info(`Generating text for page ${pageNumber} line ${line.lineNumber} (${outputPath}), using voice ${voice}`);
    try {
      const fileStream = fs.createWriteStream(outputPath);
  
      const audio = await elevenlabs.generate({
        voice,
        text: line.text,
        model_id: 'eleven_multilingual_v2'
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
