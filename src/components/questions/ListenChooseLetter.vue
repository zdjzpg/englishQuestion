<template>
  <div>
    <div class="question-topline">
      <div>
        <span class="tag">字母听辨</span>
        <h2 class="question-title">{{ question.prompt }}</h2>
        <div class="question-helper">
          {{ question.requireBothCases ? '听完后，把两个字母送回上面的两个小窝。' : '听完后，把正确字母送回上面的小窝。' }}
        </div>
      </div>
      <button class="audio-bubble" @click="$emit('speak', { text: question.targetLetter, questionId: question.id, kind: 'listening' })">🔊 播放字母</button>
    </div>

    <div class="letter-home-board">
      <div
        v-for="slot in letterSlots"
        :key="slot.key"
        class="letter-home-shell"
        :class="{ filled: Boolean(slot.value), active: activeSlotKey === slot.key }"
        @dragover.prevent="activeSlotKey = slot.key"
        @dragleave="activeSlotKey = activeSlotKey === slot.key ? '' : activeSlotKey"
        @drop.prevent="dropLetter(slot.index)"
      >
        <div class="letter-home-nest">
          <div v-if="slot.value" class="letter-home-token">
            <span>{{ slot.value }}</span>
            <button class="letter-home-clear" @click="$emit('clear-letter-slot', slot.index)">×</button>
          </div>
          <div v-else class="letter-home-spark">✨</div>
        </div>
      </div>
    </div>

    <div class="loose-letter-garden">
      <button
        v-for="item in looseLetters"
        :key="item.id"
        class="loose-letter-card"
        :class="{ selected: selectedLetters.includes(item.letter) }"
        :style="item.style"
        draggable="true"
        @dragstart="startDrag(item.letter)"
        @dragend="activeSlotKey = ''"
        @click="placeLetter(item.letter)"
      >
        {{ item.letter }}
      </button>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import { computed, ref } from 'vue';

const SCATTER_LAYOUTS = [
  { left: '7%', top: '56%', rotate: '-10deg', delay: '0s' },
  { left: '20%', top: '16%', rotate: '8deg', delay: '0.25s' },
  { left: '35%', top: '52%', rotate: '-5deg', delay: '0.45s' },
  { left: '49%', top: '12%', rotate: '11deg', delay: '0.15s' },
  { left: '63%', top: '54%', rotate: '-12deg', delay: '0.4s' },
  { left: '79%', top: '18%', rotate: '7deg', delay: '0.3s' },
  { left: '13%', top: '76%', rotate: '6deg', delay: '0.5s' },
  { left: '72%', top: '74%', rotate: '-7deg', delay: '0.2s' }
];

const props = defineProps({
  question: { type: Object, required: true },
  answer: { type: Object, required: true },
  audioState: { type: Object, required: true }
});

const emit = defineEmits(['speak', 'toggle-letter', 'set-letter-slot', 'clear-letter-slot']);
const draggedLetter = ref('');
const activeSlotKey = ref('');

const selectedLetters = computed(() => props.answer.selectedLetters || []);
const displayOptions = computed(() => props.question.displayOptions || props.question.options || []);

const letterSlots = computed(() => {
  if (props.question.requireBothCases) {
    const [upperValue = '', lowerValue = ''] = props.answer.selectedLetters || [];
    return [
      { key: 'upper', index: 0, value: upperValue },
      { key: 'lower', index: 1, value: lowerValue }
    ];
  }

  return [
    {
      key: 'single',
      index: 0,
      value: (props.answer.selectedLetters || [])[0] || ''
    }
  ];
});

const looseLetters = computed(() => displayOptions.value.map((letter, index) => {
  const layout = SCATTER_LAYOUTS[index % SCATTER_LAYOUTS.length];
  return {
    id: `${letter}-${index}`,
    letter,
    style: {
      left: layout.left,
      top: layout.top,
      '--rotate': layout.rotate,
      '--delay': layout.delay
    }
  };
}));

function startDrag(letter) {
  draggedLetter.value = letter;
}

function preferredSlotIndex(letter) {
  if (!props.question.requireBothCases) {
    return 0;
  }
  if (letter && letter === letter.toUpperCase()) {
    return 0;
  }
  if (letter && letter === letter.toLowerCase()) {
    return 1;
  }
  return 0;
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
  emit('set-letter-slot', {
    slotIndex: firstEmptySlot ? firstEmptySlot.index : preferredSlotIndex(letter),
    letter
  });
}
</script>
