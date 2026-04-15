import { computed, reactive } from 'vue';
import {
  TYPE_META,
  buildWaveBars,
  clone,
  decodeConfig,
  defaultConfig,
  encodeConfig,
  getQuestionDefaults,
  normalizeQuestion,
  safeWord,
  uid
} from '../utils/content';
import {
  createPaper as apiCreatePaper,
  createSubmission as apiCreateSubmission,
  copyPaperById,
  createUser as apiCreateUser,
  drawSubmissionReward as apiDrawSubmissionReward,
  fetchMe,
  fetchPaperById,
  fetchPapers as apiFetchPapers,
  fetchPublicPaperByShareCode,
  fetchPaperSubmissions,
  fetchUsers as apiFetchUsers,
  getStoredAuthToken,
  login as apiLogin,
  logout as apiLogout,
  removePaperById,
  resetUserPassword as apiResetUserPassword,
  setStoredAuthToken,
  updatePaper as apiUpdatePaper,
  updateUserStatus as apiUpdateUserStatus
} from '../api/client';
import studentValidation from '../shared/studentValidation';
import paperValidation from '../shared/paperValidation';
import shareCodeUtils from '../shared/shareCode';
import audioFeedbackUtils from '../shared/audioFeedback';
import paperEditPolicy from '../shared/paperEditPolicy';
import questionAbilitiesUtils from '../shared/questionAbilities';
import questionTypeSupport from '../shared/questionTypeSupport';
import reportAbilitiesUtils from '../shared/reportAbilities';
import reportCommentsUtils from '../shared/reportComments';
import studentExperienceUtils from '../shared/studentExperience';

const { getMissingStudentFields } = studentValidation;
const { getPaperScoreSummary } = paperValidation;
const { normalizeShareCode } = shareCodeUtils;
const { getReadAloudBuddyState, getListeningBuddyState } = audioFeedbackUtils;
const { canEditPaper, getPaperEditBlockedMessage } = paperEditPolicy;
const { REPORT_ABILITIES, getDefaultAbilitiesForType, normalizeQuestionAbilities } = questionAbilitiesUtils;
const { evaluateNewQuestionAnswer } = questionTypeSupport;
const { buildWeightedAbilityMap, toAbilityItems } = reportAbilitiesUtils;
const { normalizeReportCommentConfig, resolveReportComments } = reportCommentsUtils;
const { chooseSpeechVoice, normalizeRewardConfig } = studentExperienceUtils;

function createEmptyEditingPaper() {
  const config = defaultConfig();
  config.examTitle = '新的英语测评卷';
  return config;
}

function getTotalScore(questions) {
  return questions.reduce((sum, item) => sum + Number(item.score || 0), 0);
}

function buildRecordItems(paper, answers) {
  if (!paper) {
    return [];
  }
  return paper.questions.map((question, index) => {
    const answer = answers[question.id] || {};
    const questionAbilities = Array.isArray(question.abilities) && question.abilities.length ? question.abilities : [];
    let correctText = '';
    let studentText = '';
    let gained = 0;

    if (question.type === 'listen_choose_image') {
      const selectedChoice = (question.choices || []).find((item) => item.id === answer.selected);
      const correctChoice = (question.choices || []).find((item) => item.id === question.correctChoiceId);
      correctText = correctChoice?.word || question.answerWord || '未配置';
      studentText = selectedChoice?.word || '未作答';
      gained = answer.selected === question.correctChoiceId ? question.score : 0;
    } else if (question.type === 'listen_follow_instruction') {
      const selectedTarget = (question.targets || []).find((item) => item.id === answer.selected);
      const correctTarget = (question.targets || []).find((item) => item.id === question.correctTargetId);
      if (question.mode === 'drag_place') {
        const objectLabel = question.draggableObject?.label || 'object';
        correctText = `${objectLabel} -> ${correctTarget?.label || question.correctTargetId || '未配置'}`;
        studentText = answer.selected
          ? `${objectLabel} -> ${selectedTarget?.label || answer.selected}`
          : '未作答';
      } else {
        correctText = correctTarget?.label || question.correctTargetId || '未配置';
        studentText = selectedTarget?.label || answer.selected || '未作答';
      }
      gained = answer.selected === question.correctTargetId ? question.score : 0;
    } else if (question.type === 'look_choose_word') {
      correctText = question.targetWord;
      studentText = answer.selected || '未作答';
      gained = answer.selected === question.targetWord ? question.score : 0;
    } else if (question.type === 'sentence_sort') {
      correctText = question.sentence;
      studentText = (answer.order || []).join(' ') || '未完成';
      gained = studentText === question.sentence ? question.score : 0;
    } else if (question.type === 'read_aloud') {
      correctText = question.phrase;
      studentText = answer.transcript || '未识别';
      gained = Math.round(((answer.autoScore || 0) / 100) * question.score);
    } else if (question.type === 'listen_answer_question' || question.type === 'listen_choose_letter' || question.type === 'read_sentence_with_image' || question.type === 'match_image_word') {
      const result = evaluateNewQuestionAnswer(question, answer) || {};
      correctText = result.correctText || '未配置';
      studentText = result.studentText || '未作答';
      gained = Number(result.gained || 0);
    } else {
      correctText = question.answerWord;
      studentText = answer.input || '未作答';
      gained = safeWord(answer.input) === safeWord(question.answerWord) ? question.score : 0;
    }

    return {
      index: index + 1,
      meta: {
        ...(TYPE_META[question.type] || { label: question.type, ability: '-', icon: '📝' }),
        ability: questionAbilities.join(' / ') || '-'
      },
      abilities: questionAbilities,
      prompt: question.prompt,
      correctText,
      studentText,
      gained,
      total: question.score,
      status: gained >= question.score * 0.7 ? '通过' : '待加强'
    };
  });
}

const state = reactive({
  authToken: getStoredAuthToken(),
  authUser: null,
  authReady: false,
  papers: [],
  users: [],
  submissions: [],
  editingPaperId: null,
  editingPaper: createEmptyEditingPaper(),
  config: null,
  currentPaperId: null,
  currentPaperShareCode: '',
  currentPaper: null,
  paper: null,
  currentSubmissionId: '',
  student: { name: '', phone: '', age: '', grade: '', school: '' },
  answers: {},
  audioUi: {},
  currentIndex: 0,
  report: null,
  openingAnimationVisible: false,
  finishAnimationVisible: false,
  rewardWheelVisible: false,
  rewardDrawing: false,
  rewardResult: null,
  playbackOverlay: {
    visible: false,
    text: '',
    kind: 'listening'
  },
  waveBars: buildWaveBars(),
  sessionStarted: false,
  loading: false,
  apiError: ''
});

state.config = state.editingPaper;
state.paper = state.currentPaper;

function setError(error) {
  state.apiError = error ? error.message || String(error) : '';
}

function ensureAnswer(questionId) {
  if (!state.answers[questionId]) {
    state.answers[questionId] = {};
  }
  return state.answers[questionId];
}

function getCurrentQuestion() {
  return state.currentPaper ? state.currentPaper.questions[state.currentIndex] : null;
}

function syncLegacyEditingConfig() {
  state.config = state.editingPaper;
}

function syncLegacyCurrentPaper() {
  state.paper = state.currentPaper;
}

function createAudioUiState() {
  return {
    isPlaying: false,
    isRecording: false,
    justScored: false
  };
}

function ensureAudioUi(questionId) {
  if (!questionId) {
    return createAudioUiState();
  }
  if (!state.audioUi[questionId]) {
    state.audioUi[questionId] = createAudioUiState();
  }
  return state.audioUi[questionId];
}

function getSavePayload(editingPaper) {
  return {
    examTitle: editingPaper.examTitle,
    themeNote: editingPaper.themeNote,
    welcomeSpeech: editingPaper.welcomeSpeech,
    rewardConfig: clone(editingPaper.rewardConfig || {}),
    commentConfig: clone(editingPaper.commentConfig || {}),
    questions: clone(editingPaper.questions)
  };
}

function setAuthSession({ token, user }) {
  state.authToken = token || '';
  state.authUser = user || null;
  state.authReady = true;
  setStoredAuthToken(token || '');
}

const audioScoreTimers = new Map();
let activeSpeechToken = 0;
let playbackFallbackTimer = null;

let storeApi;

export function useExamStore() {
  if (storeApi) {
    return storeApi;
  }

  const editingTotalScore = computed(() => getTotalScore(state.editingPaper.questions));
  const editingScoreSummary = computed(() => getPaperScoreSummary(state.editingPaper.questions));
  const totalScore = computed(() => getTotalScore((state.config?.questions) || []));
  const currentQuestion = computed(() => getCurrentQuestion());
  const currentAnswer = computed(() => {
    const question = getCurrentQuestion();
    return question ? (state.answers[question.id] || {}) : {};
  });
  const progressPercent = computed(() => {
    if (!state.currentPaper || !state.currentPaper.questions.length) {
      return 0;
    }
    return Math.round((state.currentIndex / state.currentPaper.questions.length) * 100);
  });
  const recordItems = computed(() => buildRecordItems(state.currentPaper, state.answers));
  const configuredPapers = computed(() => state.papers.map((paper) => ({
    ...paper,
    questionCount: paper.questions?.length || paper.questionCount || 0,
    totalScore: Number(paper.totalScore || getTotalScore(paper.questions || []))
  })));
  const paperTypeOptions = computed(() => {
    const set = new Set();
    state.papers.forEach((paper) => {
      (paper.questions || []).forEach((question) => set.add(question.type));
    });
    return Array.from(set);
  });
  const submissionsByPaper = computed(() => {
    const grouped = {};
    state.submissions.forEach((item) => {
      if (!grouped[item.paperId]) {
        grouped[item.paperId] = [];
      }
      grouped[item.paperId].push(item);
    });
    return grouped;
  });
  const isAuthenticated = computed(() => Boolean(state.authUser));
  const isAdmin = computed(() => state.authUser?.role === 'ADMIN');
  const missingStudentFields = computed(() => getMissingStudentFields(state.student));

  async function fetchPapers(filters = {}) {
    state.loading = true;
    try {
      const result = await apiFetchPapers(filters);
      state.papers = result.items || [];
      setError(null);
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      state.loading = false;
    }
  }

  async function fetchUsersInternal() {
    const result = await apiFetchUsers();
    state.users = result.items || [];
  }

  function stopSpeakingVisuals() {
    if (playbackFallbackTimer) {
      window.clearTimeout(playbackFallbackTimer);
      playbackFallbackTimer = null;
    }
    Object.keys(state.audioUi).forEach((questionId) => {
      ensureAudioUi(questionId).isPlaying = false;
    });
    state.playbackOverlay.visible = false;
  }

  function flashScored(questionId) {
    const audioUi = ensureAudioUi(questionId);
    audioUi.isRecording = false;
    audioUi.justScored = true;
    if (audioScoreTimers.has(questionId)) {
      window.clearTimeout(audioScoreTimers.get(questionId));
    }
    const timerId = window.setTimeout(() => {
      ensureAudioUi(questionId).justScored = false;
      audioScoreTimers.delete(questionId);
    }, 1600);
    audioScoreTimers.set(questionId, timerId);
  }

  function normalizeSpeakPayload(payload) {
    if (typeof payload === 'string') {
      return { text: payload, questionId: '', kind: 'listening' };
    }
    return {
      text: payload?.text || '',
      questionId: payload?.questionId || '',
      kind: payload?.kind || 'listening'
    };
  }

  storeApi = {
    state,
    TYPE_META,
    editingTotalScore,
    editingScoreSummary,
    totalScore,
    currentQuestion,
    currentAnswer,
    progressPercent,
    recordItems,
    configuredPapers,
    paperTypeOptions,
    submissionsByPaper,
    isAuthenticated,
    isAdmin,
    missingStudentFields,
    getQuestionAudioState(questionId) {
      const audioUi = ensureAudioUi(questionId);
      return {
        ...audioUi,
        readAloudState: getReadAloudBuddyState({
          isDemoPlaying: audioUi.isPlaying,
          isRecording: audioUi.isRecording,
          hasScore: audioUi.justScored
        }),
        listeningState: getListeningBuddyState({
          isPlaying: audioUi.isPlaying
        })
      };
    },
    async ensureAuthLoaded() {
      if (state.authReady) {
        return state.authUser;
      }
      if (!state.authToken) {
        state.authReady = true;
        state.authUser = null;
        return null;
      }
      try {
        const result = await fetchMe();
        setAuthSession({ token: state.authToken, user: result.user });
        setError(null);
        return state.authUser;
      } catch (error) {
        setAuthSession({ token: '', user: null });
        setError(null);
        return null;
      }
    },
    async login(username, password) {
      state.loading = true;
      try {
        const result = await apiLogin({ username, password });
        setAuthSession(result);
        setError(null);
        return result.user;
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        state.loading = false;
      }
    },
    async logout() {
      state.loading = true;
      try {
        if (state.authToken) {
          await apiLogout().catch(() => null);
        }
      } finally {
        setAuthSession({ token: '', user: null });
        state.papers = [];
        state.users = [];
        state.submissions = [];
        state.loading = false;
      }
    },
    async fetchUsers() {
      state.loading = true;
      try {
        await fetchUsersInternal();
        setError(null);
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        state.loading = false;
      }
    },
    async createUser(payload) {
      state.loading = true;
      try {
        await apiCreateUser(payload);
        await fetchUsersInternal();
        setError(null);
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        state.loading = false;
      }
    },
    async resetUserPassword(userId, password) {
      state.loading = true;
      try {
        await apiResetUserPassword(userId, password);
        setError(null);
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        state.loading = false;
      }
    },
    async updateUserStatus(userId, status) {
      state.loading = true;
      try {
        await apiUpdateUserStatus(userId, status);
        await fetchUsersInternal();
        setError(null);
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        state.loading = false;
      }
    },
    async fetchPapers(filters = {}) {
      await fetchPapers(filters);
    },
    createNewPaper() {
      state.editingPaperId = null;
      state.editingPaper = createEmptyEditingPaper();
      syncLegacyEditingConfig();
    },
    async loadPaperForEdit(paperId) {
      state.loading = true;
      try {
        const paper = await fetchPaperById(paperId);
        if (!canEditPaper(paper)) {
          throw new Error(getPaperEditBlockedMessage());
        }
        state.editingPaperId = paper.id;
        state.editingPaper = {
          examTitle: paper.examTitle,
          themeNote: paper.themeNote,
          welcomeSpeech: paper.welcomeSpeech,
          shareCode: paper.shareCode,
          rewardConfig: normalizeRewardConfig(paper.rewardConfig || {}),
          commentConfig: normalizeReportCommentConfig(paper.commentConfig || {}),
          questions: clone(paper.questions).map((question) => ({
            ...question,
            abilities: normalizeQuestionAbilities(question.abilities, getDefaultAbilitiesForType(question.type))
          }))
        };
        syncLegacyEditingConfig();
        setError(null);
        return true;
      } catch (error) {
        setError(error);
        state.editingPaperId = null;
        state.editingPaper = createEmptyEditingPaper();
        syncLegacyEditingConfig();
        return false;
      } finally {
        state.loading = false;
      }
    },
    async saveEditingPaper() {
      state.loading = true;
      try {
        state.editingPaper.questions = state.editingPaper.questions.map((question) => ({
          ...question,
          abilities: normalizeQuestionAbilities(question.abilities, getDefaultAbilitiesForType(question.type))
        }));
        if (state.editingPaperId) {
          const saved = await apiUpdatePaper(state.editingPaperId, getSavePayload(state.editingPaper));
          state.editingPaper.shareCode = saved.shareCode || state.editingPaper.shareCode;
        } else {
          const saved = await apiCreatePaper(getSavePayload(state.editingPaper));
          state.editingPaperId = saved.id;
          state.editingPaper.shareCode = saved.shareCode || '';
        }
        await fetchPapers();
        setError(null);
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        state.loading = false;
      }
    },
    async removePaper(paperId) {
      state.loading = true;
      try {
        await removePaperById(paperId);
        await fetchPapers();
        if (state.currentPaperId === paperId) {
          state.currentPaperId = null;
          state.currentPaperShareCode = '';
          state.currentPaper = null;
          syncLegacyCurrentPaper();
        }
        setError(null);
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        state.loading = false;
      }
    },
    async copyPaper(paperId) {
      state.loading = true;
      try {
        await copyPaperById(paperId);
        await fetchPapers();
        setError(null);
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        state.loading = false;
      }
    },
    addQuestion(type) {
      state.editingPaper.questions.push(getQuestionDefaults(type));
    },
    duplicateQuestion(id) {
      const source = state.editingPaper.questions.find((item) => item.id === id);
      const duplicate = clone(source);
      duplicate.id = uid('q');
      state.editingPaper.questions.push(duplicate);
    },
    removeQuestion(id) {
      state.editingPaper.questions = state.editingPaper.questions.filter((item) => item.id !== id);
    },
    async preparePaperSession(shareCode) {
      state.loading = true;
      try {
        const normalizedShareCode = normalizeShareCode(shareCode);
        const rawPaper = await fetchPublicPaperByShareCode(normalizedShareCode);
        state.currentPaperId = rawPaper.id;
        state.currentPaperShareCode = rawPaper.shareCode || normalizedShareCode;
        state.currentPaper = {
          ...rawPaper,
          rewardConfig: normalizeRewardConfig(rawPaper.rewardConfig || {}),
          commentConfig: normalizeReportCommentConfig(rawPaper.commentConfig || {}),
          questions: rawPaper.questions.map(normalizeQuestion)
        };
        syncLegacyCurrentPaper();
        state.student = { name: '', phone: '', age: '', grade: '', school: '' };
        state.answers = {};
        state.audioUi = {};
        state.currentIndex = 0;
        state.currentSubmissionId = '';
        state.report = null;
        state.openingAnimationVisible = normalizeRewardConfig(rawPaper.rewardConfig || {}).openingAnimationEnabled;
        state.finishAnimationVisible = false;
        state.rewardWheelVisible = false;
        state.rewardDrawing = false;
        state.rewardResult = null;
        state.playbackOverlay.visible = false;
        state.waveBars = buildWaveBars();
        state.sessionStarted = false;
        setError(null);
        return true;
      } catch (error) {
        setError(error);
        state.currentPaperId = null;
        state.currentPaperShareCode = '';
        state.currentPaper = null;
        syncLegacyCurrentPaper();
        return false;
      } finally {
        state.loading = false;
      }
    },
    beginPaperSession() {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      state.sessionStarted = true;
      state.currentIndex = 0;
      state.answers = {};
      state.audioUi = {};
      state.currentSubmissionId = '';
      state.openingAnimationVisible = false;
      state.report = null;
      state.finishAnimationVisible = false;
      state.rewardWheelVisible = false;
      state.rewardDrawing = false;
      state.rewardResult = null;
      state.playbackOverlay.visible = false;
      state.waveBars = buildWaveBars();
      syncLegacyCurrentPaper();
    },
    previousQuestion() {
      if (state.currentIndex > 0) {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        stopSpeakingVisuals();
        state.currentIndex -= 1;
        state.waveBars = buildWaveBars();
      }
    },
    async nextQuestion() {
      if (state.currentIndex < state.currentPaper.questions.length - 1) {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        stopSpeakingVisuals();
        state.currentIndex += 1;
        state.waveBars = buildWaveBars();
        return false;
      }

      const details = buildRecordItems(state.currentPaper, state.answers);
      const abilityMap = buildWeightedAbilityMap(details);
      let total = 0;
      let totalPossible = 0;

      details.forEach((detail) => {
        total += detail.gained;
        totalPossible += detail.total;
      });

      const reportComments = resolveReportComments(state.currentPaper?.commentConfig || {}, total);

      state.report = {
        total,
        totalPossible,
        percent: totalPossible ? Math.round((total / totalPossible) * 100) : 0,
        abilityMap,
        abilityItems: toAbilityItems(abilityMap, REPORT_ABILITIES),
        comments: reportComments,
        details: details.map((detail) => ({
          label: detail.meta.label,
          gained: detail.gained,
          total: detail.total,
          status: detail.status,
          note: `学生作答：${detail.studentText}；标准答案：${detail.correctText}`
        }))
      };

      try {
        const submission = await apiCreateSubmission(state.currentPaperId, {
          student: state.student,
          report: state.report,
          records: details
        });
        state.currentSubmissionId = submission.id || '';
        state.finishAnimationVisible = state.currentPaper?.rewardConfig?.finishAnimationEnabled === true;
        state.rewardWheelVisible = !state.finishAnimationVisible && state.currentPaper?.rewardConfig?.enabled === true;
        state.rewardResult = submission.reward || null;
        setError(null);
      } catch (error) {
        setError(error);
        throw error;
      }
      return true;
    },
    async loadSubmissionsByPaper(paperId, studentKeyword = '') {
      state.loading = true;
      try {
        const result = await fetchPaperSubmissions(paperId, { studentKeyword });
        state.submissions = result.items || [];
        setError(null);
      } catch (error) {
        setError(error);
        throw error;
      } finally {
        state.loading = false;
      }
    },
    closeOpeningAnimation() {
      state.openingAnimationVisible = false;
    },
    completeFinishAnimation() {
      state.finishAnimationVisible = false;
      state.rewardWheelVisible = state.currentPaper?.rewardConfig?.enabled === true;
    },
    closeRewardWheel() {
      state.rewardWheelVisible = false;
    },
    async drawCurrentReward() {
      if (!state.currentSubmissionId || state.rewardDrawing || state.rewardResult) {
        return state.rewardResult;
      }
      state.rewardDrawing = true;
      try {
        const result = await apiDrawSubmissionReward(state.currentSubmissionId);
        state.rewardResult = result.reward || null;
        return state.rewardResult;
      } finally {
        state.rewardDrawing = false;
      }
    },
    selectOption(value) {
      const answer = ensureAnswer(getCurrentQuestion().id);
      answer.selected = value;
    },
    addToken(token) {
      const answer = ensureAnswer(getCurrentQuestion().id);
      answer.order = answer.order || [];
      if (answer.order.length < getCurrentQuestion().tokens.length) {
        answer.order.push(token);
      }
    },
    removeSlot(index) {
      const answer = ensureAnswer(getCurrentQuestion().id);
      answer.order = answer.order || [];
      if (answer.order[index]) {
        answer.order.splice(index, 1);
      }
    },
    updateSpelling(value) {
      const answer = ensureAnswer(getCurrentQuestion().id);
      answer.input = value;
    },
    fillAnswer(value) {
      const answer = ensureAnswer(getCurrentQuestion().id);
      answer.input = value;
    },
    toggleLetterSelection(letter) {
      const question = getCurrentQuestion();
      const answer = ensureAnswer(question.id);
      if (question.requireBothCases) {
        answer.selectedLetters = answer.selectedLetters || [];
        if (answer.selectedLetters.includes(letter)) {
          answer.selectedLetters = answer.selectedLetters.filter((item) => item !== letter);
        } else {
          answer.selectedLetters.push(letter);
        }
        return;
      }
      answer.selectedLetters = [letter];
    },
    setLetterSlot({ slotIndex, letter }) {
      const question = getCurrentQuestion();
      const answer = ensureAnswer(question.id);
      const slotCount = question.requireBothCases ? 2 : 1;
      const next = Array.from({ length: slotCount }, (_, index) => answer.selectedLetters?.[index] || '');

      for (let index = 0; index < next.length; index += 1) {
        if (next[index] === letter) {
          next[index] = '';
        }
      }

      next[Math.max(0, Math.min(slotIndex, slotCount - 1))] = letter;
      answer.selectedLetters = next;
    },
    clearLetterSlot(slotIndex) {
      const question = getCurrentQuestion();
      const answer = ensureAnswer(question.id);
      const slotCount = question.requireBothCases ? 2 : 1;
      const next = Array.from({ length: slotCount }, (_, index) => answer.selectedLetters?.[index] || '');
      next[Math.max(0, Math.min(slotIndex, slotCount - 1))] = '';
      answer.selectedLetters = next;
    },
    setMatch(pairId, word) {
      const answer = ensureAnswer(getCurrentQuestion().id);
      answer.matches = {
        ...(answer.matches || {}),
        [pairId]: word
      };
    },
    removeMatch(pairId) {
      const answer = ensureAnswer(getCurrentQuestion().id);
      const matches = { ...(answer.matches || {}) };
      delete matches[pairId];
      answer.matches = matches;
    },
    runMockSpeechScore(questionId) {
      const question = state.currentPaper.questions.find((item) => item.id === questionId);
      const answer = ensureAnswer(questionId);
      answer.autoScore = Math.floor(78 + Math.random() * 18);
      answer.transcript = question.phrase || question.sentenceText || question.questionText || '';
      flashScored(questionId);
    },
    runMockKeywordAnswer(questionId) {
      const question = state.currentPaper.questions.find((item) => item.id === questionId);
      const answer = ensureAnswer(questionId);
      answer.transcript = (question.answerKeywords || [question.targetLetter || ''])[0] || '';
      answer.autoScore = 100;
      flashScored(questionId);
    },
    runSpeechRecognition(questionId, targetText) {
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Recognition) {
        window.alert('当前浏览器不支持语音识别，已为你保留演示评分按钮。');
        return;
      }
      stopSpeakingVisuals();
      const audioUi = ensureAudioUi(questionId);
      audioUi.isRecording = true;
      audioUi.justScored = false;
      const recognition = new Recognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript || '';
        const answer = ensureAnswer(questionId);
        answer.transcript = transcript;
        answer.autoScore = safeWord(transcript) === safeWord(targetText)
          ? 100
          : (safeWord(transcript).includes(safeWord(targetText)) ? 82 : 56);
        flashScored(questionId);
      };
      recognition.onerror = () => {
        ensureAudioUi(questionId).isRecording = false;
        window.alert('语音识别失败，请重试或使用演示评分。');
      };
      recognition.onend = () => {
        ensureAudioUi(questionId).isRecording = false;
      };
      recognition.start();
    },
    speak(payload) {
      const { text, questionId } = normalizeSpeakPayload(payload);
      if (!window.speechSynthesis) {
        return;
      }
      activeSpeechToken += 1;
      const speechToken = activeSpeechToken;
      window.speechSynthesis.cancel();
      stopSpeakingVisuals();
      if (questionId) {
        const audioUi = ensureAudioUi(questionId);
        audioUi.isPlaying = true;
        audioUi.isRecording = false;
      }
      state.playbackOverlay = {
        visible: true,
        text,
        kind: questionId ? payload?.kind || 'listening' : 'listening'
      };
      const utter = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
      const selectedVoice = chooseSpeechVoice(voices);
      utter.rate = 0.82;
      utter.pitch = 1.05;
      if (selectedVoice) {
        utter.voice = selectedVoice;
        utter.lang = selectedVoice.lang || 'en-US';
      }
      const safeTextLength = Math.max(1, String(text || '').length);
      const fallbackDuration = Math.max(2200, Math.min(9000, safeTextLength * 240 + 1800));
      playbackFallbackTimer = window.setTimeout(() => {
        if (speechToken === activeSpeechToken) {
          stopSpeakingVisuals();
        }
      }, fallbackDuration);
      utter.onend = () => {
        if (speechToken === activeSpeechToken) {
          stopSpeakingVisuals();
        }
      };
      utter.onerror = () => {
        if (speechToken === activeSpeechToken) {
          stopSpeakingVisuals();
        }
      };
      window.speechSynthesis.speak(utter);
    },
    downloadCurrentReport() {
      if (!state.report) {
        return;
      }
      const html = [
        '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>英语测评报告</title>',
        '<style>body{font-family:Arial,sans-serif;padding:32px;color:#24456f}h1{color:#2a67b5}.card{border:1px solid #d8e8ff;border-radius:14px;padding:16px;margin-bottom:18px;background:#f8fbff}.line{margin:8px 0}</style>',
        '</head><body><h1>儿童英语测评报告</h1>',
        `<div class="card"><strong>学生：</strong>${state.student.name || '-'}<br><strong>年龄：</strong>${state.student.age || '-'}<br><strong>电话：</strong>${state.student.phone || '-'}<br><strong>学校：</strong>${state.student.school || '-'}<br><strong>年级：</strong>${state.student.grade || '-'}</div>`,
        `<div class="card"><strong>总分：</strong>${state.report.total} / ${state.report.totalPossible}<br><strong>完成率：</strong>${state.report.percent}%</div>`,
        '<div class="card"><strong>教师评语</strong>',
        state.report.comments?.opening ? `<div class="line">${state.report.comments.opening}</div>` : '',
        state.report.comments?.middle ? `<div class="line">${state.report.comments.middle}</div>` : '',
        state.report.comments?.closing ? `<div class="line">${state.report.comments.closing}</div>` : '',
        '</div></body></html>'
      ].join('');
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `english-report-${Date.now()}.html`;
      link.click();
      URL.revokeObjectURL(url);
    },
    getShareLink() {
      const payload = {
        examTitle: state.config?.examTitle || '',
        themeNote: state.config?.themeNote || '',
        welcomeSpeech: state.config?.welcomeSpeech || '',
        rewardConfig: clone(state.config?.rewardConfig || {}),
        commentConfig: clone(state.config?.commentConfig || {}),
        questions: (state.config?.questions || []).map((question) => normalizeQuestion(question))
      };
      return `${window.location.origin}${window.location.pathname}#/intake?paper=${encodeConfig(payload)}`;
    },
    initFromEncodedPaper(encodedPaper) {
      const config = decodeConfig(encodedPaper);
      if (!config) {
        return false;
      }
      const normalizedPaper = {
        ...config,
        rewardConfig: normalizeRewardConfig(config.rewardConfig || {}),
        commentConfig: normalizeReportCommentConfig(config.commentConfig || {}),
        questions: (config.questions || []).map((question) => normalizeQuestion(question))
      };
      state.config = clone(normalizedPaper);
      state.currentPaper = clone(normalizedPaper);
      state.paper = state.currentPaper;
      state.student = { name: '', phone: '', age: '', grade: '', school: '' };
      state.answers = {};
      state.audioUi = {};
      state.currentIndex = 0;
      state.report = null;
      state.sessionStarted = false;
      state.playbackOverlay.visible = false;
      return true;
    },
    startExam() {
      if (state.paper && !state.currentPaper) {
        state.currentPaper = clone(state.paper);
        syncLegacyCurrentPaper();
      }
      storeApi.beginPaperSession();
    },
    restartExam() {
      state.answers = {};
      state.audioUi = {};
      state.currentIndex = 0;
      state.report = null;
      state.sessionStarted = false;
      state.currentSubmissionId = '';
      state.finishAnimationVisible = false;
      state.rewardWheelVisible = false;
      state.rewardDrawing = false;
      state.rewardResult = null;
      state.playbackOverlay.visible = false;
      state.waveBars = buildWaveBars();
      syncLegacyCurrentPaper();
    },
    buildShareLink(shareCode) {
      const code = normalizeShareCode(shareCode);
      return `${window.location.origin}${window.location.pathname}#/join?code=${code}`;
    }
  };

  return storeApi;
}

