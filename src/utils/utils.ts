export function stripSpecialCharacters(key: string) {
  return key.toUpperCase().trim().replaceAll(/^BY |[:\s]+|[\.]$/g, '');
}

/**
 * Identify speakers during direct/cross examination
 * 
 */
export function matches(str: string) {
  return str.toUpperCase().match(/(^Q\.?\s{1})|(^A\.?\s{1})|(^.*:).+/);
}

// Phrases to indicate speakers during direct/cross examination
const EXAMINATION_REGEX = /.*EXAMINATION.*BY (.*:)|BY (.*:)/;
const WITNESS_NAME_REGEX = /the people call ([a-zA-Z\s\.]*),?|the defense calls ([a-zA-Z\s\.]*),?/i;

export function matchesExamination(str: string) {
  const examination = str.match(EXAMINATION_REGEX);
  if (examination) {
    return examination[1] ? examination[1] : examination[2];
  }
}

export function matchesWitness(str: string) {
  const witness = str.match(WITNESS_NAME_REGEX);
  if (witness) {
    return witness[1] ? witness[1] : witness[2];
  }
}

const CHARACTER_SPLIT_REGEX = /(^\({1})|(^Q{1}\.\s)|(^Q{1}\s)|(^0{1}\.\s)|(^0{1}\s)|(^A{1}\.\s)|(^A{1}\s)|(^[A-Z .]*: )/;

export function splitCharacterFromText(str: string) {
  return str.split(CHARACTER_SPLIT_REGEX).filter(item => item !== undefined && item !== '')
}

export function getCleansedText(person: string, text: string, witnessCalled: boolean) {
  const cleansedText = witnessCalled ? person : person.startsWith('(') ? text.trim().slice(0, -1) : text;
  return cleansedText.replace(/^\*{3,}/, '').replaceAll(/\.  /g, '. ').trim();
}

const PAGE_REGEX = /^(Page.*)?(\d+)/i;

export function isPageNumber(text: string) {
  return PAGE_REGEX.test(text.replaceAll(/ /g, ''));
}