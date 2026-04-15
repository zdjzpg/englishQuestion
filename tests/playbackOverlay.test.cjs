const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('playback overlay waits for mounted refs before starting GSAP animation', () => {
  const source = read('src/components/shared/PlaybackAnimalOverlay.vue');

  assert.match(source, /import\s+\{\s*computed,\s*nextTick,\s*onBeforeUnmount,\s*ref,\s*watch\s*\}\s+from\s+'vue'/);
  assert.match(source, /await nextTick\(\);/);
  assert.match(source, /if\s*\(!targets\)\s*\{\s*return;\s*\}/);
  assert.match(source, /watch\(\(\)\s*=>\s*props\.open,[\s\S]*flush:\s*'post'/);
});
