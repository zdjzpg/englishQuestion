const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('report screen and submission export both reuse the shared craft report component', () => {
  const paperViewSource = read('src/views/PaperView.vue');
  const submissionCaptureSource = read('src/components/shared/SubmissionReportCapture.vue');

  assert.match(paperViewSource, /StudentCraftReport/, 'expected PaperView to render StudentCraftReport');
  assert.match(submissionCaptureSource, /StudentCraftReport/, 'expected SubmissionReportCapture to render StudentCraftReport');
});

test('styles define separate desktop and ipad report layouts without page scrolling', () => {
  const stylesSource = read('src/styles.css');

  assert.match(stylesSource, /body\.report-single-screen\s*\{[\s\S]*overflow:\s*hidden;/, 'expected report mode to stay single-screen');
  assert.match(stylesSource, /\.student-craft-report--desktop[\s\S]*?\.craft-report-panels\s*\{[\s\S]*grid-template-columns:/, 'expected desktop craft report layout rules');
  assert.match(stylesSource, /\.student-craft-report--ipad[\s\S]*?\.craft-report-panels\s*\{[\s\S]*grid-template-columns:/, 'expected ipad craft report layout rules');
});
