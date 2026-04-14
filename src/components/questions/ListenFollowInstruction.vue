<template>
  <div>
    <div class="question-topline">
      <div>
        <span class="tag">听力动作关卡</span>
        <h2 class="question-title">{{ question.prompt }}</h2>
        <div class="question-helper">听清指令后，点击图片里的正确区域。</div>
      </div>
      <button class="audio-bubble" @click="$emit('speak', { text: question.instructionText, questionId: question.id, kind: 'listening' })">🔊 播放指令</button>
    </div>

    <div class="instruction-player-card">
      <div class="instruction-script">{{ question.instructionText }}</div>
      <div class="muted tiny">示例：老师在配置页画框，学生端就按这些区域直接点击。</div>
    </div>
    <div class="listening-buddy-wrap">
      <AudioBuddy :mode="audioState.listeningState" :compact="true" caption="先听小熊老师的提示，再点击正确区域。" />
    </div>

    <div class="student-instruction-stage">
      <img :src="resolvedImageUrl" alt="instruction scene" class="student-instruction-image" />
      <button
        v-for="target in question.targets"
        :key="target.id"
        type="button"
        class="student-hit-target"
        :class="{ selected: answer.selected === target.id }"
        :style="targetStyle(target)"
        @click="$emit('select', target.id)"
      >
        <span>{{ target.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import { computed, onMounted } from 'vue';
import { resolveInstructionImage } from '../../utils/content';
import AudioBuddy from '../shared/AudioBuddy.vue';

const props = defineProps({
  question: { type: Object, required: true },
  answer: { type: Object, required: true },
  audioState: { type: Object, required: true }
});

const emit = defineEmits(['select', 'speak']);
const resolvedImageUrl = computed(() => resolveInstructionImage(props.question.imageUrl));

function targetStyle(target) {
  return {
    left: `${target.x}%`,
    top: `${target.y}%`,
    width: `${target.width}%`,
    height: `${target.height}%`
  };
}

onMounted(() => {
  if (props.question.autoPlay) {
    window.setTimeout(() => emit('speak', { text: props.question.instructionText, questionId: props.question.id, kind: 'listening' }), 150);
  }
});
</script>
