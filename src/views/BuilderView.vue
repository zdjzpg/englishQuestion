<template>
  <div class="app-shell">
    <div class="hero">
      <div class="hero-top">
        <div>
          <h1 class="hero-title">儿童英语测评乐园 · Vue CLI 版</h1>
          <p class="hero-subtitle">现在已经拆成标准 Vue 工程结构：页面、题型组件、路由和共享状态分开维护。</p>
        </div>
        <div class="hero-actions">
          <button class="btn btn-secondary" @click="goPreview">预览学生答题</button>
          <button class="btn btn-primary" @click="copyShareLink">复制分享链接</button>
        </div>
      </div>
      <div class="chip-row">
        <div class="chip">🧩 Vue CLI 工程</div>
        <div class="chip">🧸 固定题型组件</div>
        <div class="chip">📊 报告 + 记录页</div>
        <div class="chip">📦 当前总分 {{ totalScore }}</div>
      </div>
    </div>

    <div class="main-grid">
      <div class="stack">
        <div class="card">
          <div class="card-title"><h2>试卷配置</h2><span class="tag">Step 1</span></div>
          <div class="field-grid">
            <div class="field"><label>测评名称</label><input v-model="state.config.examTitle" /></div>
            <div class="field"><label>欢迎语</label><textarea v-model="state.config.welcomeSpeech"></textarea></div>
            <div class="field"><label>页面说明</label><textarea v-model="state.config.themeNote"></textarea></div>
          </div>
        </div>

        <div class="card">
          <div class="card-title"><h2>添加题型</h2><span class="tag">固定模板</span></div>
          <div class="toolbar">
            <button v-for="(meta, type) in TYPE_META" :key="type" class="template-pill" @click="addQuestion(type)">
              {{ meta.icon }} {{ meta.label }}
            </button>
          </div>
          <p class="muted tiny" style="margin-top:14px;">接入图片、音频和 AI 评分后，继续沿用这套组件，不需要重做页面。</p>
        </div>
      </div>

      <div class="stack">
        <div class="card">
          <div class="card-title"><h2>题目列表</h2><span class="tag">{{ state.config.questions.length }} 题</span></div>
          <div v-if="state.config.questions.length" class="question-list">
            <div v-for="(question, index) in state.config.questions" :key="question.id" class="question-editor">
              <div class="question-editor-header">
                <div>
                  <div class="tag">第 {{ index + 1 }} 题</div>
                  <h3>{{ TYPE_META[question.type].icon }} {{ TYPE_META[question.type].label }}</h3>
                </div>
                <div class="toolbar">
                  <span class="tag">{{ questionAbilityLabel(question) }}</span>
                  <button class="btn btn-ghost" @click="duplicateQuestion(question.id)">复制</button>
                  <button class="btn btn-ghost" @click="removeQuestion(question.id)">删除</button>
                </div>
              </div>
              <div class="question-editor-body">
                <div class="field-grid two">
                  <div class="field"><label>题目提示</label><input v-model="question.prompt" /></div>
                  <div class="field"><label>本题分数</label><input v-model.number="question.score" type="number" min="0" /></div>
                  <div class="field" style="grid-column: 1 / -1;">
                    <label>能力维度</label>
                    <select v-model="question.abilities" multiple>
                      <option v-for="option in abilityOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </option>
                    </select>
                  </div>

                  <template v-if="question.type === 'listen_choose_image'">
                    <div class="field" style="grid-column: 1 / -1;">
                      <ListenChooseImageEditor :question="question" @patch="patchQuestion(question, $event)" />
                    </div>
                  </template>
                  <template v-else-if="question.type === 'look_choose_word'">
                    <div class="field" style="grid-column: 1 / -1;">
                      <LookChooseWordEditor :question="question" @patch="patchQuestion(question, $event)" />
                    </div>
                  </template>
                  <template v-else-if="question.type === 'sentence_sort'">
                    <div class="field" style="grid-column: 1 / -1;"><label>目标句子</label><input v-model="question.sentence" /></div>
                  </template>
                  <template v-else-if="question.type === 'read_aloud'">
                    <div class="field"><label>朗读内容</label><input v-model="question.phrase" /></div>
                    <div class="field"><label>展示词</label><input v-model="question.mascotWord" /></div>
                  </template>
                  <template v-else>
                    <div class="field"><label>答案单词</label><input v-model="question.answerWord" /></div>
                    <div class="field"><label>挖空位置（从0开始，逗号分隔）</label><input v-model="question.blankIndexesText" /></div>
                  </template>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty">先添加一个题型模板，再开始配置内容。</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import ListenChooseImageEditor from '../components/editors/ListenChooseImageEditor.vue';
import LookChooseWordEditor from '../components/editors/LookChooseWordEditor.vue';
import questionAbilitiesUtils from '../shared/questionAbilities';
import { useExamStore } from '../store/examStore';

const router = useRouter();
const { state, TYPE_META, totalScore, addQuestion, duplicateQuestion, removeQuestion, getShareLink } = useExamStore();
const { REPORT_ABILITIES, getDefaultAbilitiesForType } = questionAbilitiesUtils;
const abilityOptions = REPORT_ABILITIES.map((value) => ({ label: value, value }));

function copyShareLink() {
  const link = getShareLink();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(link);
    window.alert('分享链接已复制。');
  } else {
    window.prompt('请复制以下链接：', link);
  }
}

function goPreview() {
  const encodedPaper = getShareLink().split('paper=')[1];
  router.push({ name: 'intake', query: { paper: encodedPaper } });
}

function patchQuestion(question, patch) {
  Object.assign(question, patch);
}

function questionAbilityLabel(question) {
  const labels = Array.isArray(question.abilities) && question.abilities.length
    ? question.abilities
    : getDefaultAbilitiesForType(question.type);
  return labels.length ? `${labels.join(' / ')}能力` : '未配置能力';
}
</script>
