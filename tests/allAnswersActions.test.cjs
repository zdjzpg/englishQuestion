const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const viewSource = fs.readFileSync(path.join(__dirname, '../src/views/AllAnswersView.vue'), 'utf8');
const repositorySource = fs.readFileSync(path.join(__dirname, '../server/paperRepository.js'), 'utf8');

test('answers table is directly controlled by expanded row keys and hides the default expand column', () => {
  assert.match(viewSource, /:expanded-row-keys="expandedRowKeys"/, 'expected direct expanded row keys binding');
  assert.match(viewSource, /:show-expand-column="false"/, 'expected default expand icon column to be hidden');
  assert.match(viewSource, /@expand="handleRowExpand"/, 'expected explicit expand sync handler');
});

test('answers actions include a row-level report image export handler with loading state', () => {
  assert.match(viewSource, /:loading="generatingSubmissionId === record\.id"/, 'expected row-level export loading state');
  assert.match(viewSource, /@click="downloadSubmissionReportImage\(record\)"/, 'expected row-level report image handler');
});

test('answers image export builds the same report snapshot as the student report screen', () => {
  assert.match(viewSource, /import submissionReportSnapshotUtils from '\.\.\/shared\/submissionReportSnapshot'/, 'expected shared snapshot helper import');
  assert.match(viewSource, /const \{ buildSubmissionReportSnapshot \} = submissionReportSnapshotUtils;/, 'expected shared snapshot helper usage');
  assert.match(viewSource, /const snapshot = buildSubmissionReportSnapshot\(/, 'expected export flow to build a full report snapshot');
  assert.match(viewSource, /createApp\(SubmissionReportCapture,\s*snapshot\)/, 'expected export flow to mount the shared snapshot');
});

test('submission list query returns stored report json for row-level image generation', () => {
  assert.match(repositorySource, /s\.report_json/, 'expected submission query to read report_json');
  assert.match(repositorySource, /abilityItems:\s*Array\.isArray\(reportData\.abilityItems\)/, 'expected parsed report data to keep ability items');
  assert.match(repositorySource, /comments:\s*reportData\.comments\s*\|\|\s*\{\}/, 'expected parsed report data to keep comments');
});
