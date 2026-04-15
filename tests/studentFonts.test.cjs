const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('student-facing styles import playful fonts and apply them by role', () => {
  const stylesSource = read('src/styles.css');

  assert.match(stylesSource, /fonts\.googleapis\.com/);
  assert.match(stylesSource, /Ma\+Shan\+Zheng/);
  assert.match(stylesSource, /Baloo\+2/);
  assert.match(stylesSource, /Nunito/);

  assert.match(stylesSource, /--font-display:\s*"Baloo 2"/);
  assert.match(stylesSource, /--font-hand:\s*"Ma Shan Zheng"/);
  assert.match(stylesSource, /--font-body:\s*"Nunito"/);

  assert.match(stylesSource, /html,[\s\S]*font-family:\s*var\(--font-body\)/);
  assert.match(stylesSource, /\.question-title\s*\{[\s\S]*font-family:\s*var\(--font-hand\)/);
  assert.match(stylesSource, /\.audio-bubble\s*\{[\s\S]*font-family:\s*var\(--font-display\)/);
  assert.match(stylesSource, /\.option-chip\s*\{[\s\S]*font-family:\s*var\(--font-display\)/);
});
