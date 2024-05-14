import { describe, expect } from '@jest/globals';
import * as fs from 'fs';
import { run } from '../json-to-text.js';

const BASE_DIR = '../caughtlistening/transcripts/';

describe('json-to-text', () => {
  it.each`
  input            | expected
  ${'240422.json'} | ${'240422.txt'}
  ${'240423.json'} | ${'240423.txt'}
  ${'240425.json'} | ${'240425.txt'}
  ${'240426.json'} | ${'240426.txt'}
  ${'240430.json'} | ${'240430.txt'}
  ${'240502.json'} | ${'240502.txt'}
  ${'240503.json'} | ${'240503.txt'}
  ${'240506.json'} | ${'240506.txt'}
  ${'240507.json'} | ${'240507.txt'}
  ${'240509.json'} | ${'240509.txt'}
  ${'240510.json'} | ${'240510.txt'}
  `('json-to-text regression', async ({ input, expected }) => {
    const inputFile = `${BASE_DIR}${input}`;
    if (fs.existsSync(inputFile)) {
      const outputFile = `./src/json-transformers/__tests__/output/${expected}`;
      await run([inputFile], outputFile);
      const expectedFile = `${BASE_DIR}${expected}`;
      expect(fs.readFileSync(outputFile)).toEqual(fs.readFileSync(expectedFile));
    }
  });
});
