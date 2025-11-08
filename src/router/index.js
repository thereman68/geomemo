import { createRouter, createWebHashHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const routes = [
  {
    path: '/',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/tags/:tag',
    name: 'tag',
    component: () => import('../views/TagView.vue'),
    meta: { requiresAuth: true },
    props: true,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'login' },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  if (!authStore.initialized) {
    await authStore.init();
  }

  if (to.meta.requiresAuth && !authStore.user) {
    return { name: 'login' };
  }

  if (to.name === 'login' && authStore.user) {
    return { name: 'home' };
  }

  return true;
});

export default router;
