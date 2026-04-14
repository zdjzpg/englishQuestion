<template>
  <div>
    <div class="question-topline">
      <div>
        <span class="tag">图片连线</span>
        <h2 class="question-title">{{ question.prompt }}</h2>
        <div class="question-helper">先点击左侧图片，再点击右侧单词完成配对。</div>
      </div>
      <div class="info-badge">已连 {{ Object.keys(answer.matches || {}).length }} / {{ question.pairs.length }}</div>
    </div>

    <div class="match-board">
      <div class="match-column">
        <button
          v-for="pair in question.pairs"
          :key="pair.id"
          class="match-card image"
          :class="{ active: activePairId === pair.id, linked: Boolean((answer.matches || {})[pair.id]) }"
          @click="activePairId = pair.id"
        >
          <img v-if="pair.imageUrl" :src="pair.imageUrl" alt="match option" class="question-asset-image" />
          <div v-else class="emoji-board sentence-image-fallback">🖼️</div>
          <div class="match-card-note">{{ pair.id }}</div>
        </button>
      </div>

      <div class="match-column">
        <button
          v-for="pair in shuffledPairs"
          :key="`${pair.id}_${pair.word}`"
          class="match-card word"
          :class="{ selected: assignedWordIds.includes(pair.word) }"
          @click="selectWord(pair.word)"
        >
          {{ pair.word }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import { computed, ref } from 'vue';

const props = defineProps({
  question: { type: Object, required: true },
  answer: { type: Object, required: true }
});

const emit = defineEmits(['set-match']);
const activePairId = ref('');

const shuffledPairs = computed(() => {
  const pairs = (props.question.pairs || []).slice();
  return pairs.sort((left, right) => left.word.localeCompare(right.word));
});
const assignedWordIds = computed(() => Object.values(props.answer.matches || {}));

function selectWord(word) {
  if (!activePairId.value) {
    return;
  }
  emit('set-match', { pairId: activePairId.value, word });
  activePairId.value = '';
}
</script>
