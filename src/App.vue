<template>
  <div>
    <template v-if="showTeacherShell">
      <div class="admin-shell">
        <aside class="admin-sidebar">
          <div class="admin-brand">
            <div class="admin-brand-mark">E</div>
            <div>
              <div class="admin-brand-name">英语测评后台</div>
              <div class="admin-brand-note">老师端管理中心</div>
            </div>
          </div>

          <a-menu
            mode="inline"
            theme="dark"
            class="admin-nav-menu"
            :selected-keys="selectedMenuKeys"
          >
            <a-menu-item
              v-for="item in navItems"
              :key="item.key"
              @click="navigate(item.to)"
            >
              <component :is="item.icon" />
              <span>{{ item.label }}</span>
            </a-menu-item>
          </a-menu>
        </aside>

        <div class="admin-main-layout">
          <header class="admin-topbar">
            <div>
              <h1 class="admin-topbar-title">{{ pageMeta.title }}</h1>
            </div>

            <a-space class="admin-session" :size="10">
              <div class="admin-user-chip">
                <a-avatar class="admin-user-avatar">{{ userInitial }}</a-avatar>
                <div>
                  <div class="admin-user-name">{{ state.authUser?.username || '-' }}</div>
                  <div class="admin-user-role">{{ state.authUser?.role === 'ADMIN' ? '管理员' : '员工' }}</div>
                </div>
              </div>
              <a-button class="admin-logout" @click="handleLogout">退出登录</a-button>
            </a-space>
          </header>

          <main class="admin-content">
            <router-view />
          </main>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="floating floating-star"></div>
      <div class="floating floating-cloud"></div>
      <div class="floating floating-balloon"></div>
      <div id="page-root" class="public-root">
        <router-view />
      </div>
    </template>
  </div>
</template>

<script setup>
import { FileTextOutlined, TeamOutlined } from '@ant-design/icons-vue';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useExamStore } from './store/examStore';
import adminLayoutUtils from './shared/adminLayout';

const { buildTeacherNavItems, getTeacherPageMeta, isTeacherRoute } = adminLayoutUtils;

const route = useRoute();
const router = useRouter();
const { state, logout } = useExamStore();

const showTeacherShell = computed(() => isTeacherRoute(route));
const pageMeta = computed(() => getTeacherPageMeta(String(route.name || '')));
const navItems = computed(() => buildTeacherNavItems({
  routeName: String(route.name || ''),
  routeFullPath: route.fullPath,
  paperId: typeof route.query.paperId === 'string' ? route.query.paperId : '',
  isAdmin: state.authUser?.role === 'ADMIN'
}).map((item) => ({
  ...item,
  icon: item.key === 'users' ? TeamOutlined : FileTextOutlined
})));
const selectedMenuKeys = computed(() => navItems.value.filter((item) => item.active).map((item) => item.key));
const userInitial = computed(() => {
  const username = state.authUser?.username || 'T';
  return username.slice(0, 1).toUpperCase();
});

function navigate(target) {
  router.push(target);
}

async function handleLogout() {
  await logout();
  router.push({ name: 'login' });
}
</script>
