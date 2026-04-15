<template>
  <div ref="overlayRef" class="student-overlay student-overlay-wheel">
    <canvas ref="confettiCanvas" class="student-confetti-canvas"></canvas>
    <div ref="cardRef" class="student-overlay-card reward-card">
      <div ref="titleWrapRef">
        <h2>幸运转盘</h2>
        <p v-if="!result">点击开始抽奖，看看今天会抽到什么礼物。</p>
        <p v-else>恭喜你抽中了：{{ result.name }}</p>
      </div>

      <div class="reward-wheel-wrap">
        <div ref="pointerRef" class="reward-wheel-pointer"></div>
        <div ref="wheelRef" class="reward-wheel" :style="wheelStyle">
          <div
            v-for="(item, index) in items"
            :key="item.id"
            class="reward-wheel-label"
            :style="labelStyle(index)"
          >
            <img v-if="item.imageUrl" :src="item.imageUrl" alt="" class="reward-wheel-image" />
            <span>{{ item.name }}</span>
          </div>
        </div>
      </div>

      <div ref="actionsRef" class="reward-wheel-actions">
        <button v-if="!result" class="btn btn-primary student-overlay-cta" :disabled="drawing" @click="$emit('draw')">
          {{ drawing ? '抽奖中...' : '开始抽奖' }}
        </button>
        <button v-else class="btn btn-primary student-overlay-cta" @click="$emit('close')">收下礼物</button>
      </div>

      <div
        v-if="result"
        ref="resultCardRef"
        class="reward-result-card"
      >
        <div class="reward-result-burst">✦ ✦ ✦</div>
        <div class="reward-result-label">你抽中了</div>
        <div class="reward-result-name">{{ result.name }}</div>
        <img v-if="result.imageUrl" :src="result.imageUrl" alt="" class="reward-result-image" />
        <p v-if="result.description" class="reward-result-description">{{ result.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import confetti from 'canvas-confetti';
import { gsap } from 'gsap';
import { computed, onMounted, ref, watch } from 'vue';

const props = defineProps({
  items: { type: Array, required: true },
  drawing: { type: Boolean, required: true },
  result: { type: Object, default: null }
});

defineEmits(['draw', 'close']);

const overlayRef = ref(null);
const confettiCanvas = ref(null);
const cardRef = ref(null);
const titleWrapRef = ref(null);
const wheelRef = ref(null);
const pointerRef = ref(null);
const actionsRef = ref(null);
const resultCardRef = ref(null);
const rotation = ref(0);
const colors = ['#58a6ff', '#7ee081', '#ffd95d', '#ff9c5b', '#ff76ae', '#7d9cff'];
const randomBetween = gsap.utils.random;

const wheelStyle = computed(() => {
  const step = 360 / Math.max(props.items.length, 1);
  const gradient = props.items.map((item, index) => {
    const start = index * step;
    const end = start + step;
    return `${colors[index % colors.length]} ${start}deg ${end}deg`;
  }).join(', ');

  return {
    background: `conic-gradient(${gradient})`
  };
});

onMounted(() => {
  gsap.set([titleWrapRef.value, wheelRef.value, actionsRef.value], { opacity: 0, y: 62, x: () => randomBetween(-24, 24) });
  gsap.set(cardRef.value, { opacity: 0, scale: 0.64, y: 110, rotate: -8 });
  gsap.set(resultCardRef.value, { opacity: 0, scale: 0.38, y: 84, rotate: -12 });

  gsap.timeline()
    .to(overlayRef.value, { opacity: 1, duration: 0.24 })
    .to(cardRef.value, { opacity: 1, scale: 1, y: 0, rotate: 0, duration: 0.95, ease: 'back.out(2)' }, 0.04)
    .to(titleWrapRef.value, { opacity: 1, x: 0, y: 0, duration: 0.66, ease: 'back.out(2.1)' }, 0.26)
    .to(wheelRef.value, { opacity: 1, x: 0, y: 0, duration: 0.72, ease: 'back.out(2.1)' }, 0.38)
    .to(actionsRef.value, { opacity: 1, x: 0, y: 0, duration: 0.62, ease: 'back.out(2)' }, 0.52);

  gsap.to(pointerRef.value, {
    y: () => randomBetween(-14, -5),
    rotate: () => randomBetween(-8, 8),
    duration: () => randomBetween(0.42, 0.86),
    repeat: -1,
    yoyo: true,
    repeatRefresh: true,
    ease: 'power1.inOut'
  });
});

watch(() => props.drawing, (value) => {
  if (value) {
    gsap.to(wheelRef.value, {
      rotate: `+=1440`,
      duration: 2.2,
      ease: 'power3.inOut'
    });
  }
});

watch(() => props.result, (value) => {
  if (!value || !props.items.length) {
    return;
  }
  const index = props.items.findIndex((item) => item.id === value.id);
  const step = 360 / props.items.length;
  const target = index < 0 ? 0 : index * step;
  rotation.value += 1800 + (360 - target - step / 2);
  gsap.to(wheelRef.value, {
    rotate: rotation.value,
    duration: 4.2,
    ease: 'power4.out',
    onComplete: () => {
      const fire = confetti.create(confettiCanvas.value, { resize: true, useWorker: true });
      fire({
        particleCount: 220,
        spread: 128,
        startVelocity: 62,
        scalar: 1.16,
        origin: { x: 0.5, y: 0.55 },
        colors: ['#5ec8ff', '#ffd55d', '#ff8db6', '#7cde86']
      });
      gsap.fromTo(cardRef.value, { scale: 1 }, { scale: 1.08, duration: 0.32, yoyo: true, repeat: 1, ease: 'power1.inOut' });
      if (resultCardRef.value) {
        gsap.fromTo(resultCardRef.value, { opacity: 0, scale: 0.36, y: 92, rotate: -10 }, {
          opacity: 1,
          scale: 1,
          y: 0,
          rotate: 0,
          duration: 0.94,
          ease: 'back.out(2.2)',
          delay: 0.12
        });
      }
    }
  });
});

function labelStyle(index) {
  const step = 360 / Math.max(props.items.length, 1);
  return {
    transform: `rotate(${index * step}deg) translateY(-110px) rotate(${-index * step}deg)`
  };
}
</script>
