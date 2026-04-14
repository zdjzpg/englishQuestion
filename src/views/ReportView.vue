<template>
  <div class="app-shell" v-if="state.report">
    <div class="hero">
      <div class="hero-top">
        <div>
          <h1 class="hero-title">测评报告已生成</h1>
          <p class="hero-subtitle">学生：{{ state.student.name || '-' }} · 年龄：{{ state.student.age || '-' }} · 学校：{{ state.student.school || '-' }} · 联系方式：{{ state.student.phone || '-' }}</p>
        </div>
        <div class="hero-actions">
          <button class="btn btn-secondary" @click="restartAndBack">重新作答</button>
          <button class="btn btn-ghost" @click="router.push({ name: 'records', query: route.query })">查看作答记录</button>
          <button class="btn btn-secondary" @click="downloadReportImage">导出报告图片</button>
          <button class="btn btn-primary" @click="downloadReport">下载报告 HTML</button>
        </div>
      </div>
      <div class="chip-row">
        <div class="chip">🏆 总分 {{ state.report.total }} / {{ state.report.totalPossible }}</div>
        <div class="chip">📈 完成率 {{ state.report.percent }}%</div>
        <div class="chip">📚 已拆分独立记录页</div>
      </div>
    </div>

    <div ref="reportCaptureRef" class="report-grid">
      <div class="summary-kpis">
        <div class="kpi"><div class="kpi-label">综合得分</div><div class="kpi-value">{{ state.report.total }}</div></div>
        <div class="kpi"><div class="kpi-label">总分</div><div class="kpi-value">{{ state.report.totalPossible }}</div></div>
        <div class="kpi"><div class="kpi-label">完成率</div><div class="kpi-value">{{ state.report.percent }}%</div></div>
        <div class="kpi"><div class="kpi-label">题目数量</div><div class="kpi-value">{{ state.paper.questions.length }}</div></div>
      </div>

      <div class="report-panels">
        <div class="card">
          <div class="card-title"><h2>能力分布</h2><span class="tag">{{ reportAbilityItems.map((item) => item.label).join(' / ') }}</span></div>
          <div class="bars">
            <div v-for="item in reportAbilityItems" :key="item.label" class="bar-row">
              <div class="bar-label">{{ item.label }}</div>
              <div class="bar-track"><div class="bar-fill" :style="{ width: item.percent + '%' }"></div></div>
              <div>{{ item.percent }}%</div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-title"><h2>能力雷达图</h2><span class="tag">动态维度</span></div>
          <AbilityRadarChart :items="reportAbilityItems" />
        </div>
      </div>

      <div class="card">
        <div class="card-title"><h2>教师评语</h2><span class="tag">按分数生成</span></div>
        <div class="stack">
          <p v-if="state.report.comments?.opening" class="muted">{{ state.report.comments.opening }}</p>
          <p v-if="state.report.comments?.middle" class="muted">{{ state.report.comments.middle }}</p>
          <p v-if="state.report.comments?.closing" class="muted">{{ state.report.comments.closing }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';
import { ref } from 'vue';
import { toPng } from 'html-to-image';
import AbilityRadarChart from '../components/shared/AbilityRadarChart.vue';
import questionAbilitiesUtils from '../shared/questionAbilities';
import { useExamStore } from '../store/examStore';

const router = useRouter();
const route = useRoute();
const { state, downloadReport, restartExam } = useExamStore();
const { REPORT_ABILITIES } = questionAbilitiesUtils;
const reportCaptureRef = ref(null);
const reportAbilityItems = computed(() => REPORT_ABILITIES
  .filter((label) => state.report?.abilityMap?.[label]?.total > 0)
  .map((label) => {
    const item = state.report.abilityMap[label];
    return {
      label,
      score: item.score,
      total: item.total,
      percent: item.total ? Math.round((item.score / item.total) * 100) : 0
    };
  }));

function restartAndBack() {
  restartExam();
  router.push({ name: 'intake', query: route.query });
}

async function downloadReportImage() {
  if (!reportCaptureRef.value) {
    return;
  }
  const dataUrl = await toPng(reportCaptureRef.value, { cacheBust: true, pixelRatio: 2 });
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `english-report-${Date.now()}.png`;
  link.click();
}
</script>
