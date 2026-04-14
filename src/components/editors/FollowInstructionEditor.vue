<template>
  <div class="instruction-editor">
    <div class="field-grid two">
      <a-form-item label="听力指令">
        <a-input
          :value="question.instructionText"
          placeholder="例如：Touch your eyes"
          @update:value="updateText('instructionText', $event)"
        />
      </a-form-item>
      <a-form-item label="上传场景图">
        <ImageUploadField
          :model-value="question.imageUrl"
          button-text="上传场景图"
          @update:modelValue="updateText('imageUrl', $event)"
        />
      </a-form-item>
    </div>

    <div class="footer-actions" style="margin-top: 12px;">
      <span class="muted tiny">上传场景图后，在图片上拖动鼠标画出可点击区域。</span>
      <a-space wrap>
        <a-button @click="useDemoImage">使用示例图片</a-button>
        <a-space>
          <a-switch :checked="question.autoPlay !== false" @change="updateAutoPlay" />
          <span class="muted tiny">进入题目自动播报</span>
        </a-space>
      </a-space>
    </div>

    <div class="instruction-editor-grid">
      <a-card class="instruction-canvas-card" :bordered="false">
        <template #title>
          <div class="instruction-canvas-header">
            <div>
              <div class="tag">画框模式</div>
              <div class="muted tiny">在图片上按住鼠标拖出矩形区域，松手后会自动加入右侧列表。</div>
            </div>
            <a-button type="primary" @click="previewInstruction">试听指令</a-button>
          </div>
        </template>

        <div
          ref="canvasRef"
          class="instruction-canvas"
          @mousedown="startDraw"
        >
          <img :src="resolvedImageUrl" alt="instruction scene" class="instruction-scene-image" draggable="false" />
          <div
            v-for="target in targets"
            :key="target.id"
            class="instruction-target-box"
            :class="{ correct: question.correctTargetId === target.id }"
            :style="boxStyle(target)"
            @mousedown.stop
            @click.stop="selectTarget(target.id)"
          >
            <span>{{ target.label || target.id }}</span>
          </div>
          <div
            v-if="draftRect"
            class="instruction-target-box draft"
            :style="draftStyle"
          ></div>
        </div>
      </a-card>

      <a-card class="instruction-sidebar" size="small">
        <template #title>
          <div class="card-title">
            <h3>区域列表</h3>
            <a-tag color="blue">{{ targets.length }} 个</a-tag>
          </div>
        </template>

        <div v-if="targets.length" class="instruction-region-list">
          <div v-for="(target, index) in targets" :key="target.id" class="instruction-region-item">
            <a-form-item :label="`区域 ${index + 1}`">
              <a-input :value="target.label" placeholder="例如：eyes" @update:value="renameTarget(target.id, $event)" />
            </a-form-item>
            <div class="instruction-region-meta">
              <span class="muted tiny">{{ target.id }}</span>
              <span class="muted tiny">{{ target.width }}% × {{ target.height }}%</span>
            </div>
            <a-space wrap>
              <a-button
                :disabled="question.correctTargetId === target.id"
                @click="selectTarget(target.id)"
              >
                {{ question.correctTargetId === target.id ? '当前正确答案' : '设为正确答案' }}
              </a-button>
              <a-button danger @click="removeTarget(target.id)">删除</a-button>
            </a-space>
          </div>
        </div>
        <div v-else class="empty">先在左侧图片上拖动鼠标画框，再到这里命名并设正确答案。</div>
      </a-card>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import { computed, onBeforeUnmount, ref } from 'vue';
import { resolveInstructionImage } from '../../utils/content';
import followInstructionUtils from '../../shared/followInstruction';
import studentExperienceUtils from '../../shared/studentExperience';
import ImageUploadField from './ImageUploadField.vue';

const { SAMPLE_INSTRUCTION_IMAGE, createRectTarget } = followInstructionUtils;
const { chooseSpeechVoice } = studentExperienceUtils;

const props = defineProps({
  question: { type: Object, required: true }
});

const emit = defineEmits(['patch']);
const canvasRef = ref(null);
const drawingBounds = ref(null);
const startPoint = ref(null);
const draftRect = ref(null);

const targets = computed(() => (Array.isArray(props.question.targets) ? props.question.targets : []));
const resolvedImageUrl = computed(() => resolveInstructionImage(props.question.imageUrl));
const draftStyle = computed(() => {
  if (!draftRect.value) {
    return {};
  }
  return {
    left: `${draftRect.value.left}px`,
    top: `${draftRect.value.top}px`,
    width: `${draftRect.value.width}px`,
    height: `${draftRect.value.height}px`
  };
});

function patchQuestion(patch) {
  emit('patch', patch);
}

function updateText(key, value) {
  patchQuestion({ [key]: value });
}

function updateAutoPlay(value) {
  patchQuestion({ autoPlay: value });
}

function useDemoImage() {
  patchQuestion({ imageUrl: SAMPLE_INSTRUCTION_IMAGE });
}

function previewInstruction() {
  if (!window.speechSynthesis || !props.question.instructionText) {
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(props.question.instructionText);
  const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
  const selectedVoice = chooseSpeechVoice(voices);
  utter.rate = 0.9;
  utter.pitch = 1.05;
  if (selectedVoice) {
    utter.voice = selectedVoice;
    utter.lang = selectedVoice.lang || 'en-US';
  }
  window.speechSynthesis.speak(utter);
}

function eventPoint(event) {
  const bounds = canvasRef.value?.getBoundingClientRect();
  if (!bounds) {
    return null;
  }
  return {
    x: Math.max(0, Math.min(bounds.width, event.clientX - bounds.left)),
    y: Math.max(0, Math.min(bounds.height, event.clientY - bounds.top))
  };
}

function updateDraft(point) {
  if (!startPoint.value || !point) {
    return;
  }
  const left = Math.min(startPoint.value.x, point.x);
  const top = Math.min(startPoint.value.y, point.y);
  draftRect.value = {
    left,
    top,
    width: Math.abs(point.x - startPoint.value.x),
    height: Math.abs(point.y - startPoint.value.y)
  };
}

function handleMove(event) {
  updateDraft(eventPoint(event));
}

function finishDraw() {
  window.removeEventListener('mousemove', handleMove);
  window.removeEventListener('mouseup', finishDraw);

  if (!draftRect.value || !drawingBounds.value) {
    startPoint.value = null;
    draftRect.value = null;
    drawingBounds.value = null;
    return;
  }

  if (draftRect.value.width >= 16 && draftRect.value.height >= 16) {
    const nextTargets = targets.value.slice();
    const target = createRectTarget(draftRect.value, drawingBounds.value, nextTargets.length + 1);
    nextTargets.push(target);
    patchQuestion({
      targets: nextTargets,
      correctTargetId: props.question.correctTargetId || target.id
    });
  }

  startPoint.value = null;
  draftRect.value = null;
  drawingBounds.value = null;
}

function startDraw(event) {
  if (event.button !== 0) {
    return;
  }
  const bounds = canvasRef.value?.getBoundingClientRect();
  const point = eventPoint(event);
  if (!bounds || !point) {
    return;
  }

  drawingBounds.value = { width: bounds.width, height: bounds.height };
  startPoint.value = point;
  draftRect.value = { left: point.x, top: point.y, width: 0, height: 0 };

  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', finishDraw);
}

function selectTarget(targetId) {
  patchQuestion({ correctTargetId: targetId });
}

function renameTarget(targetId, value) {
  patchQuestion({
    targets: targets.value.map((target) => (target.id === targetId ? { ...target, label: value } : target))
  });
}

function removeTarget(targetId) {
  const nextTargets = targets.value.filter((target) => target.id !== targetId);
  patchQuestion({
    targets: nextTargets,
    correctTargetId: props.question.correctTargetId === targetId
      ? (nextTargets[0] ? nextTargets[0].id : '')
      : props.question.correctTargetId
  });
}

function boxStyle(target) {
  return {
    left: `${target.x}%`,
    top: `${target.y}%`,
    width: `${target.width}%`,
    height: `${target.height}%`
  };
}

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleMove);
  window.removeEventListener('mouseup', finishDraw);
});
</script>
