function uniqueId() {
  return `comment_${Math.random().toString(36).slice(2, 9)}`;
}

function createDefaultReportCommentConfig() {
  return {
    opening: '',
    closing: '',
    bands: [
      { id: uniqueId(), minScore: 90, text: '' },
      { id: uniqueId(), minScore: 60, text: '' }
    ]
  };
}

function normalizeReportCommentConfig(config = {}) {
  return {
    opening: String(config.opening || '').trim(),
    closing: String(config.closing || '').trim(),
    bands: (Array.isArray(config.bands) ? config.bands : [])
      .map((item, index) => ({
        id: item.id || `comment_${index + 1}`,
        minScore: Math.max(0, Number(item.minScore || 0)),
        text: String(item.text || '').trim()
      }))
      .filter((item) => item.text)
      .sort((left, right) => right.minScore - left.minScore)
  };
}

function resolveReportComments(config, totalScore) {
  const normalized = normalizeReportCommentConfig(config);
  const score = Number(totalScore || 0);
  const matched = normalized.bands.find((item) => score >= item.minScore) || null;

  return {
    opening: normalized.opening,
    middle: matched?.text || '',
    closing: normalized.closing
  };
}

module.exports = {
  createDefaultReportCommentConfig,
  normalizeReportCommentConfig,
  resolveReportComments
};
