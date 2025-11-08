<template>
  <main class="container py-5 py-lg-6" data-i18n-scope>
    <div class="row g-4">
      <div class="col-lg-8 d-flex flex-column gap-4">
        <section class="card card-glass border-0 feed-card p-4">
          <div class="d-flex flex-column flex-md-row align-items-md-center gap-4">
            <div class="flex-grow-1">
              <p class="text-soft mb-1">{{ t('authSignedInAs') }}</p>
              <h1 class="h3 fw-bold mb-2">{{ authStore.user?.email }}</h1>
              <p class="mb-0 text-soft">{{ t('tagline') }}</p>
            </div>
            <a class="btn btn-primary btn-lg px-4" href="#share">
              {{ t('createCommentTitle') }}
            </a>
          </div>
        </section>

        <section class="card card-glass border-0 feed-card">
          <div class="card-body">
            <div
              class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3"
            >
              <div class="d-flex align-items-center gap-2">
                <h2 class="h4 mb-0 feed-section-title">{{ t('nearbyTitle') }}</h2>
                <span v-if="hasLocation" class="badge bg-success-subtle text-success-emphasis">{{ t('nearbyTitle') }}</span>
              </div>
              <div
                class="d-flex flex-wrap align-items-center justify-content-md-end gap-2"
              >
                <div class="d-flex align-items-center gap-1">
                  <label class="visually-hidden" for="nearby-radius">{{ t('nearbyRadiusLabel') }}</label>
                  <select
                    id="nearby-radius"
                    class="form-select form-select-sm"
                    v-model.number="nearbyRadius"
                    :disabled="!hasLocation"
                  >
                    <option v-for="option in nearbyRadiusOptions" :key="option" :value="option">
                      {{ option }} m
                    </option>
                  </select>
                </div>
                <div class="btn-group" role="group" :aria-label="t('nearbySortLabel')">
                  <button
                    class="btn btn-sm"
                    :class="nearbySort === 'recent' ? 'btn-primary' : 'btn-outline-primary'"
                    type="button"
                    @click="nearbySort = 'recent'"
                    :disabled="!hasLocation"
                  >
                    {{ t('nearbySortRecent') }}
                  </button>
                  <button
                    class="btn btn-sm"
                    :class="nearbySort === 'nearest' ? 'btn-primary' : 'btn-outline-primary'"
                    type="button"
                    @click="nearbySort = 'nearest'"
                    :disabled="!hasLocation"
                  >
                    {{ t('nearbySortNearest') }}
                  </button>
                </div>
              </div>
            </div>
            <ul v-if="hasLocation && sortedNearbyComments.length" class="list-unstyled mb-0">
              <li
                v-for="comment in sortedNearbyComments"
                :key="`nearby-${comment.id}`"
                class="border border-primary-subtle bg-primary-subtle text-primary-emphasis rounded-3 p-3 mb-3 shadow-sm position-relative overflow-hidden"
              >
                <div class="d-flex align-items-start gap-3">
                  <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style="width: 2.5rem; height: 2.5rem;">
                    <span aria-hidden="true">📍</span>
                    <span class="visually-hidden">{{ t('nearbyTitle') }}</span>
                  </div>
                  <div class="flex-grow-1">
                    <p class="mb-2 fw-semibold" v-html="highlightHashtags(comment.text)"></p>
                    <div class="d-flex flex-column flex-md-row gap-2 justify-content-between text-primary-emphasis small">
                      <time :datetime="comment.timestamp">{{ comment.relativeTime }}</time>
                      <span v-if="comment.distanceLabel" class="badge bg-primary text-white align-self-start">{{ comment.distanceLabel }}</span>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
            <p v-else class="text-center text-soft mb-0">
              {{ hasLocation ? t('noNearby') : t('missingLocation') }}
            </p>
          </div>
        </section>

        <section id="share" class="card card-glass border-0 feed-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h2 class="h4 mb-0 feed-section-title">{{ t('createCommentTitle') }}</h2>
              <span class="badge bg-primary-subtle text-primary-emphasis">{{ charCount }} / {{ MAX_COMMENT_LENGTH }}</span>
            </div>
            <form novalidate @submit.prevent="handleSubmit">
              <label class="visually-hidden" for="comment-text">{{ t('commentLabel') }}</label>
              <textarea
                id="comment-text"
                class="form-control form-control-lg"
                rows="4"
                :maxlength="MAX_COMMENT_LENGTH"
                :placeholder="t('commentPlaceholder')"
                v-model="formText"
                required
              ></textarea>
              <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mt-3">
                <span class="text-soft small">
                  <span>{{ t('characterCountLabel') }}</span>
                  <output class="ms-1 fw-semibold" aria-live="polite">{{ charCount }} / {{ MAX_COMMENT_LENGTH }}</output>
                </span>
                <button class="btn btn-primary btn-lg px-4" type="submit" :disabled="commentDisabled">
                  {{ commentButtonLabel }}
                </button>
              </div>
              <div v-if="commentError" class="alert alert-danger mt-3 mb-0" role="alert">
                {{ commentError }}
              </div>
            </form>
          </div>
        </section>

        <section class="card card-glass border-0 feed-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h2 class="h4 mb-0 feed-section-title">{{ t('historyTitle') }}</h2>
              <div class="d-flex align-items-center gap-2">
                <span v-if="sortedHistoryComments.length" class="badge bg-primary-subtle text-primary-emphasis">{{ sortedHistoryComments.length }}</span>
                <div class="btn-group" role="group" :aria-label="t('historySortLabel')">
                  <button
                    class="btn btn-sm"
                    :class="historySort === 'recent' ? 'btn-primary' : 'btn-outline-primary'"
                    type="button"
                    @click="historySort = 'recent'"
                  >
                    {{ t('historySortRecent') }}
                  </button>
                  <button
                    class="btn btn-sm"
                    :class="historySort === 'nearest' ? 'btn-primary' : 'btn-outline-primary'"
                    type="button"
                    @click="historySort = 'nearest'"
                  >
                    {{ t('historySortNearest') }}
                  </button>
                </div>
              </div>
            </div>
            <ul v-if="sortedHistoryComments.length" class="list-unstyled mb-0">
              <li
                v-for="comment in sortedHistoryComments"
                :key="`history-${comment.id}`"
                class="border border-light-subtle rounded-3 p-3 mb-3 bg-white"
              >
                <p class="mb-2 fw-semibold">{{ comment.text }}</p>
                <div class="text-soft small">
                  <time :datetime="comment.timestamp">{{ comment.relativeTime }}</time>
                  <span v-if="comment.distanceLabel" class="ms-2">· {{ comment.distanceLabel }}</span>
                </div>
              </li>
            </ul>
            <p v-else class="text-center text-soft mb-0">{{ t('noComments') }}</p>
          </div>
        </section>
      </div>

      <aside class="col-lg-4 d-flex flex-column gap-4">
        <section class="card card-glass border-0 p-4 feed-card">
          <h2 class="h5 feed-section-title mb-3">Trending near you</h2>
          <ul class="list-unstyled mb-0 d-flex flex-wrap gap-2">
            <li v-for="tag in trendingTopics" :key="tag">
              <span class="badge bg-light text-primary-emphasis px-3 py-2 rounded-pill border border-primary-subtle">{{ tag }}</span>
            </li>
          </ul>
        </section>

        <section class="card card-glass border-0 p-4 feed-card">
          <div class="d-flex flex-column gap-2">
            <div class="d-flex align-items-center justify-content-between">
              <h2 class="h5 feed-section-title mb-0">{{ t('simulationToggle') }}</h2>
              <div class="form-check form-switch m-0">
                <input class="form-check-input" type="checkbox" id="simulation-mode" v-model="isSimulation" />
                <label class="form-check-label visually-hidden" for="simulation-mode">{{ t('simulationToggle') }}</label>
              </div>
            </div>
            <p class="text-soft small mb-0">{{ t('simulationHint') }}</p>
          </div>
          <div
            id="location-status"
            class="alert mt-3"
            :class="{
              'alert-danger': statusClass['status--error'],
              'alert-success': statusClass['status--success'],
              'alert-primary': !statusClass['status--error'] && !statusClass['status--success'],
            }"
            role="status"
          >
            {{ statusMessage }}
          </div>
          <div v-show="isSimulation" id="simulation-panel" class="mt-3">
            <div
              id="map"
              ref="mapContainer"
              class="w-100 rounded-3 overflow-hidden shadow-sm"
              style="height: clamp(220px, 45vw, 320px);"
              role="application"
              aria-label="Test map"
            ></div>
            <p class="mt-3 mb-0 text-soft">
              <span>{{ t('simulationCoordsLabel') }}</span>
              <span id="simulation-coords" class="ms-2 fw-semibold">{{ simulationCoordsDisplay }}</span>
            </p>
          </div>
        </section>
      </aside>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useCommentStore } from '../stores/commentStore';
import { useAuthStore } from '../stores/authStore';
import { useLocale } from '../use/locale';
import { useGeolocation } from '../use/geolocation';
import { useSimulation } from '../use/simulation';

const MAX_COMMENT_LENGTH = 1000;

const router = useRouter();
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
const commentError = ref('');
const submitting = ref(false);
const nearbyRadius = ref(10);
const nearbyRadiusOptions = [10, 50, 200];
const nearbySort = ref('recent');

const charCount = computed(() => formText.value.length);

const statusClass = computed(() => ({
  'status--error': statusType.value === 'error',
  'status--success': statusType.value === 'success',
}));

const historySort = ref('recent');
const historyCommentsWithDistance = computed(() =>
  commentStore.historyWithDistance(activeLocation.value)
);
const sortedHistoryComments = computed(() => {
  if (historySort.value === 'nearest' && activeLocation.value) {
    return [...historyCommentsWithDistance.value]
      .filter((comment) => comment.distance != null)
      .sort((a, b) => a.distance - b.distance);
  }
  return historyCommentsWithDistance.value;
});
const nearbyComments = computed(() =>
  commentStore.nearby(activeLocation.value, nearbyRadius.value)
);
const sortedNearbyComments = computed(() => {
  const comments = nearbyComments.value;
  if (!comments.length) {
    return comments;
  }

  const sorted = [...comments];
  if (nearbySort.value === 'nearest') {
    sorted.sort((a, b) => a.distance - b.distance);
    return sorted;
  }

  sorted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return sorted;
});
const trendingTopics = computed(() => commentStore.trending);
const highlightHashtags = (text = '') =>
  text.replace(/(#[a-z0-9_]+)/gi, '<span class="hashtag">$1</span>');
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

watch(
  () => authStore.user,
  (user) => {
    if (!user) {
      router.replace({ name: 'login' });
    }
  },
  { immediate: true }
);

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
