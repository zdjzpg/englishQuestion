const test = require('node:test');
const assert = require('node:assert/strict');

const {
  chooseSpeechVoice,
  normalizeRewardConfig,
  pickRewardItem,
  validateRewardConfig
} = require('../src/shared/studentExperience');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('chooseSpeechVoice prefers english voices when available', () => {
  const voice = chooseSpeechVoice([
    { name: 'Microsoft Huihui', lang: 'zh-CN', default: true },
    { name: 'English Voice', lang: 'en-US', default: false }
  ]);

  assert.equal(voice.name, 'English Voice');
});

test('chooseSpeechVoice falls back to default voice when no english voice exists', () => {
  const voice = chooseSpeechVoice([
    { name: 'Microsoft Huihui', lang: 'zh-CN', default: true },
    { name: 'Microsoft Yaoyao', lang: 'zh-CN', default: false }
  ]);

  assert.equal(voice.name, 'Microsoft Huihui');
});

test('normalizeRewardConfig keeps only valid positive-probability items', () => {
  const config = normalizeRewardConfig({
    enabled: true,
    openingAnimationEnabled: true,
    finishAnimationEnabled: false,
    items: [
      { id: '1', name: '贴纸', probability: 60 },
      { id: '2', name: '', probability: 40 },
      { id: '3', name: '橡皮', probability: 0 }
    ]
  });

  assert.equal(config.enabled, true);
  assert.equal(config.items.length, 1);
  assert.equal(config.items[0].name, '贴纸');
});

test('pickRewardItem selects the weighted item based on roll', () => {
  const item = pickRewardItem({
    enabled: true,
    items: [
      { id: '1', name: '贴纸', probability: 60 },
      { id: '2', name: '铅笔', probability: 30 },
      { id: '3', name: '玩偶', probability: 10 }
    ]
  }, 0.75);

  assert.equal(item.name, '铅笔');
});

test('validateRewardConfig rejects enabled rewards when probabilities do not sum to 100', () => {
  const result = validateRewardConfig({
    enabled: true,
    items: [
      { id: '1', name: '贴纸', probability: 60 },
      { id: '2', name: '铅笔', probability: 30 },
      { id: '3', name: '小礼物', probability: 20 }
    ]
  });

  assert.equal(result.isValid, false);
  assert.match(result.message, /100/);
});

test('validateRewardConfig rejects enabled rewards when an item probability is not positive', () => {
  const result = validateRewardConfig({
    enabled: true,
    items: [
      { id: '1', name: '贴纸', probability: 0 }
    ]
  });

  assert.equal(result.isValid, false);
  assert.match(result.message, /概率/);
});

test('student overlays include delayed finish CTA and separate reward result card structure', () => {
  const openingSource = read('src/components/shared/StudentOpeningOverlay.vue');
  const finishSource = read('src/components/shared/StudentFinishOverlay.vue');
  const wheelSource = read('src/components/shared/RewardWheelOverlay.vue');
  const paperViewSource = read('src/views/PaperView.vue');
  const stylesSource = read('src/styles.css');
  const newPaperViewSource = read('src/views/NewPaperView.vue');
  const listenChooseImageSource = read('src/components/questions/ListenChooseImage.vue');
  const configuredPapersViewSource = read('src/views/ConfiguredPapersView.vue');
  const listenChooseLetterSource = read('src/components/questions/ListenChooseLetter.vue');

  assert.match(openingSource, /storybook-shell/);
  assert.match(openingSource, /storybook-cover-front/);
  assert.match(openingSource, /storybook-cover-content/);
  assert.match(openingSource, /opening-title-char/);
  assert.match(openingSource, /storybook-backdrop-ornaments/);
  assert.doesNotMatch(openingSource, /Chapter 1/);
  assert.doesNotMatch(openingSource, /storybook-badge/);
  assert.match(openingSource, /准备好了吗？一起开始今天的英语小挑战吧。/);
  assert.doesNotMatch(openingSource, /storybook-float-star/);
  assert.doesNotMatch(openingSource, /storybook-float-cloud/);
  assert.doesNotMatch(openingSource, /storybook-float-balloon/);
  assert.match(finishSource, /finish-button-wrap/);
  assert.match(wheelSource, /reward-result-card/);
  assert.match(wheelSource, /reward-result-burst/);
  assert.match(paperViewSource, /paper-view-shell-intake/);
  assert.match(paperViewSource, /paper-view-shell-report/);
  assert.match(stylesSource, /\.paper-view-shell-intake\s*\{/);
  assert.match(stylesSource, /body\.report-single-screen/);
  assert.match(stylesSource, /\.paper-view-shell-report\s*\{/);
  assert.match(newPaperViewSource, /ListenChooseImageEditor/);
  assert.match(newPaperViewSource, /admin-question-card-actions/);
  assert.match(newPaperViewSource, /replace-text="[\s\S]*compact[\s\S]*layout="side-actions"/);
  assert.match(configuredPapersViewSource, /编辑卷子/);
  assert.match(configuredPapersViewSource, /canEditPaper\(record\)/);
  assert.match(configuredPapersViewSource, /admin-papers-actions/);
  assert.match(listenChooseImageSource, /question\.choices/);
  assert.match(listenChooseImageSource, /answer\.selected === choice\.id/);
  assert.doesNotMatch(listenChooseImageSource, /caption="先听一听，再选图片。"/);
  assert.match(listenChooseLetterSource, /loose-letter-garden/);
  assert.match(listenChooseLetterSource, /letter-home-shell/);
  assert.match(listenChooseLetterSource, /set-letter-slot/);
  assert.match(paperViewSource, /@set-letter-slot=/);
  assert.match(paperViewSource, /downloadReportImage/);
  assert.match(paperViewSource, /downloadCurrentReport/);
  assert.doesNotMatch(paperViewSource, /router\.push\(\{ name: 'answers', query: \{ paperId: state\.currentPaperId \} \}\)/);
  assert.match(stylesSource, /\.image-upload-field\.compact \.image-upload-preview-img\s*\{/);
  assert.match(stylesSource, /\.image-upload-field\.compact\s*\{/);
  assert.match(stylesSource, /\.image-upload-actions\.compact\s*\{/);
  assert.match(stylesSource, /\.admin-question-card-actions\s*\{/);
  assert.match(stylesSource, /\.admin-papers-actions\s*\{/);
});
