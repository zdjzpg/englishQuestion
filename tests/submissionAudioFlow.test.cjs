const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(filePath) {
  return fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
}

test('client exposes a dedicated answer-audio upload API helper', () => {
  const source = read('src/api/client.js');

  assert.match(source, /export async function uploadAnswerAudio\(/);
  assert.match(source, /\/uploads\/answer-audio/);
});

test('exam store captures microphone audio and uploads it before final submission', () => {
  const source = read('src/store/examStore.js');

  assert.match(source, /MediaRecorder/);
  assert.match(source, /navigator\.mediaDevices\.getUserMedia/);
  assert.match(source, /await startAnswerAudioRecording/);
  assert.match(source, /AudioContext|webkitAudioContext/);
  assert.match(source, /maxLevel/);
  assert.match(source, /没有采集到麦克风声音/);
  assert.match(source, /uploadAnswerAudio/);
  assert.match(source, /audioPath/);
});

test('server exposes upload storage and persists recording metadata with submission answers', () => {
  const indexSource = read('server/index.js');
  const repositorySource = read('server/paperRepository.js');

  assert.match(indexSource, /\/api\/uploads\/answer-audio/);
  assert.match(indexSource, /app\.use\('\/api\/uploads'/);
  assert.match(repositorySource, /audioPath/);
  assert.match(repositorySource, /audioMimeType/);
  assert.match(repositorySource, /\/api\/uploads\//);
});

test('answer records use Chinese type labels and render inline audio playback controls', () => {
  const viewSource = read('src/views/AllAnswersView.vue');
  const metaSource = read('src/shared/questionTypeMeta.js');

  assert.match(metaSource, /listen_choose_image:\s*'听音选图'/);
  assert.match(metaSource, /read_aloud:\s*'跟读练习'/);
  assert.match(metaSource, /listen_answer_question:\s*'听题口答'/);
  assert.match(viewSource, /admin-answer-audio/);
  assert.match(viewSource, /createElementVNode|h\(/);
});
