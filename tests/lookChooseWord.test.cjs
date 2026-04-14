const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createLookChooseWordChoices,
  ensureLookChooseWordDraft,
  normalizeLookChooseWordQuestion
} = require('../src/shared/lookChooseWord');

test('createLookChooseWordChoices builds three default image-word rows', () => {
  const choices = createLookChooseWordChoices(() => 'fixed_choice');

  assert.equal(choices.length, 3);
  assert.deepEqual(choices.map((choice) => choice.word), ['apple', 'banana', 'orange']);
});

test('ensureLookChooseWordDraft upgrades legacy target/options text to a choice list', () => {
  let id = 0;
  const draft = ensureLookChooseWordDraft(
    {
      type: 'look_choose_word',
      targetWord: 'banana',
      optionsText: 'apple, banana, orange'
    },
    () => `choice_${++id}`
  );

  assert.equal(draft.choices.length, 3);
  assert.equal(draft.correctChoiceId, 'choice_2');
});

test('normalizeLookChooseWordQuestion exposes the chosen image and all option words', () => {
  const question = normalizeLookChooseWordQuestion({
    id: 'q1',
    type: 'look_choose_word',
    score: 10,
    prompt: '看看图片，选出正确单词。',
    choices: [
      { id: 'c1', imageUrl: 'pear.png', word: 'pear' },
      { id: 'c2', imageUrl: 'apple.png', word: 'apple' },
      { id: 'c3', imageUrl: 'banana.png', word: 'banana' }
    ],
    correctChoiceId: 'c2'
  });

  assert.equal(question.targetWord, 'apple');
  assert.equal(question.imageUrl, 'apple.png');
  assert.deepEqual(question.options, ['pear', 'apple', 'banana']);
});
