<template>
  <div>
    <div class="question-topline">
      <div>
        <span class="tag">字母听辨</span>
        <h2 class="question-title">{{ question.prompt }}</h2>
        <div class="question-helper">
          {{ question.requireBothCases ? '把对应的大写和小写字母拖进下面两个框里。' : '把听到的字母拖进下面的选择框里。' }}
        </div>
      </div>
      <button class="audio-bubble" @click="$emit('speak', { text: question.targetLetter, questionId: question.id, kind: 'listening' })">🔊 播放字母</button>
    </div>

    <div class="listening-buddy-wrap">
      <AudioBuddy :mode="audioState.listeningState" :compact="true" caption="先听一听，再把卡通字母拖进答案框。" />
    </div>

    <div class="letter-drop-board">
      <div
        v-for="slot in letterSlots"
        :key="slot.key"
        class="letter-drop-zone"
        :class="{ filled: Boolean(slot.value), active: activeSlotKey === slot.key }"
        @dragover.prevent="activeSlotKey = slot.key"
        @dragleave="activeSlotKey = activeSlotKey === slot.key ? '' : activeSlotKey"
        @drop.prevent="dropLetter(slot.index)"
      >
        <div class="letter-drop-label">{{ slot.label }}</div>
        <div v-if="slot.value" class="letter-drop-token">
          <span>{{ slot.value }}</span>
          <button class="letter-drop-clear" @click="$emit('clear-letter-slot', slot.index)">×</button>
        </div>
        <div v-else class="letter-drop-placeholder">拖到这里</div>
      </div>
    </div>

    <div class="letter-pool">
      <div class="letter-pool-label">字母池</div>
      <div class="letter-choice-grid letter-pool-grid">
        <button
          v-for="letter in displayOptions"
          :key="letter"
          class="letter-choice-card letter-pool-card"
          :class="{ selected: selectedLetters.includes(letter) }"
          draggable="true"
          @dragstart="startDrag(letter)"
          @dragend="activeSlotKey = ''"
          @click="placeLetter(letter)"
        >
          <span class="letter-card-glyph">{{ letter }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import { computed, ref } from 'vue';
import AudioBuddy from '../shared/AudioBuddy.vue';

const props = defineProps({
  question: { type: Object, required: true },
  answer: { type: Object, required: true },
  audioState: { type: Object, required: true }
});

const selectedLetters = computed(() => props.answer.selectedLetters || []);
const displayOptions = computed(() => props.question.displayOptions || props.question.options || []);
const draggedLetter = ref('');
const activeSlotKey = ref('');

const letterSlots = computed(() => {
  if (props.question.requireBothCases) {
    const [upperValue = '', lowerValue = ''] = props.answer.selectedLetters || [];
    return [
      { key: 'upper', index: 0, label: '大写框', value: upperValue },
      { key: 'lower', index: 1, label: '小写框', value: lowerValue }
    ];
  }

  return [
    {
      key: 'single',
      index: 0,
      label: '选择框',
      value: (props.answer.selectedLetters || [])[0] || ''
    }
  ];
});

const emit = defineEmits(['speak', 'toggle-letter', 'set-letter-slot', 'clear-letter-slot']);

function startDrag(letter) {
  draggedLetter.value = letter;
}

function dropLetter(slotIndex) {
  if (!draggedLetter.value) {
    return;
  }
  emit('set-letter-slot', { slotIndex, letter: draggedLetter.value });
  draggedLetter.value = '';
  activeSlotKey.value = '';
}

function placeLetter(letter) {
  const firstEmptySlot = letterSlots.value.find((slot) => !slot.value);
  const fallbackSlotIndex = props.question.requireBothCases ? 0 : 0;
  emit('set-letter-slot', {
    slotIndex: firstEmptySlot ? firstEmptySlot.index : fallbackSlotIndex,
    letter
  });
}
</script>
