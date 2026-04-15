const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('read aloud question removes in-question score display and emphasizes phrase + start button', () => {
  const componentSource = read('src/components/questions/ReadAloud.vue');
  const stylesSource = read('src/styles.css');

  assert.doesNotMatch(componentSource, /score-ring/);
  assert.doesNotMatch(componentSource, /emojiForWord/);
  assert.match(componentSource, /read-word-card/);
  assert.match(componentSource, /read-phrase-pop/);
  assert.match(componentSource, /read-start-btn/);
  assert.match(componentSource, /使用演示结果/);

  assert.match(stylesSource, /\.read-word-card\s*\{/);
  assert.match(stylesSource, /\.read-phrase-pop\s*\{/);
  assert.match(stylesSource, /\.read-start-btn\s*\{/);
});
