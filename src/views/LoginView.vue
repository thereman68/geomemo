<template>
  <main class="container py-5 py-lg-6" data-i18n-scope>
    <div class="row align-items-center g-5">
      <div class="col-lg-6 d-none d-lg-flex">
        <div class="w-100 card card-glass border-0 p-4 feed-card">
          <h1 class="display-5 fw-bold mb-3">{{ t('appTitle') }}</h1>
          <p class="text-soft fs-5 mb-4">{{ t('tagline') }}</p>
          <ul class="list-unstyled d-flex flex-column gap-3 mb-0">
            <li class="d-flex align-items-start gap-3">
              <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style="width: 2.75rem; height: 2.75rem;">
                <span aria-hidden="true">✨</span>
                <span class="visually-hidden">Feature</span>
              </div>
              <div>
                <h2 class="h5 mb-1">Discover stories around you</h2>
                <p class="mb-0 text-soft">{{ t('nearbyTitle') }}</p>
              </div>
            </li>
            <li class="d-flex align-items-start gap-3">
              <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style="width: 2.75rem; height: 2.75rem;">
                <span aria-hidden="true">🔥</span>
                <span class="visually-hidden">Feature</span>
              </div>
              <div>
                <h2 class="h5 mb-1">Trending insights</h2>
                <p class="mb-0 text-soft">Join conversations with the community</p>
              </div>
            </li>
            <li class="d-flex align-items-start gap-3">
              <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style="width: 2.75rem; height: 2.75rem;">
                <span aria-hidden="true">🔒</span>
                <span class="visually-hidden">Feature</span>
              </div>
              <div>
                <h2 class="h5 mb-1">Secure & private</h2>
                <p class="mb-0 text-soft">Powered by trusted authentication</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div class="col-12 col-lg-6">
        <div class="card card-glass border-0 feed-card p-4 p-lg-5 shadow-sm">
          <div class="mb-4 text-center text-lg-start">
            <h2 class="h3 fw-bold mb-2">{{ t('authTitle') }}</h2>
            <p class="text-soft mb-0">{{ t('authDescription') ?? 'Sign in to continue' }}</p>
          </div>
          <form novalidate @submit.prevent="handleSignIn" class="d-flex flex-column gap-3">
            <div>
              <label class="form-label text-soft" for="auth-email">{{ t('authEmailLabel') }}</label>
              <input
                id="auth-email"
                v-model="authEmail"
                class="form-control form-control-lg"
                type="email"
                autocomplete="email"
                required
                :placeholder="t('authEmailPlaceholder')"
              />
            </div>

            <div>
              <label class="form-label text-soft" for="auth-password">{{ t('authPasswordLabel') }}</label>
              <input
                id="auth-password"
                v-model="authPassword"
                class="form-control form-control-lg"
                type="password"
                autocomplete="current-password"
                required
                :placeholder="t('authPasswordPlaceholder')"
              />
            </div>

            <div class="d-grid gap-2">
              <button class="btn btn-primary btn-lg" type="submit" :disabled="authDisabled">
                {{ t('authSignInButton') }}
              </button>
              <button
                class="btn btn-outline-primary btn-lg"
                type="button"
                :disabled="authDisabled"
                @click="handleSignUp"
              >
                {{ t('authSignUpButton') }}
              </button>
            </div>

            <p class="text-center text-soft small mb-0">
              {{ t('authDisclaimer') ?? 'By continuing, you agree to our community guidelines.' }}
            </p>

            <div v-if="authError" class="alert alert-danger mt-2 mb-0" role="alert">
              {{ authError }}
            </div>
          </form>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { useLocale } from '../use/locale';

const router = useRouter();
const authStore = useAuthStore();
const { t } = useLocale();

const authEmail = ref('');
const authPassword = ref('');
const authError = ref('');

const authDisabled = computed(() => authStore.status !== 'idle');

function redirectToHome() {
  router.replace({ name: 'home' });
}

function handleSignIn() {
  authError.value = '';
  authStore
    .signIn({ email: authEmail.value.trim(), password: authPassword.value })
    .then((success) => {
      if (success) {
        redirectToHome();
      } else {
        authError.value = authStore.error;
      }
    })
    .catch((error) => {
      console.error(error);
      authError.value = error.message ?? t('authUnknownError');
    });
}

function handleSignUp() {
  authError.value = '';
  authStore
    .signUp({ email: authEmail.value.trim(), password: authPassword.value })
    .then((success) => {
      if (success) {
        redirectToHome();
      } else {
        authError.value = authStore.error;
      }
    })
    .catch((error) => {
      console.error(error);
      authError.value = error.message ?? t('authUnknownError');
    });
}

watch(
  () => authStore.user,
  (user) => {
    if (user) {
      redirectToHome();
    }
  },
  { immediate: true }
);

onMounted(() => {
  authStore.init();
});
</script>
