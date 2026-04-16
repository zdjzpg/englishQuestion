const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const viewSource = fs.readFileSync(path.join(__dirname, '../src/views/ConfiguredPapersView.vue'), 'utf8');
const stylesSource = fs.readFileSync(path.join(__dirname, '../src/styles.css'), 'utf8');

function getActionsColumnWidth(source) {
  const match = source.match(/key:\s*'actions'[\s\S]*?width:\s*(\d+)/);
  return match ? Number(match[1]) : null;
}

function getCssBlock(source, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`, 'm'));
  return match ? match[1] : '';
}

test('configured papers actions column keeps enough reserved width for four actions', () => {
  const width = getActionsColumnWidth(viewSource);
  assert.ok(width >= 420, `expected actions column width >= 420, got ${width}`);
});

test('configured papers table uses its own internal horizontal scroll width instead of a hard-coded narrow viewport', () => {
  assert.match(viewSource, /:scroll="\{\s*x:\s*tableScrollX\s*\}"/, 'expected table scroll x to be driven by computed width');
  assert.match(viewSource, /const tableScrollX = computed\(\(\) => columns\.value\.reduce/, 'expected computed table scroll width from columns');
});

test('configured papers actions container fills the table cell so wrapped buttons stay visible', () => {
  const block = getCssBlock(stylesSource, '.admin-papers-actions');
  assert.match(block, /display:\s*flex\s*;/, 'expected .admin-papers-actions to use display: flex');
  assert.match(block, /width:\s*100%\s*;/, 'expected .admin-papers-actions to use width: 100%');
});
