<template>
  <div>
    <div class="question-topline">
      <div>
        <span class="tag">口语关卡</span>
        <h2 class="question-title">{{ question.prompt }}</h2>
        <div class="question-helper">先听示范，再开始跟读。</div>
      </div>
      <button class="audio-bubble" @click="$emit('speak', { text: question.phrase, questionId: question.id, kind: 'demo_playing' })">🔊 听示范</button>
    </div>
    <div class="read-panel">
      <div class="mascot-card read-buddy-card read-word-card">
        <div class="read-word-badge">跟读词卡</div>
        <h3 class="read-phrase-pop">{{ question.phrase }}</h3>
        <p class="read-word-tip">大声、完整、清楚地读出来。</p>
      </div>
      <div class="recorder-box">
        <div class="read-status-pill" :class="{ recording: audioState.readAloudState === 'recording' }">
          {{ audioState.readAloudState === 'recording' ? '正在听你读...' : '准备好就点击开始跟读' }}
        </div>
        <div class="wave" :class="{ 'wave-passive': audioState.readAloudState !== 'recording' }">
          <span
            v-for="bar in waveBars"
            :key="bar.index"
            :style="{ '--i': bar.index, height: `${bar.height}px` }"
          ></span>
        </div>
        <div class="footer-actions">
          <button
            class="btn btn-primary read-start-btn"
            :class="{ recording: audioState.readAloudState === 'recording' }"
            @click="$emit('start-speech', question.id, question.phrase)"
          >
            {{ audioState.readAloudState === 'recording' ? '结束录音' : '开始跟读' }}
          </button>
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

defineEmits(['speak', 'start-speech']);
</script>
