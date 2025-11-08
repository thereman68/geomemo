<template>
  <main class="container py-5 py-lg-6" data-i18n-scope>
    <section class="card card-glass border-0 feed-card">
      <div class="card-body d-flex flex-column gap-3">
        <header class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
          <div>
            <p class="text-soft mb-1">Viewing comments tagged</p>
            <h1 class="h3 fw-bold mb-0">#{{ decodedTag }}</h1>
          </div>
          <RouterLink class="btn btn-outline-primary" :to="{ name: 'home' }">
            ← Back to feed
          </RouterLink>
        </header>

        <div v-if="loading" class="text-center py-5 text-soft">
          Loading related comments...
        </div>

        <div v-else-if="!relatedComments.length" class="text-center py-5 text-soft">
          No comments use this hashtag yet.
        </div>

        <ul v-else class="list-unstyled mb-0">
          <li
            v-for="comment in relatedComments"
            :key="comment.id"
            class="border border-light-subtle rounded-3 p-3 mb-3 bg-white"
          >
            <p class="mb-2 fw-semibold" v-html="highlightHashtags(comment.text)"></p>
            <div class="text-soft small d-flex flex-column flex-md-row gap-2">
              <time :datetime="comment.timestamp">{{ comment.relativeTime }}</time>
              <span v-if="comment.distanceLabel">· {{ comment.distanceLabel }}</span>
            </div>
          </li>
        </ul>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useCommentStore } from '../stores/commentStore';

const route = useRoute();
const commentStore = useCommentStore();

const decodedTag = computed(() => decodeURIComponent(route.params.tag ?? ''));
const relatedComments = computed(() => commentStore.commentsByHashtag(decodedTag.value));
const loading = computed(() => commentStore.loading);

const encodeTagParam = (tag = '') => encodeURIComponent(tag.trim().replace(/^#/, ''));
const highlightHashtags = (text = '') =>
  text.replace(/(#[a-z0-9_]+)/gi, (match) => {
    const encoded = encodeTagParam(match);
    return `<a class="hashtag" href="#/tags/${encoded}">${match}</a>`;
  });
</script>

<style scoped>
.hashtag {
  color: var(--bs-primary);
  font-weight: 600;
}
</style>
