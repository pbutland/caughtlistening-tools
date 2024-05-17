import * as fs from 'fs';
import * as jq from 'node-jq';
import log4js from 'log4js';
import { matchesExamination, matchesWitness, stripSpecialCharacters } from '../utils/utils.js';
import { getVoice, setVoice } from '../utils/voices.js';

// regex to split character part from text (e.g. THE COURT: Good morning)
const CHARACTER_SPLIT_REGEX = /(^\({1})|(^Q{1}\.\s)|(^Q{1}\s)|(^O{1}\.\s)|(^O{1}\s)|(^0{1}\.\s)|(^0{1}\s)|(^A{1}\.\s)|(^A{1}\s)|(^[A-Z .]*: )/;
// regex to identify character during examination
const REGEX_EXAMINATION = /(^.*EXAMINATION)|(^\*{3,})|(^\({1})|(^Q\.?\s{1})|(^O\.?\s{1})|(^0\.?\s{1})|(^A\.?\s{1})|(^[A-Z .]*: )/;
// regex to identify character outside of examination
const REGEX_NORMAL = /(^.*EXAMINATION)|(^\*{3,})|(^\({1})|(^[A-Z .]*: )/;
const REGEX_WITNESS_CALLED = /, called as a witness|, called as witness/;

interface LineDetails {
  page: string;
  lineNumber: string,
  lineText?: string,
  character?: string,
  voice?: string,
  text?: string,
}

const logger = log4js.getLogger('text-to-json');

export async function run(files: ReadonlyArray<string>, outputFileName: string, pretty: boolean) {
  logger.info(`Processing ${files.length} files`);
  const pages = files.map(file => {
    return readFile(file);
  });

  const cleansedLines = cleanLines(pages);  
  const linesByCharacter = collateIntoCharacterPerLine(cleansedLines);
  const lineDetails = constructLineDetails(linesByCharacter);

  let jsonString = JSON.stringify(lineDetails);
  if (pretty) {
    jsonString = (await jq.run('.', lineDetails, { input: 'json' })).toString();
  }
  fs.writeFileSync(outputFileName, jsonString);
}

function readFile(file: string) {
  logger.info(`Processing ${file}`);
  const allFileContents = fs.readFileSync(file, 'utf-8');
  return allFileContents.split(/\r?\n/);
}

/**
 * Takes a list of pages of a transcript and strips superfluous data and constructs an object for each line which
 * contains the main character/text data along with metadata for each line.
 */
function cleanLines(pages: string[][]): LineDetails[] {
  // parse metadata and construct object representing each line
  return pages.map(lines => {
    // remove header
    lines.shift();
    // remove last 2 lines (court reporter details)
    lines.splice(lines.length - 2, lines.length);

    // page number
    const page = lines.splice(0, 1);
  
    return lines.map(line => {
      // Separate line numbers from transcript text
      const splitLine = line.split(/(^\w{1,2} ?)(.*)/);
      return {
        page: page[0].trim(),
        lineNumber: splitLine[1] ? splitLine[1].trim() : undefined,
        lineText: splitLine[2] ? splitLine[2].trim() : undefined,
      } as LineDetails;
    });
  }).flat();
}

/**
 * Parse lines to identify speaking characters and group text by character
 * Also identifies Q/A examiner and witness character identifiers
 */
function collateIntoCharacterPerLine(lines: ReadonlyArray<LineDetails>): LineDetails[] {
  const array: LineDetails[] = [];
  var arrayIdx = -1;
  let regex = REGEX_NORMAL;
  let currentCharacter = '';
  let newPage = false;
  let witnessCalled = false;
  lines.forEach((line, index) => {
    if (regex === REGEX_EXAMINATION && line.lineText?.match(/.* the witness is excused .*/)) {
      // end of witness direct/cross examination
      regex = REGEX_NORMAL;
    }
    if (regex === REGEX_NORMAL && line.lineText?.match(/.*EXAMINATION.*/)) {
      // start of witness direct/cross examination
      regex = REGEX_EXAMINATION;
    }
    const nextLine = index < lines.length-1 ? lines[index+1].lineText : undefined;
    witnessCalled = !witnessCalled && (!!line.lineText && REGEX_WITNESS_CALLED.test(line.lineText) ||
      (!!nextLine && /^(herein, )?called as (a )?witness/.test(nextLine)));
    
    if (line.lineText === undefined || line.lineText.match(regex) || newPage || witnessCalled) {
      // if text is continued onto another page then remember the previous speaker
      const newCharacterLine = line.lineText?.split(CHARACTER_SPLIT_REGEX).filter(item => item !== undefined && item !== '');
      if (newPage) {
        if (newCharacterLine?.length && newCharacterLine?.length > 1) {
          currentCharacter = newCharacterLine[0];
        } else if (!line.lineText?.startsWith("(") && !line.lineText?.match(/.*EXAMINATION.*/) && !line.lineText?.match(/^BY .*/)) {
          line.lineText = `${currentCharacter}${line.lineText}`;
        }
        newPage = false;
      } else if (line.lineText?.match(/continued from.*previous page/i)) {
        newPage = true;
      }

      array.push(line);
      arrayIdx++;
      if (newCharacterLine?.length && newCharacterLine?.length > 1 && !newCharacterLine[0].trim().startsWith("(")) {
        currentCharacter = newCharacterLine[0];
      }
    } else {
      witnessCalled = false;
      array[arrayIdx].lineText += ` ${line.lineText}`;
    }
  });
  return array;
}

/**
 * Constructs an object per line which represents both the text and metadata for each line in the transcript
 */
function constructLineDetails(lines: ReadonlyArray<LineDetails>) {
  return lines.map(line => {
    const lineText = line.lineText;
    if (lineText === undefined) {
      // text can be undefined for blank lines
      return line;
    }

    // identify if direct or cross examination has started and set voice and return line object
    const examinerVoice = lineText ? matchesExamination(lineText) : undefined;
    if (examinerVoice) {
      let examinerKey = stripSpecialCharacters(examinerVoice);
      setVoice(examinerKey, ['Q']);
      return {
        page: line.page,
        lineNumber: line.lineNumber,
        character: line.lineText,
      }
    }

    const [person, text] = lineText.split(CHARACTER_SPLIT_REGEX).filter(item => item !== undefined && item !== '');

    // identify if witness has been called and set voice
    const witnessCalled = REGEX_WITNESS_CALLED.test(person);
    const witness = text ? matchesWitness(text) : undefined;
    if (witness) {
      setVoice(witness, ['THEWITNESS', 'A']);
    }

    // get voice for character and return object for line
    if (text !== undefined || witnessCalled) {
      const cleansedPerson = person.replace(/^O.? /, 'Q '); // "O " misidentified as "Q "
      let personKey = stripSpecialCharacters(cleansedPerson);
      let voice = getVoice('(');
      if (!witnessCalled) {
        voice = getVoice(personKey);
      }
      return {
        page: line.page,
        lineNumber: line.lineNumber,
        character: cleansedPerson.startsWith('(') || witnessCalled ? 'AUDIO DESCRIPTION:' : cleansedPerson.trim(),
        voice: voice,
        text: witnessCalled ? person.trim() : cleansedPerson.startsWith('(') ? text.trim().slice(0, -1) : text.trim(),
      }
    }
  }).filter(object => object !== undefined);
}