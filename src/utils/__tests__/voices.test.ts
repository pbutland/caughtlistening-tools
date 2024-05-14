import { describe, expect } from '@jest/globals';
import { isMale } from '../voices.js';

describe('isMale', () => {
  it.each`
  key                  | expected
  ${'MR.STEINGLASS: '} | ${true}
  ${'DR. ROBERTS'}     | ${true}
  ${'David'}           | ${true}
  ${'Doug'}            | ${true}
  ${'Gary'}            | ${true}
  ${'Jeffrey'}         | ${true}
  ${'Keith'}           | ${true}
  ${'MS.NECHELES'}     | ${false}
  ${'MRS.DANIELS'}     | ${false}
  `('isMale', ({ key, expected }) => {
    expect(isMale(key)).toEqual(expected);
  });
});
