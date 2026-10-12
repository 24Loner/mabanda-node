const test = require('node:test');
const assert = require('node:assert/strict');

const { isValidRegistrationNumber, normalizeRegistrationNumber } = require('../server');

test('registration numbers accept the school format and normalize whitespace', () => {
  assert.equal(normalizeRegistrationNumber(' ABC / F1 / 001 / 2026 '), 'ABC/F1/001/2026');
  assert.equal(normalizeRegistrationNumber('abc/f1/001/2026'), 'ABC/F1/001/2026');
  assert.equal(isValidRegistrationNumber('ABC/F1/001/2026'), true);
  assert.equal(isValidRegistrationNumber('ABC/F1/002/2026'), true);
  assert.equal(isValidRegistrationNumber('ABC/F1/1/2026'), false);
  assert.equal(isValidRegistrationNumber('AB/F1/001/2026'), false);
});
