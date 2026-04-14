<template>
  <div>
    <div class="question-topline">
      <div>
        <span class="tag">读图关卡</span>
        <h2 class="question-title">{{ question.prompt }}</h2>
        <div class="question-helper">看图后，从下方选出正确单词。</div>
      </div>
      <div class="info-badge">目标图片</div>
    </div>
    <div v-if="question.imageUrl" class="choice-image-board" style="margin-top:18px;">
      <img :src="question.imageUrl" :alt="question.targetWord" class="choice-image" />
    </div>
    <div v-else class="emoji-board" style="font-size:96px; margin-top:18px;">{{ emojiForWord(question.targetWord) }}</div>
    <div class="option-row">
      <button
        v-for="word in question.options"
        :key="word"
        class="option-chip"
        :class="{ selected: answer.selected === word }"
        @click="$emit('select', word)"
      >
        {{ word }}
      </button>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import { emojiForWord } from '../../utils/content';

defineProps({
  question: { type: Object, required: true },
  answer: { type: Object, required: true }
});

defineEmits(['select']);
</script>
