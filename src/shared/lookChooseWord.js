function defaultId() {
  return `choice_${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeWord(value) {
  return String(value || '').trim();
}

function splitCsv(text) {
  return String(text || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function createLookChooseWordChoices(makeId = defaultId) {
  return ['apple', 'banana', 'orange'].map((word) => ({
    id: makeId(),
    imageUrl: '',
    word
  }));
}

function normalizeDraftChoices(question, makeId = defaultId) {
  if (Array.isArray(question.choices) && question.choices.length) {
    return question.choices.map((choice) => ({
      id: choice.id || makeId(),
      imageUrl: String(choice.imageUrl || '').trim(),
      word: normalizeWord(choice.word)
    }));
  }

  const legacyWords = splitCsv(question.optionsText || question.targetWord);
  if (legacyWords.length) {
    return legacyWords.map((word) => ({
      id: makeId(),
      imageUrl: '',
      word
    }));
  }

  return createLookChooseWordChoices(makeId);
}

function resolveCorrectChoiceId(choices, correctChoiceId, targetWord) {
  if (correctChoiceId && choices.some((choice) => choice.id === correctChoiceId)) {
    return correctChoiceId;
  }

  const matched = choices.find((choice) => choice.word.toLowerCase() === String(targetWord || '').trim().toLowerCase());
  if (matched) {
    return matched.id;
  }

  return choices[0]?.id || '';
}

function ensureLookChooseWordDraft(question, makeId = defaultId) {
  const choices = normalizeDraftChoices(question, makeId);
  const correctChoiceId = resolveCorrectChoiceId(choices, question.correctChoiceId, question.targetWord);

  return {
    ...question,
    choices,
    correctChoiceId
  };
}

function normalizeLookChooseWordQuestion(question, makeId = defaultId) {
  const draft = ensureLookChooseWordDraft(question, makeId);
  const choices = draft.choices.filter((choice) => choice.word);
  const correctChoiceId = resolveCorrectChoiceId(choices, draft.correctChoiceId, question.targetWord);
  const correctChoice = choices.find((choice) => choice.id === correctChoiceId) || null;

  return {
    id: question.id,
    type: question.type,
    score: Number(question.score) || 0,
    prompt: question.prompt || '',
    choices,
    correctChoiceId,
    targetWord: correctChoice?.word || '',
    options: choices.map((choice) => choice.word),
    imageUrl: correctChoice?.imageUrl || ''
  };
}

module.exports = {
  createLookChooseWordChoices,
  ensureLookChooseWordDraft,
  normalizeLookChooseWordQuestion
};
