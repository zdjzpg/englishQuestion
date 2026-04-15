<template>
  <Teleport to="body">
    <StudentOpeningOverlay
      v-if="state.currentPaper && state.openingAnimationVisible"
      :title="state.currentPaper.examTitle"
      @enter="closeOpeningAnimation"
    />
    <StudentFinishOverlay
      v-if="state.currentPaper && state.finishAnimationVisible"
      @continue="completeFinishAnimation"
    />
    <RewardWheelOverlay
      v-if="state.currentPaper && state.rewardWheelVisible"
      :items="rewardItems"
      :drawing="state.rewardDrawing"
      :result="state.rewardResult"
      @draw="drawCurrentReward"
      @close="closeRewardWheel"
    />
    <PlaybackAnimalOverlay
      :open="state.playbackOverlay.visible"
      :text="state.playbackOverlay.text"
      :kind="state.playbackOverlay.kind"
    />
  </Teleport>

  <div
    v-if="state.currentPaper"
    :class="['app-shell', { 'paper-view-shell-intake': isIntakeState, 'paper-view-shell-exam': isExamState }]"
  >
    <template v-if="!state.sessionStarted && !state.report">
      <div class="hero">
        <div class="hero-top">
          <div>
            <h1 class="hero-title">{{ state.currentPaper.examTitle }}</h1>
            <p class="hero-subtitle">{{ state.currentPaper.welcomeSpeech }}</p>
          </div>
        </div>
        <div class="chip-row">
          <div class="chip">📝 {{ state.currentPaper.questions.length }} 道题</div>
          <div class="chip">⭐ 总分 {{ currentPaperTotal }}</div>
        </div>
      </div>

      <div class="main-grid intake-grid">
        <div class="card">
          <div class="card-title">
            <h2>填写学生信息</h2>
          </div>
          <div class="field-grid two">
            <div class="field">
              <label>姓名</label><input v-model="state.student.name" placeholder="例如：小可爱" />
              <div class="field-error-slot">
                <div v-if="showIntakeErrors && fieldError('name')" class="form-error">请填写姓名</div>
              </div>
            </div>
            <div class="field">
              <label>手机号</label><input v-model="state.student.phone" placeholder="家长手机号" />
              <div class="field-error-slot">
                <div v-if="showIntakeErrors && fieldError('phone')" class="form-error">请填写手机号</div>
              </div>
            </div>
            <div class="field">
              <label>年龄</label><input v-model="state.student.age" placeholder="例如：6" />
              <div class="field-error-slot">
                <div v-if="showIntakeErrors && fieldError('age')" class="form-error">请填写年龄</div>
              </div>
            </div>
            <div class="field">
              <label>学校</label><input v-model="state.student.school" placeholder="例如：星光小学" />
              <div class="field-error-slot"></div>
            </div>
            <div class="field field-span-full">
              <label>年级 / 班级</label><input v-model="state.student.grade" placeholder="例如：中班 / 一年级" />
              <div class="field-error-slot">
                <div v-if="showIntakeErrors && fieldError('grade')" class="form-error">请填写年级 / 班级</div>
              </div>
            </div>
          </div>
          <div class="footer-actions">
            <button class="btn btn-primary" @click="beginExam">开始闯关</button>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="state.sessionStarted && !state.report && currentQuestion">
      <div class="exam-header">
        <div class="question-topline">
          <div>
            <div class="tag">第 {{ state.currentIndex + 1 }} / {{ state.currentPaper.questions.length }} 题</div>
            <h2 style="margin: 12px 0 8px; font-size: 28px">{{ state.currentPaper.examTitle }}</h2>
            <div class="muted">{{ state.student.name || '未填写姓名' }} · {{ state.student.age || '-' }}岁 · {{ state.student.school || '-' }} · {{ state.student.grade || '-' }}</div>
          </div>
          <div class="info-badge">当前题分值 {{ currentQuestion.score }}</div>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>

      <div class="exam-layout">
        <div class="question-stage">
          <component
            :is="componentMap[currentQuestion.type]"
            :question="currentQuestion"
            :answer="currentAnswer"
            :audio-state="getQuestionAudioState(currentQuestion.id)"
            :wave-bars="state.waveBars"
            @select="selectOption"
            @speak="speak"
            @add-token="addToken"
            @remove-slot="removeSlot"
            @toggle-letter="toggleLetterSelection"
            @set-letter-slot="setLetterSlot"
            @clear-letter-slot="clearLetterSlot"
            @set-match="setMatch"
            @update-input="updateSpelling"
            @fill-answer="fillAnswer"
            @start-speech="runSpeechRecognition"
            @mock-score="runMockSpeechScore"
            @mock-answer="runMockKeywordAnswer"
          />
        </div>
        <div class="footer-actions">
          <button class="btn btn-ghost" :disabled="state.currentIndex === 0" @click="previousQuestion">上一题</button>
          <button class="btn btn-primary" @click="goNext">
            {{ state.currentIndex === state.currentPaper.questions.length - 1 ? '提交卷子' : '下一题' }}
          </button>
        </div>
      </div>
    </template>

    <template v-else-if="state.report">
      <div ref="reportCaptureRef">
        <div class="hero">
          <div class="hero-top">
            <div>
              <h1 class="hero-title">卷子作答结果</h1>
              <p class="hero-subtitle">学生：{{ state.student.name || '-' }} · 学校：{{ state.student.school || '-' }} · 联系方式：{{ state.student.phone || '-' }}</p>
            </div>
            <div class="hero-actions">
              <button class="btn btn-ghost" @click="router.push({ name: 'answers', query: { paperId: state.currentPaperId } })">查看本卷答题情况</button>
              <button class="btn btn-secondary" @click="downloadReportImage">导出报告图片</button>
              <button class="btn btn-primary" @click="downloadCurrentReport">下载报告 HTML</button>
            </div>
          </div>
          <div class="chip-row">
            <div class="chip">🏆 总分 {{ state.report.total }} / {{ state.report.totalPossible }}</div>
            <div class="chip">📈 完成率 {{ state.report.percent }}%</div>
            <div v-if="state.rewardResult" class="chip">🎁 抽中：{{ state.rewardResult.name }}</div>
          </div>
        </div>

        <div class="report-grid">
          <div class="summary-kpis">
            <div class="kpi">
              <div class="kpi-label">综合得分</div>
              <div class="kpi-value">{{ state.report.total }}</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">总分</div>
              <div class="kpi-value">{{ state.report.totalPossible }}</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">完成率</div>
              <div class="kpi-value">{{ state.report.percent }}%</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">题目数量</div>
              <div class="kpi-value">{{ state.currentPaper.questions.length }}</div>
            </div>
          </div>

          <div v-if="hasReportComments" class="card">
            <div class="card-title">
              <h2>教师评语</h2>
            </div>
            <div class="stack">
              <p v-if="state.report.comments?.opening" class="muted">{{ state.report.comments.opening }}</p>
              <p v-if="state.report.comments?.middle" class="muted">{{ state.report.comments.middle }}</p>
              <p v-if="state.report.comments?.closing" class="muted">{{ state.report.comments.closing }}</p>
            </div>
          </div>

          <div v-if="reportAbilityItems.length" class="card">
            <div class="card-title">
              <h2>能力雷达图</h2>
              <span class="tag">{{ reportAbilityItems.map((item) => item.label).join(' / ') }}</span>
            </div>
            <AbilityRadarChart :items="reportAbilityItems" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { toPng } from 'html-to-image';
import { useRouter } from 'vue-router';
import ListenAnswerQuestion from '../components/questions/ListenAnswerQuestion.vue';
import ListenChooseImage from '../components/questions/ListenChooseImage.vue';
import ListenChooseLetter from '../components/questions/ListenChooseLetter.vue';
import ListenFollowInstruction from '../components/questions/ListenFollowInstruction.vue';
import LookChooseWord from '../components/questions/LookChooseWord.vue';
import MatchImageWord from '../components/questions/MatchImageWord.vue';
import SentenceSort from '../components/questions/SentenceSort.vue';
import ReadAloud from '../components/questions/ReadAloud.vue';
import ReadSentenceWithImage from '../components/questions/ReadSentenceWithImage.vue';
import SpellBlank from '../components/questions/SpellBlank.vue';
import AbilityRadarChart from '../components/shared/AbilityRadarChart.vue';
import PlaybackAnimalOverlay from '../components/shared/PlaybackAnimalOverlay.vue';
import RewardWheelOverlay from '../components/shared/RewardWheelOverlay.vue';
import StudentFinishOverlay from '../components/shared/StudentFinishOverlay.vue';
import StudentOpeningOverlay from '../components/shared/StudentOpeningOverlay.vue';
import questionAbilitiesUtils from '../shared/questionAbilities';
import { useExamStore } from '../store/examStore';

const router = useRouter();
const { REPORT_ABILITIES } = questionAbilitiesUtils;
const {
  state,
  currentQuestion,
  currentAnswer,
  progressPercent,
  closeOpeningAnimation,
  completeFinishAnimation,
  closeRewardWheel,
  drawCurrentReward,
  previousQuestion,
  nextQuestion,
  beginPaperSession,
  getQuestionAudioState,
  missingStudentFields,
  selectOption,
  addToken,
  removeSlot,
  toggleLetterSelection,
  setLetterSlot,
  clearLetterSlot,
  setMatch,
  updateSpelling,
  fillAnswer,
  runSpeechRecognition,
  runMockSpeechScore,
  runMockKeywordAnswer,
  speak,
  downloadCurrentReport,
} = useExamStore();

const componentMap = {
  listen_answer_question: ListenAnswerQuestion,
  listen_choose_image: ListenChooseImage,
  listen_choose_letter: ListenChooseLetter,
  listen_follow_instruction: ListenFollowInstruction,
  look_choose_word: LookChooseWord,
  match_image_word: MatchImageWord,
  sentence_sort: SentenceSort,
  read_aloud: ReadAloud,
  read_sentence_with_image: ReadSentenceWithImage,
  spell_blank: SpellBlank,
};

const currentPaperTotal = computed(() => state.currentPaper ? state.currentPaper.questions.reduce((sum, item) => sum + item.score, 0) : 0);
const intakeAttempted = ref(false);
const showIntakeErrors = computed(() => intakeAttempted.value);
const rewardItems = computed(() => state.currentPaper?.rewardConfig?.items || []);
const isIntakeState = computed(() => Boolean(state.currentPaper && !state.sessionStarted && !state.report));
const isExamState = computed(() => Boolean(state.currentPaper && state.sessionStarted && !state.report));
const reportAbilityItems = computed(() => REPORT_ABILITIES
  .filter((label) => state.report?.abilityMap?.[label]?.total > 0)
  .map((label) => {
    const item = state.report.abilityMap[label];
    return {
      label,
      score: item.score,
      total: item.total,
      percent: item.total ? Math.round((item.score / item.total) * 100) : 0
    };
  }));
const reportCaptureRef = ref(null);
const hasReportComments = computed(() => Boolean(
  state.report?.comments?.opening || state.report?.comments?.middle || state.report?.comments?.closing
));
let finishTimer = null;

function beginExam() {
  intakeAttempted.value = true;
  if (missingStudentFields.value.length > 0) {
    return;
  }
  intakeAttempted.value = false;
  beginPaperSession();
}

async function goNext() {
  await nextQuestion();
}

async function downloadReportImage() {
  if (!reportCaptureRef.value) {
    return;
  }
  const dataUrl = await toPng(reportCaptureRef.value, { cacheBust: true, pixelRatio: 2 });
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `english-report-${Date.now()}.png`;
  link.click();
}

function fieldError(field) {
  return missingStudentFields.value.includes(field);
}

watch(() => state.finishAnimationVisible, (value) => {
  if (finishTimer) {
    window.clearTimeout(finishTimer);
    finishTimer = null;
  }
  if (value) {
    finishTimer = window.setTimeout(() => {
      completeFinishAnimation();
      finishTimer = null;
    }, 1800);
  }
});

onBeforeUnmount(() => {
  if (finishTimer) {
    window.clearTimeout(finishTimer);
  }
});
</script>

