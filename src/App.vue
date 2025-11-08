<template>
  <div class="min-vh-100 d-flex flex-column">
    <nav class="navbar navbar-expand-lg navbar-glass sticky-top" data-i18n-scope>
      <div class="container py-2">
        <RouterLink class="navbar-brand fw-semibold" :to="{ name: authStore.user ? 'home' : 'login' }">
          {{ t('appTitle') }}
        </RouterLink>
        <div class="d-flex align-items-center gap-3">
          <span v-if="authStore.user" class="text-muted small d-none d-md-inline">
            {{ authStore.user.email }}
          </span>
          <button
            v-if="authStore.user"
            class="btn btn-outline-danger btn-sm"
            type="button"
            :disabled="authSigningOut"
            @click="handleSignOut"
          >
            {{ t('authSignOutButton') }}
          </button>
        </div>
      </div>
    </nav>

    <div class="flex-grow-1">
      <RouterView />
    </div>

    <div v-if="navError" class="alert alert-danger rounded-0 mb-0" role="alert">
      {{ navError }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/authStore';
import { useLocale } from './use/locale';

const router = useRouter();
const authStore = useAuthStore();
const { t } = useLocale();

const navError = ref('');
const authSigningOut = computed(() => authStore.status === 'signing-out');

function handleSignOut() {
  navError.value = '';
  authStore
    .signOut()
    .then((success) => {
      if (!success) {
        navError.value = authStore.error ?? t('authUnknownError');
        return;
      }
      router.replace({ name: 'login' });
    })
    .catch((error) => {
      console.error(error);
      navError.value = error.message ?? t('authUnknownError');
    });
}
</script>

<style scoped>
</style>
