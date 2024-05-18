import { describe, expect } from '@jest/globals';
import { matches, matchesExamination, matchesWitness, splitCharacterFromText, stripSpecialCharacters } from '../utils.js';

describe('stripSpecialCharacters', () => {
  it.each`
  text                  | expected
  ${'Q. '}              | ${'Q'}
  ${'MR. STEINGLASS: '} | ${'MR.STEINGLASS'}
  ${'MS . NECHELES'}    | ${'MS.NECHELES'}
  `('strip special characters', ({ text, expected }) => {
    expect(stripSpecialCharacters(text)).toEqual(expected);
  });
});

describe('matches', () => {
  it.each([
    'MS . NECHELES',
    'Question',
    'Qblah',
    'Q.blah',
    'Answer',
    'Ablah',
    'A.blah',
  ])('does not match', (text) => {
    expect(matches(text)).toBeNull();
  });

  it.each([
    'MS . NECHELES: blah',
    'Q blah',
    'Q. blah',
    'A blah',
    'A. blah',
  ])('does match', (text) => {
    expect(matches(text)).not.toBeNull();
  });
});

describe('matchesExamination', () => {
  it.each`
    text                                                        | expected
    ${'DIRECT EXAMINATION (Continued.) 9 BY MR . STE INGLASS:'} | ${'MR . STE INGLASS:'}
    ${'DIRECT EXAMINATION BY MR . STE INGLASS:'}                | ${'MR . STE INGLASS:'}
    ${'DIRECT EXAMINATION BY MR. STEINGLASS:'}                  | ${'MR. STEINGLASS:'}
    ${'BY MR. STEINGLASS:'}                                     | ${'MR. STEINGLASS:'}
  `('matches', ({ text, expected }) => {
    expect(matchesExamination(text)).toEqual(expected);
  });
});

describe('matchesWitness', () => {
  it.each`
    text                                              | expected
    ${'The People call David Pecker'}                 | ${'David Pecker'}
    ${'At this time, the People call Doug Daus'}      | ${'Doug Daus'}
    ${'The People call Stormy Daniels, your Honour.'} | ${'Stormy Daniels'}
  `('matches', ({ text, expected }) => {
    expect(matchesWitness(text)).toEqual(expected);
  });
});

describe('splitCharacterFromText', () => {
  it.each`
    lineText                       | expectedPerson   | expectedText
    ${'THE COURT: Ms. Hoffinger.'} | ${'THE COURT: '} | ${'Ms. Hoffinger.'}
  `('matches', ({ lineText, expectedPerson, expectedText }) => {
    const [person, text] = splitCharacterFromText(lineText);
    expect(person).toEqual(expectedPerson);
    expect(text).toEqual(expectedText);
  });
});
