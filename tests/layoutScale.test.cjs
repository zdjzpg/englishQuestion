const test = require('node:test');
const assert = require('node:assert/strict');

const { calculateContainScale } = require('../src/shared/layoutScale');

test('returns 1 when content already fits in the viewport', () => {
  const scale = calculateContainScale({
    viewportWidth: 1200,
    viewportHeight: 700,
    contentWidth: 1000,
    contentHeight: 600
  });

  assert.equal(scale, 1);
});

test('scales down by height when content is too tall', () => {
  const scale = calculateContainScale({
    viewportWidth: 1200,
    viewportHeight: 600,
    contentWidth: 900,
    contentHeight: 900
  });

  assert.equal(scale, 0.667);
});

test('scales down by width when content is too wide', () => {
  const scale = calculateContainScale({
    viewportWidth: 800,
    viewportHeight: 800,
    contentWidth: 1000,
    contentHeight: 400
  });

  assert.equal(scale, 0.8);
});

test('returns 1 when dimensions are invalid', () => {
  const scale = calculateContainScale({
    viewportWidth: 0,
    viewportHeight: 800,
    contentWidth: 1000,
    contentHeight: 400
  });

  assert.equal(scale, 1);
});
