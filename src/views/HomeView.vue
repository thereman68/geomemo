<template>
  <main class="app" data-i18n-scope>
    <header class="app__header">
      <div class="app__header-text">
        <h1 class="app__title">{{ t('appTitle') }}</h1>
        <p class="app__tagline">{{ t('tagline') }}</p>
      </div>
      <section class="panel auth-panel app__header-auth">
        <template v-if="!authStore.user">
          <h2 class="panel__title">{{ t('authTitle') }}</h2>
          <form class="auth-form" novalidate @submit.prevent="handleSignIn">
            <div class="form-field">
              <label class="form-label" for="auth-email">{{ t('authEmailLabel') }}</label>
              <input
                id="auth-email"
                v-model="authEmail"
                class="input"
                type="email"
                autocomplete="email"
                required
                :placeholder="t('authEmailPlaceholder')"
              />
            </div>
            <div class="form-field">
              <label class="form-label" for="auth-password">{{ t('authPasswordLabel') }}</label>
              <input
                id="auth-password"
                v-model="authPassword"
                class="input"
                type="password"
                autocomplete="current-password"
                required
                :placeholder="t('authPasswordPlaceholder')"
              />
            </div>
            <div class="auth-actions">
              <button class="button" type="submit" :disabled="authDisabled">
                {{ t('authSignInButton') }}
              </button>
              <button class="button button--ghost" type="button" :disabled="authDisabled" @click="handleSignUp">
                {{ t('authSignUpButton') }}
              </button>
            </div>
            <p v-if="authError" class="auth-error">{{ authError }}</p>
          </form>
        </template>
        <template v-else>
          <div class="auth-status">
            <p class="auth-status__text">
              {{ t('authSignedInAs') }}<br />
              <strong>{{ authStore.user.email }}</strong>
            </p>
            <button class="button button--ghost" type="button" :disabled="authSigningOut" @click="handleSignOut">
              {{ t('authSignOutButton') }}
            </button>
          </div>
        </template>
      </section>
    </header>

    <section class="panel">
      <h2 class="panel__title">{{ t('nearbyTitle') }}</h2>
      <ul v-if="hasLocation && nearbyComments.length" class="comment-list">
        <li v-for="comment in nearbyComments" :key="`nearby-${comment.id}`" class="comment">
          <p class="comment__text">{{ comment.text }}</p>
          <div class="comment__meta">
            <time class="comment__time" :datetime="comment.timestamp">
              {{ comment.relativeTime }}
            </time>
            <span v-if="comment.distanceLabel" class="comment__distance">
              {{ comment.distanceLabel }}
            </span>
          </div>
        </li>
      </ul>
      <p v-else class="empty">
        {{ hasLocation ? t('noNearby') : t('missingLocation') }}
      </p>
    </section>

    <section class="panel">
      <h2 class="panel__title">{{ t('historyTitle') }}</h2>
      <ul v-if="historyComments.length" class="comment-list">
        <li v-for="comment in historyComments" :key="`history-${comment.id}`" class="comment">
          <p class="comment__text">{{ comment.text }}</p>
          <div class="comment__meta">
            <time class="comment__time" :datetime="comment.timestamp">
              {{ comment.relativeTime }}
            </time>
          </div>
        </li>
      </ul>
      <p v-else class="empty">{{ t('noComments') }}</p>
    </section>

    <section class="panel">
      <h2 class="panel__title">{{ t('createCommentTitle') }}</h2>
      <form novalidate @submit.prevent="handleSubmit">
        <label class="sr-only" for="comment-text">{{ t('commentLabel') }}</label>
        <textarea
          id="comment-text"
          class="input"
          rows="3"
          :maxlength="MAX_COMMENT_LENGTH"
          :placeholder="t('commentPlaceholder')"
          v-model="formText"
          required
        ></textarea>
        <div class="form-row form-row--meta">
          <span class="char-counter">
            <span>{{ t('characterCountLabel') }}</span>
            <output aria-live="polite">{{ charCount }} / {{ MAX_COMMENT_LENGTH }}</output>
          </span>
          <button class="button" type="submit" :disabled="commentDisabled">
            {{ commentButtonLabel }}
          </button>
        </div>
        <p v-if="commentError" class="auth-error">{{ commentError }}</p>
      </form>
    </section>

    <section class="panel panel--simulation">
      <div class="toggle">
        <input type="checkbox" id="simulation-mode" v-model="isSimulation" />
        <label for="simulation-mode">{{ t('simulationToggle') }}</label>
      </div>
      <p class="hint">{{ t('simulationHint') }}</p>
      <div
        id="location-status"
        class="status"
        :class="statusClass"
        role="status"
      >
        {{ statusMessage }}
      </div>
      <div id="simulation-panel" class="simulation" v-show="isSimulation">
        <div
          id="map"
          ref="mapContainer"
          class="map"
          role="application"
          aria-label="Test map"
        ></div>
        <p>
          <span>{{ t('simulationCoordsLabel') }}</span>
          <span id="simulation-coords" class="coords">{{ simulationCoordsDisplay }}</span>
        </p>
      </div>
    </section>

  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useCommentStore } from '../stores/commentStore';
import { useAuthStore } from '../stores/authStore';
import { useLocale } from '../use/locale';
import { useGeolocation } from '../use/geolocation';
import { useSimulation } from '../use/simulation';

const MAX_COMMENT_LENGTH = 1000;

const commentStore = useCommentStore();
const authStore = useAuthStore();
const { t } = useLocale();
const {
  statusMessage,
  statusType,
  ensureGeolocation,
  stopGeolocation,
  setStatus,
  currentLocation,
} = useGeolocation({ t });
const {
  isSimulation,
  mapContainer,
  simulationCoordsDisplay,
  hasLocation,
  initSimulation,
  teardownSimulation,
  activeLocation,
} = useSimulation({ setStatus, t, currentLocation });

const formText = ref('');
const authEmail = ref('');
const authPassword = ref('');
const commentError = ref('');
const authError = ref('');
const submitting = ref(false);

const charCount = computed(() => formText.value.length);

const statusClass = computed(() => ({
  'status--error': statusType.value === 'error',
  'status--success': statusType.value === 'success',
}));

const historyComments = computed(() => commentStore.history);
const nearbyComments = computed(() => commentStore.nearby(activeLocation.value));
const authDisabled = computed(() => authStore.status !== 'idle');
const authSigningOut = computed(() => authStore.status === 'signing-out');
const commentDisabled = computed(
  () =>
    !authStore.user ||
    commentStore.loading ||
    submitting.value ||
    !activeLocation.value ||
    !formText.value.trim() ||
    formText.value.length > MAX_COMMENT_LENGTH
);
const commentButtonLabel = computed(() => {
  if (!authStore.user) return t('submitButtonDisabled');
  if (commentStore.loading) return t('submitButtonLoading');
  if (submitting.value) return t('submitButtonSubmitting');
  return t('submitButton');
});

function handleSubmit() {
  const text = formText.value.trim();
  commentError.value = '';
  if (!authStore.user) {
    commentError.value = t('commentRequiresAuth');
    return;
  }
  if (!text) {
    commentError.value = t('invalidComment');
    return;
  }

  if (text.length > MAX_COMMENT_LENGTH) {
    commentError.value = t('commentTooLong');
    return;
  }

  if (!activeLocation.value) {
    commentError.value = t('missingLocation');
    return;
  }

  submitting.value = true;
  commentStore
    .addComment({ text, location: activeLocation.value })
    .then(() => {
      formText.value = '';
      setStatus('success', t('commentSaved'));
    })
    .catch((error) => {
      console.error(error);
      commentError.value = error.message ?? t('commentSaveError');
      setStatus('error', t('commentSaveError'));
    })
    .finally(() => {
      submitting.value = false;
    });
}

function handleSignIn() {
  authError.value = '';
  authStore
    .signIn({ email: authEmail.value.trim(), password: authPassword.value })
    .then((success) => {
      if (!success) {
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
      if (!success) {
        authError.value = authStore.error;
      }
    })
    .catch((error) => {
      console.error(error);
      authError.value = error.message ?? t('authUnknownError');
    });
}

function handleSignOut() {
  authError.value = '';
  authStore.signOut().catch((error) => {
    console.error(error);
    authError.value = error.message ?? t('authUnknownError');
  });
}

watch(isSimulation, (enabled) => {
  if (enabled) {
    stopGeolocation();
    initSimulation();
  } else {
    teardownSimulation();
    ensureGeolocation();
    setStatus('info', t('locating'));
  }
});

onMounted(() => {
  authStore.init();
  ensureGeolocation();
});
</script>
