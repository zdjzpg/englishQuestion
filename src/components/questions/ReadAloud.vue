<template>
  <div>
    <div class="question-topline">
      <div>
        <span class="tag">口语关卡</span>
        <h2 class="question-title">{{ question.prompt }}</h2>
        <div class="question-helper">小熊老师会先示范，再在你开始录音后认真听你说。生产版这里接语音评分 API。</div>
      </div>
      <button class="audio-bubble" @click="$emit('speak', { text: question.phrase, questionId: question.id, kind: 'demo_playing' })">🔊 听示范</button>
    </div>
    <div class="read-panel">
      <div class="mascot-card read-buddy-card">
        <AudioBuddy :mode="audioState.readAloudState" :caption="buddyCaption" />
        <h3 style="margin:12px 0 6px; font-size:30px;">{{ question.phrase }}</h3>
        <p class="muted">大声、完整、清楚地读出来。</p>
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
          <button class="btn btn-secondary" @click="$emit('start-speech', question.id, question.phrase)">
            {{ audioState.readAloudState === 'recording' ? '录音中...' : '开始跟读' }}
          </button>
          <button class="btn btn-ghost" @click="$emit('mock-score', question.id)">使用演示评分</button>
        </div>
        <div class="field" style="margin-top:18px;">
          <label>识别文本 / AI 返回</label>
          <input readonly :value="answer.transcript || '等待开始识别'" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import { computed } from 'vue';
import AudioBuddy from '../shared/AudioBuddy.vue';

const props = defineProps({
  question: { type: Object, required: true },
  answer: { type: Object, required: true },
  waveBars: { type: Array, required: true },
  audioState: { type: Object, required: true }
});

const buddyCaption = computed(() => {
  if (props.audioState.readAloudState === 'demo_playing') {
    return '我先读一遍给你听。';
  }
  if (props.audioState.readAloudState === 'recording') {
    return '轮到你说啦，小熊老师正在听。';
  }
  if (props.audioState.readAloudState === 'scored') {
    return '太棒啦，小熊老师听到了。';
  }
  return '准备好后，跟着小熊老师一起读。';
});

defineEmits(['speak', 'start-speech', 'mock-score']);
</script>
