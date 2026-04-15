<template>
  <div v-if="open" ref="overlayRef" class="playback-overlay">
    <div ref="cardRef" class="playback-overlay-card">
      <div ref="glowRef" class="playback-overlay-glow"></div>
      <div class="playback-overlay-label">{{ overlayLabel }}</div>
      <div class="playback-overlay-stage">
        <div ref="animalRef" class="playback-overlay-animal">🐰</div>
        <div class="playback-overlay-rings">
          <span ref="ringOneRef"></span>
          <span ref="ringTwoRef"></span>
          <span ref="ringThreeRef"></span>
        </div>
      </div>
      <p class="playback-overlay-text">{{ text || '正在播放语音，请认真听。' }}</p>
    </div>
  </div>
</template>

<script setup>
/* global defineProps */
import { gsap } from 'gsap';
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps({
  open: { type: Boolean, default: false },
  kind: { type: String, default: 'listening' },
  text: { type: String, default: '' }
});

const overlayRef = ref(null);
const cardRef = ref(null);
const glowRef = ref(null);
const animalRef = ref(null);
const ringOneRef = ref(null);
const ringTwoRef = ref(null);
const ringThreeRef = ref(null);
const loopTweens = [];

const overlayLabel = computed(() => props.kind === 'demo_playing' ? '示范播放中' : '听音播放中');

function stopLoops() {
  loopTweens.splice(0).forEach((tween) => tween.kill());
}

function getAnimationTargets() {
  if (
    !overlayRef.value
    || !cardRef.value
    || !glowRef.value
    || !animalRef.value
    || !ringOneRef.value
    || !ringTwoRef.value
    || !ringThreeRef.value
  ) {
    return null;
  }

  return {
    overlay: overlayRef.value,
    card: cardRef.value,
    glow: glowRef.value,
    animal: animalRef.value,
    rings: [ringOneRef.value, ringTwoRef.value, ringThreeRef.value]
  };
}

async function playOpenAnimation() {
  stopLoops();
  await nextTick();

  const targets = getAnimationTargets();
  if (!targets) {
    return;
  }

  gsap.set(targets.overlay, { opacity: 0 });
  gsap.set(targets.card, { opacity: 0, y: 18, scale: 0.9 });
  gsap.set(targets.glow, { opacity: 0.4, scale: 0.7 });
  gsap.set(targets.animal, { y: 10, scale: 0.88, rotate: -6 });
  gsap.set(targets.rings, { opacity: 0, x: -12, scaleX: 0.4 });

  const timeline = gsap.timeline();
  timeline
    .to(targets.overlay, { opacity: 1, duration: 0.18 })
    .to(targets.card, { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: 'back.out(1.6)' }, 0)
    .to(targets.glow, { opacity: 0.92, scale: 1, duration: 0.5, ease: 'power2.out' }, 0.08)
    .to(targets.animal, { y: 0, scale: 1, rotate: 0, duration: 0.45, ease: 'back.out(1.8)' }, 0.06)
    .to(targets.rings, {
      opacity: 1,
      x: 0,
      scaleX: 1,
      duration: 0.36,
      stagger: 0.08,
      ease: 'power2.out'
    }, 0.18);

  loopTweens.push(
    gsap.to(targets.animal, {
      y: '-=10',
      rotate: 3,
      duration: 1.4,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })
  );
  loopTweens.push(
    gsap.to(targets.glow, {
      scale: 1.08,
      opacity: 0.75,
      duration: 1.3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })
  );
  loopTweens.push(
    gsap.to(targets.rings, {
      x: '+=10',
      opacity: 0.2,
      duration: 0.9,
      stagger: 0.12,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })
  );
}

watch(() => props.open, async (value) => {
  if (value) {
    await playOpenAnimation();
    return;
  }
  stopLoops();
}, { flush: 'post' });

onBeforeUnmount(() => {
  stopLoops();
});
</script>
