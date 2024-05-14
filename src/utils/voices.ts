import * as fs from 'fs';
import log4js from 'log4js';
import stringSimilarity from 'string-similarity';

const logger = log4js.getLogger('voices');

const DEFAULT_VOICE_FILE = "voices.json";
let voicesFileName = DEFAULT_VOICE_FILE;
let voices = new Map();

let maleVoiceIdx = 1;
let femaleVoiceIdx = 1;
const MALE_VOICE_PREFIX = "male_voice_";
const FEMALE_VOICE_PREFIX = "female_voice_";

const MALE_PREFIX_REGEX = /^(mr\.|dr\.|david|doug|gary|jeffrey|keith)/i
export function isMale(key: string) {
  return !!key.match(MALE_PREFIX_REGEX)?.length;
}

/**
 * Returns a voice for the give key (using fuzzy matching to cater for typos)
 * Either returns a voice from the map of voices or picks a new voice from the list of available voices and saves to the voices file
 */
const matchedKeys: string[] = [];
export function getVoice(key: string) {
  const MATCH_THRESHOLD = 0.65;
  let voice;
  const keys = Array.from(voices.keys());
  if (keys.length !== 0) {
    const matches = stringSimilarity.findBestMatch(key, keys);

    const bestKey = matches.bestMatch?.rating > MATCH_THRESHOLD ? matches.bestMatch?.target : undefined;
    if (bestKey) {
      if (!matchedKeys.includes(key) && matches.bestMatch?.rating !== 1) {
        logger.info(`Matched ${key} with ${bestKey} with rating ${matches.bestMatch?.rating}`);
      }
      matchedKeys.push(key);
    }
    voice = bestKey ? voices.get(bestKey) : undefined;
  }
  if (voice === undefined) {
    if (isMale(key)) {
      voice = `${MALE_VOICE_PREFIX}${maleVoiceIdx}`;
      ++maleVoiceIdx;
    } else {
      voice = `${FEMALE_VOICE_PREFIX}${femaleVoiceIdx}`;
      ++femaleVoiceIdx;
    }
    voices.set(key, voice);
    saveVoices();
  }
  return voice;
}

/**
 * Set a voice for a character, based on the given key, with alternatives.
 * If voice already exists for character then use that to override any existing alternatives
 */
export function setVoice(key: string, alternatives: ReadonlyArray<string>) {
  const voice = getVoice(key);
  alternatives.forEach(alternative => {
    voices.set(alternative, voice);
  });
  saveVoices();
}

export function saveVoices() {
  const sortedMap = Array.from(voices).sort((a, b) => a[1].localeCompare(b[1]));
  const obj = Object.fromEntries(sortedMap);
  const serialized = JSON.stringify(obj);
  fs.writeFileSync(voicesFileName, serialized);   
}

export function loadVoices(fileName: string) {
  voicesFileName = fileName;
  if (fs.existsSync(voicesFileName)) {
    const json = fs.readFileSync(voicesFileName, 'utf8');
    const obj = JSON.parse(json);
    voices = new Map(Object.entries(obj));
    maleVoiceIdx = 0;
    femaleVoiceIdx = 0;
    voices.forEach(entry => {
      const femaleVoice = entry.match(/^female_voice_(\d+)/);
      const femaleIdx = femaleVoice ? parseInt(femaleVoice[1]) : 0;
      femaleVoiceIdx = femaleIdx > femaleVoiceIdx ? femaleIdx : femaleVoiceIdx;
      const maleVoice = entry.match(/^male_voice_(\d+)/);
      const maleIdx = maleVoice ? parseInt(maleVoice[1]) : 0;
      maleVoiceIdx = maleIdx > maleVoiceIdx ? maleIdx : maleVoiceIdx;
    });
    ++femaleVoiceIdx;
    ++maleVoiceIdx;
  }
}
