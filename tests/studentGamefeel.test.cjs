const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('listen choose image and look choose word use more playful student-side structures', () => {
  const listenChooseImageSource = read('src/components/questions/ListenChooseImage.vue');
  const lookChooseWordSource = read('src/components/questions/LookChooseWord.vue');
  const stylesSource = read('src/styles.css');

  assert.match(listenChooseImageSource, /listen-image-stage/);
  assert.match(listenChooseImageSource, /choice-card sticker-choice-card/);
  assert.match(listenChooseImageSource, /听一听，点它！/);

  assert.match(lookChooseWordSource, /look-word-stage/);
  assert.match(lookChooseWordSource, /word-sticker/);
  assert.match(lookChooseWordSource, /看看是谁，点单词！/);

  assert.match(stylesSource, /\.sticker-choice-card\s*\{/);
  assert.match(stylesSource, /\.look-word-stage\s*\{/);
  assert.match(stylesSource, /\.word-sticker\s*\{/);
});
