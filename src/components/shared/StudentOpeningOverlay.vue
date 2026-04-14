<template>
  <div ref="overlayRef" class="student-overlay student-overlay-opening">
    <div ref="frameRef" class="storybook-backdrop-frame">
      <div class="student-overlay-glow opening-glow left"></div>
      <div class="student-overlay-glow opening-glow right"></div>
      <div class="storybook-backdrop-ornaments">
        <div class="storybook-ornament storybook-ornament-star">★</div>
        <div class="storybook-ornament storybook-ornament-cloud"></div>
        <div class="storybook-ornament storybook-ornament-balloon"></div>
      </div>
    </div>

    <div ref="stageRef" class="storybook-stage">
      <div ref="backRef" class="storybook-shell storybook-back"></div>
      <div ref="shadowRef" class="storybook-shadow"></div>

      <div ref="frontRef" class="storybook-shell storybook-cover-front">
        <div class="storybook-spine"></div>
        <div class="storybook-corner"></div>

        <div class="student-sparkles storybook-dust">
          <span
            v-for="sparkle in sparkles"
            :key="sparkle.id"
            class="student-sparkle"
            :style="sparkle.style"
          >
            ✦
          </span>
        </div>

        <div class="storybook-cover-content">
          <h2 ref="titleRef" class="storybook-title">
            <span
              v-for="(char, index) in titleChars"
              :key="`${char}_${index}`"
              class="opening-title-char"
            >
              {{ char === ' ' ? '\u00A0' : char }}
            </span>
          </h2>
          <p ref="subtitleRef" class="storybook-subtitle">准备好了吗？一起开始今天的英语小挑战吧。</p>
          <div ref="buttonWrapRef" class="storybook-button-wrap">
            <button ref="buttonRef" class="btn btn-primary student-overlay-cta" @click="$emit('enter')">进入测评</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/* global defineProps, defineEmits */
import { gsap } from 'gsap';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps({
  title: { type: String, required: true }
});

defineEmits(['enter']);

const overlayRef = ref(null);
const frameRef = ref(null);
const stageRef = ref(null);
const backRef = ref(null);
const shadowRef = ref(null);
const frontRef = ref(null);
const titleRef = ref(null);
const subtitleRef = ref(null);
const buttonWrapRef = ref(null);
const buttonRef = ref(null);
const titleChars = computed(() => Array.from(props.title || ''));
const loopTweens = [];

const sparkles = [
  { id: 's1', style: { top: '14%', left: '12%' } },
  { id: 's2', style: { top: '22%', right: '11%' } },
  { id: 's3', style: { top: '76%', left: '10%' } },
  { id: 's4', style: { top: '72%', right: '12%' } },
  { id: 's5', style: { top: '12%', left: '56%' } },
  { id: 's6', style: { top: '84%', left: '58%' } }
];

onMounted(() => {
  gsap.set([subtitleRef.value, buttonWrapRef.value], { opacity: 0, y: 36 });
  gsap.set(backRef.value, { opacity: 0, scale: 0.9, rotate: -10, x: -90, y: 24 });
  gsap.set(shadowRef.value, { opacity: 0, scaleX: 0.72, scaleY: 0.8 });
  gsap.set(frontRef.value, {
    opacity: 0,
    scale: 0.82,
    rotateY: -48,
    rotate: -4,
    x: 130,
    y: 38,
    transformOrigin: 'left center'
  });
  gsap.set(frameRef.value, { opacity: 0, scale: 0.94, y: 24 });
  gsap.set('.opening-title-char', { opacity: 0, y: 34, rotate: -8, scale: 0.92 });
  gsap.set('.storybook-dust .student-sparkle', { opacity: 0, scale: 0.4, y: 16 });
  gsap.set('.opening-glow', { opacity: 0, scale: 0.68 });
  gsap.set('.storybook-ornament', { opacity: 0, scale: 0.86 });

  const timeline = gsap.timeline();
  timeline
    .to(overlayRef.value, { opacity: 1, duration: 0.2 })
    .to(frameRef.value, { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: 'power2.out' }, 0.04)
    .to('.opening-glow', { opacity: 1, scale: 1, duration: 1.25, ease: 'power2.out' }, 0)
    .to('.storybook-ornament', { opacity: 1, scale: 1, duration: 0.7, stagger: 0.1, ease: 'power2.out' }, 0.14)
    .to(backRef.value, { opacity: 1, scale: 1, rotate: -4, x: -24, y: 8, duration: 0.82, ease: 'power3.out' }, 0.12)
    .to(shadowRef.value, { opacity: 1, scaleX: 1, scaleY: 1, duration: 0.74, ease: 'power2.out' }, 0.18)
    .to(frontRef.value, {
      opacity: 1,
      scale: 1,
      rotateY: 0,
      rotate: 0,
      x: 0,
      y: 0,
      duration: 1.02,
      ease: 'expo.out'
    }, 0.22)
    .to('.storybook-dust .student-sparkle', {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.55,
      stagger: 0.06,
      ease: 'back.out(2)'
    }, 0.44)
    .to('.opening-title-char', {
      opacity: 1,
      y: 0,
      rotate: 0,
      scale: 1,
      duration: 0.52,
      stagger: 0.03,
      ease: 'power3.out'
    }, 0.58)
    .to(subtitleRef.value, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.88)
    .to(buttonWrapRef.value, { opacity: 1, y: 0, duration: 0.46, ease: 'back.out(1.3)' }, 1.02);

  loopTweens.push(
    gsap.to(buttonRef.value, {
      boxShadow: '0 0 0 14px rgba(255, 196, 108, 0.14)',
      duration: 1.35,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 1.6
    })
  );

  loopTweens.push(
    gsap.to('.storybook-dust .student-sparkle', {
      y: '-=10',
      duration: 2.2,
      repeat: -1,
      yoyo: true,
      stagger: 0.14,
      ease: 'sine.inOut'
    })
  );

  loopTweens.push(
        gsap.to('.storybook-ornament-star', {
          y: '-=18',
          rotate: 10,
          duration: 3.4,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })
  );

  loopTweens.push(
        gsap.to('.storybook-ornament-cloud', {
          x: '+=42',
          duration: 8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })
  );

  loopTweens.push(
        gsap.to('.storybook-ornament-balloon', {
          y: '-=26',
          duration: 4.6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })
  );
});

onBeforeUnmount(() => {
  loopTweens.forEach((tween) => tween.kill());
});
</script>
