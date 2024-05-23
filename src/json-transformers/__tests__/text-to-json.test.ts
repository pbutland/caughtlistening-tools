import { describe, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { run } from '../text-to-json.js';
import { loadVoices } from '../../utils/voices.js';

const BASE_DIR = '../caughtlistening/transcripts/';

describe('text-to-json', () => {
  beforeEach(() => {
    loadVoices('./src/json-transformers/__tests__/voices.json');
  });

  it.each`
  input                 | expected
  ${'data/240422/text'} | ${'240422.json'}
  ${'data/240423/text'} | ${'240423.json'}
  ${'data/240425/text'} | ${'240425.json'}
  ${'data/240426/text'} | ${'240426.json'}
  ${'data/240430/text'} | ${'240430.json'}
  ${'data/240502/text'} | ${'240502.json'}
  ${'data/240503/text'} | ${'240503.json'}
  ${'data/240506/text'} | ${'240506.json'}
  ${'data/240507/text'} | ${'240507.json'}
  ${'data/240509/text'} | ${'240509.json'}
  ${'data/240510/text'} | ${'240510.json'}
  ${'data/240513/text'} | ${'240513.json'}
  ${'data/240514/text'} | ${'240514.json'}
  ${'data/240516/text'} | ${'240516.json'}
  ${'data/240520/text'} | ${'240520.json'}
  ${'data/240521/text'} | ${'240521.json'}
  `('text-to-json regression', async ({ input, expected }) => {
    const inputDir = `${BASE_DIR}${input}`;
    if (fs.existsSync(inputDir)) {
      const inputFiles = fs.readdirSync(inputDir)
        .filter(file => path.extname(file) === '.txt')
        .map(file => `${BASE_DIR}${input}/${file}`);
      const outputFile = `./src/json-transformers/__tests__/output/${expected}`;
      await run(inputFiles, outputFile, true);
      const expectedFile = `${BASE_DIR}${expected}`;
      expect(fs.readFileSync(outputFile)).toEqual(fs.readFileSync(expectedFile));
    }
  });
});
