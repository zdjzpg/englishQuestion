const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createDefaultReportCommentConfig,
  normalizeReportCommentConfig,
  resolveReportComments
} = require('../src/shared/reportComments');

test('createDefaultReportCommentConfig creates the three-part structure', () => {
  const config = createDefaultReportCommentConfig();

  assert.equal(typeof config.opening, 'string');
  assert.equal(typeof config.closing, 'string');
  assert.equal(Array.isArray(config.bands), true);
});

test('normalizeReportCommentConfig keeps only non-empty middle comments sorted by threshold', () => {
  const config = normalizeReportCommentConfig({
    opening: '开头',
    closing: '结尾',
    bands: [
      { id: 'b1', minScore: 60, text: '合格' },
      { id: 'b2', minScore: 90, text: '优秀' },
      { id: 'b3', minScore: 30, text: '' }
    ]
  });

  assert.deepEqual(config.bands.map((item) => item.id), ['b2', 'b1']);
});

test('resolveReportComments picks the highest matching middle comment by score', () => {
  const result = resolveReportComments({
    opening: '开头',
    closing: '结尾',
    bands: [
      { id: 'b1', minScore: 90, text: '优秀' },
      { id: 'b2', minScore: 60, text: '良好' }
    ]
  }, 75);

  assert.equal(result.opening, '开头');
  assert.equal(result.middle, '良好');
  assert.equal(result.closing, '结尾');
});
