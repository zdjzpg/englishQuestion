<template>
  <div ref="overlayRef" class="student-overlay student-overlay-finish">
    <canvas ref="confettiCanvas" class="student-confetti-canvas"></canvas>
    <div class="student-overlay-glow finish-glow left"></div>
    <div class="student-overlay-glow finish-glow right"></div>

    <div ref="cardRef" class="student-overlay-card finish-card">
      <div ref="starsRef" class="finish-stars">✨ ✨ ✨</div>
      <h2 ref="titleRef">闯关完成</h2>
      <p ref="subtitleRef">你的答卷已经提交，准备进入幸运转盘。</p>
      <div ref="buttonWrapRef" class="finish-button-wrap">
        <button ref="buttonRef" class="btn btn-primary student-overlay-cta" @click="$emit('continue')">继续</button>
      </div>
    </div>
  </div>
</template>

<script setup>
/* global defineEmits */
import confetti from 'canvas-confetti';
import { gsap } from 'gsap';
import { onMounted, ref } from 'vue';

defineEmits(['continue']);

const overlayRef = ref(null);
const confettiCanvas = ref(null);
const cardRef = ref(null);
const starsRef = ref(null);
const titleRef = ref(null);
const subtitleRef = ref(null);
const buttonWrapRef = ref(null);
const buttonRef = ref(null);

onMounted(() => {
  gsap.set([starsRef.value, titleRef.value, subtitleRef.value, buttonWrapRef.value], {
    opacity: 0,
    y: 28
  });
  gsap.set(cardRef.value, { opacity: 0, scale: 0.78, y: 40 });
  gsap.set('.finish-glow', { opacity: 0, scale: 0.8 });

  gsap.timeline()
    .to(overlayRef.value, { opacity: 1, duration: 0.18 })
    .to('.finish-glow', { opacity: 1, scale: 1, duration: 0.9, ease: 'power2.out' }, 0)
    .to(cardRef.value, { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'back.out(1.35)' }, 0.05)
    .to(starsRef.value, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 0.24)
    .to(titleRef.value, { opacity: 1, y: 0, duration: 0.52, ease: 'power3.out' }, 0.34)
    .to(subtitleRef.value, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.48)
    .to(buttonWrapRef.value, { opacity: 1, y: 0, duration: 0.45, ease: 'back.out(1.2)' }, 0.9);

  gsap.to(starsRef.value, {
    y: '-=8',
    duration: 1.2,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  const fire = confetti.create(confettiCanvas.value, { resize: true, useWorker: true });
  fire({
    particleCount: 90,
    spread: 90,
    startVelocity: 45,
    origin: { x: 0.5, y: 0.75 },
    colors: ['#5ec8ff', '#ffd55d', '#ff8db6', '#7cde86']
  });
  window.setTimeout(() => {
    fire({
      particleCount: 70,
      angle: 60,
      spread: 70,
      origin: { x: 0.12, y: 0.8 },
      colors: ['#5ec8ff', '#ffd55d', '#ff8db6']
    });
    fire({
      particleCount: 70,
      angle: 120,
      spread: 70,
      origin: { x: 0.88, y: 0.8 },
      colors: ['#7cde86', '#ffd55d', '#ff8db6']
    });
  }, 260);
});
</script>
