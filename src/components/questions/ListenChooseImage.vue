<template>
  <div>
    <div class="question-topline">
      <div>
        <span class="tag">听力关卡</span>
        <h2 class="question-title">{{ question.prompt }}</h2>
        <div class="question-helper">点击喇叭播放单词，再选出正确图片。</div>
      </div>
      <button class="audio-bubble" @click="$emit('speak', { text: question.answerWord || question.answer, questionId: question.id, kind: 'listening' })">🔊 播放单词</button>
    </div>
    <div class="listening-buddy-wrap">
      <AudioBuddy :mode="audioState.listeningState" :compact="true" />
    </div>
    <div class="choice-grid">
      <button
        v-for="choice in question.choices"
        :key="choice.id"
        class="choice-card"
        :class="{ selected: answer.selected === choice.id }"
        @click="$emit('select', choice.id)"
      >
        <div v-if="choice.imageUrl" class="choice-image-board">
          <img :src="choice.imageUrl" :alt="choice.word" class="choice-image" />
        </div>
        <div v-else class="emoji-board">{{ emojiForWord(choice.word) }}</div>
        <div class="choice-label">{{ choice.word }}</div>
      </button>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import { emojiForWord } from '../../utils/content';
import AudioBuddy from '../shared/AudioBuddy.vue';

defineProps({
  question: { type: Object, required: true },
  answer: { type: Object, required: true },
  audioState: { type: Object, required: true }
});

defineEmits(['select', 'speak']);
</script>
