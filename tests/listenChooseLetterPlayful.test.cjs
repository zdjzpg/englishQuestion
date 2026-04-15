const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('listen-choose-letter uses playful nest targets and scattered loose letters', () => {
  const source = read('src/components/questions/ListenChooseLetter.vue');
  const styles = read('src/styles.css');

  assert.match(source, /letter-home-board/);
  assert.match(source, /loose-letter-garden/);
  assert.match(source, /loose-letter-card/);
  assert.doesNotMatch(source, /letter-pool-label/);
  assert.doesNotMatch(source, /letter-choice-grid/);
  assert.doesNotMatch(source, /letter-drop-label/);

  assert.match(styles, /\.letter-home-board\s*\{/);
  assert.match(styles, /\.loose-letter-garden\s*\{/);
  assert.match(styles, /\.loose-letter-card\s*\{/);
});
