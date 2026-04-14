function chooseSpeechVoice(voices = []) {
  if (!Array.isArray(voices) || !voices.length) {
    return null;
  }

  const englishVoice = voices.find((voice) => /^en(-|$)/i.test(voice.lang || ''));
  if (englishVoice) {
    return englishVoice;
  }

  const defaultVoice = voices.find((voice) => voice.default);
  return defaultVoice || voices[0];
}

function normalizeRewardConfig(config = {}) {
  const items = (Array.isArray(config.items) ? config.items : [])
    .map((item, index) => ({
      id: item.id || `reward_${index + 1}`,
      name: String(item.name || '').trim(),
      probability: Number(item.probability || 0),
      imageUrl: String(item.imageUrl || '').trim(),
      description: String(item.description || '').trim()
    }))
    .filter((item) => item.name && item.probability > 0);

  return {
    enabled: config.enabled === true,
    openingAnimationEnabled: config.openingAnimationEnabled === true,
    finishAnimationEnabled: config.finishAnimationEnabled === true,
    items
  };
}

function createDefaultRewardConfig() {
  return {
    enabled: false,
    openingAnimationEnabled: false,
    finishAnimationEnabled: false,
    items: [
      { id: 'reward_1', name: '贴纸', probability: 60, imageUrl: '', description: '' },
      { id: 'reward_2', name: '铅笔', probability: 30, imageUrl: '', description: '' },
      { id: 'reward_3', name: '小礼物', probability: 10, imageUrl: '', description: '' }
    ]
  };
}

function pickRewardItem(config = {}, randomValue = Math.random()) {
  const normalized = normalizeRewardConfig(config);
  const totalWeight = normalized.items.reduce((sum, item) => sum + item.probability, 0);
  if (!normalized.enabled || !normalized.items.length || totalWeight <= 0) {
    return null;
  }

  const roll = Math.max(0, Math.min(0.999999, Number(randomValue) || 0)) * totalWeight;
  let cursor = 0;
  for (const item of normalized.items) {
    cursor += item.probability;
    if (roll < cursor) {
      return item;
    }
  }

  return normalized.items[normalized.items.length - 1] || null;
}

module.exports = {
  chooseSpeechVoice,
  createDefaultRewardConfig,
  normalizeRewardConfig,
  pickRewardItem
};
