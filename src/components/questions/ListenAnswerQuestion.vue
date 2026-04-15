<template>
  <div>
    <div class="question-topline">
      <div>
        <span class="tag">口语问答</span>
        <h2 class="question-title">{{ question.prompt }}</h2>
        <div class="question-helper">先听问题，再用英语回答；命中关键词就会得分。</div>
      </div>
      <button class="audio-bubble" @click="$emit('speak', { text: question.questionText, questionId: question.id, kind: 'demo_playing' })">🔊 播放问题</button>
    </div>

    <div class="read-panel">
      <div class="mascot-card read-buddy-card">
        <h3 style="margin: 12px 0 6px; font-size: 28px;">{{ question.questionText }}</h3>
        <p class="muted">可以先听一遍，再点击开始回答。</p>
      </div>
      <div class="recorder-box">
        <div class="score-ring" :style="{ '--value': Math.max(answer.autoScore || 0, 8) }"><span>{{ answer.autoScore || 0 }}</span></div>
        <div class="wave" :class="{ 'wave-passive': audioState.readAloudState !== 'recording' }">
          <span
            v-for="bar in waveBars"
            :key="bar.index"
            :style="{ '--i': bar.index, height: `${bar.height}px` }"
          ></span>
        </div>
        <div class="footer-actions">
          <button class="btn btn-secondary" @click="$emit('start-speech', question.id, '')">
            {{ audioState.readAloudState === 'recording' ? '回答中...' : '开始回答' }}
          </button>
          <button class="btn btn-ghost" @click="$emit('mock-answer', question.id)">使用演示回答</button>
        </div>
        <div class="field" style="margin-top: 18px;">
          <label>识别文本</label>
          <input readonly :value="answer.transcript || '等待开始识别'" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
defineProps({
  question: { type: Object, required: true },
  answer: { type: Object, required: true },
  waveBars: { type: Array, required: true },
  audioState: { type: Object, required: true }
});

defineEmits(['speak', 'start-speech', 'mock-answer']);
</script>
