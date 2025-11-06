<template>
  <main class="app" data-i18n-scope>
    <header class="app__header">
      <h1 class="app__title">{{ t('appTitle') }}</h1>
      <p class="app__tagline">{{ t('tagline') }}</p>
    </header>

    <section
      id="location-status"
      class="status"
      :class="statusClass"
      role="status"
    >
      {{ statusMessage }}
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
          <button class="button" type="submit">
            {{ t('submitButton') }}
          </button>
        </div>
      </form>
    </section>

    <section class="panel panel--simulation">
      <div class="toggle">
        <input type="checkbox" id="simulation-mode" v-model="isSimulation" />
        <label for="simulation-mode">{{ t('simulationToggle') }}</label>
      </div>
      <p class="hint">{{ t('simulationHint') }}</p>
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
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useCommentStore } from '../stores/commentStore';
import { useLocale } from '../use/locale';
import { useGeolocation } from '../use/geolocation';
import { useSimulation } from '../use/simulation';

const MAX_COMMENT_LENGTH = 1000;

const commentStore = useCommentStore();
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
const charCount = computed(() => formText.value.length);

const statusClass = computed(() => ({
  'status--error': statusType.value === 'error',
  'status--success': statusType.value === 'success',
}));

const historyComments = computed(() => commentStore.history);
const nearbyComments = computed(() => commentStore.nearby(activeLocation.value));

function handleSubmit() {
  const text = formText.value.trim();
  if (!text) {
    setStatus('error', t('invalidComment'));
    return;
  }

  if (text.length > MAX_COMMENT_LENGTH) {
    setStatus('error', t('commentTooLong'));
    return;
  }

  if (!activeLocation.value) {
    setStatus('error', t('missingLocation'));
    return;
  }

  commentStore.addComment({ text, location: activeLocation.value });
  formText.value = '';
  setStatus('success', t('commentSaved'));
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
  commentStore.restore();
  ensureGeolocation();
});
</script>
