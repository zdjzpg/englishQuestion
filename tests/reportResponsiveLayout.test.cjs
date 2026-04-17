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
  const reportSource = read('src/components/shared/StudentCraftReport.vue');

  assert.match(paperViewSource, /StudentCraftReport/, 'expected PaperView to render StudentCraftReport');
  assert.match(submissionCaptureSource, /StudentCraftReport/, 'expected SubmissionReportCapture to render StudentCraftReport');
  assert.match(reportSource, /craft-report-footer/, 'expected report footer row to exist');
  assert.match(reportSource, /craft-summary-card/, 'expected second footer card for balanced two-column layout');
});

test('styles define separate desktop and ipad report layouts without page scrolling', () => {
  const stylesSource = read('src/styles.css');

  assert.match(stylesSource, /body\.report-single-screen\s*\{[\s\S]*overflow:\s*hidden;/, 'expected report mode to stay single-screen');
  assert.match(stylesSource, /\.student-craft-report--desktop \.craft-report-panels\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/, 'expected desktop craft report layout rules');
  assert.match(stylesSource, /\.student-craft-report--ipad \.craft-report-panels\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/, 'expected ipad craft report layout rules');
});

test('ipad report layout compacts the radar card internals so the bottom metrics do not overflow into the note card', () => {
  const stylesSource = read('src/styles.css');

  assert.match(stylesSource, /\.craft-radar-card\s*\{[\s\S]*display:\s*flex;[\s\S]*flex-direction:\s*column;[\s\S]*min-height:\s*0;/, 'expected radar card to allow internal shrinking');
  assert.match(stylesSource, /\.ability-radar-wrap\s*\{[\s\S]*grid-template-rows:\s*minmax\(0,\s*1fr\)\s+auto;/, 'expected radar content wrapper to split chart and metrics into shrinkable rows');
  assert.match(stylesSource, /\.student-craft-report--ipad \.report-radar-card \.radar\s*\{[\s\S]*width:\s*clamp\(/, 'expected ipad radar size to respond to viewport height');
  assert.match(stylesSource, /\.student-craft-report--ipad \.report-radar-card \.ability-radar-kpis \.kpi\s*\{[\s\S]*padding:\s*8px 10px;/, 'expected ipad radar metric pills to use tighter padding');
});

test('report footer uses an even two-column layout instead of a single full-width note card', () => {
  const stylesSource = read('src/styles.css');

  assert.match(stylesSource, /\.craft-report-footer\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/, 'expected footer row to split into two equal columns');
  assert.match(stylesSource, /\.student-craft-report--desktop \.craft-report-footer\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/, 'expected desktop footer to keep equal columns');
  assert.match(stylesSource, /\.student-craft-report--ipad \.craft-report-footer\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/, 'expected ipad footer to keep equal columns');
});
