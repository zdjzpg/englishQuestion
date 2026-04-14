const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('paper repository persists listen choose image questions as choice lists', () => {
  const source = read('server/paperRepository.js');

  assert.match(source, /choices:\s*Array\.isArray\(question\.choices\)/);
  assert.match(source, /correctChoiceId:\s*question\.correctChoiceId \|\| ''/);
  assert.doesNotMatch(source, /wordsText:\s*question\.wordsText \|\| ''/);
});
