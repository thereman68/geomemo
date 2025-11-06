import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

const STORAGE_KEY = 'geoMemoComments';
const NEARBY_RADIUS_METERS = 10;
const EARTH_RADIUS_METERS = 6371e3;

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function computeDistanceMeters(a, b) {
  const φ1 = toRadians(a.lat);
  const φ2 = toRadians(b.lat);
  const Δφ = toRadians(b.lat - a.lat);
  const Δλ = toRadians(b.lng - a.lng);

  const sinHalfΔφ = Math.sin(Δφ / 2);
  const sinHalfΔλ = Math.sin(Δλ / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(
        sinHalfΔφ * sinHalfΔφ + Math.cos(φ1) * Math.cos(φ2) * sinHalfΔλ * sinHalfΔλ
      ),
      Math.sqrt(
        1 -
          (sinHalfΔφ * sinHalfΔφ +
            Math.cos(φ1) * Math.cos(φ2) * sinHalfΔλ * sinHalfΔλ)
      )
    );

  return Math.round(EARTH_RADIUS_METERS * c);
}

function formatDistance(distance) {
  if (distance < 1000) {
    return `${distance} m`;
  }
  return `${(distance / 1000).toFixed(2)} km`;
}

function formatRelativeTime(isoString) {
  const then = new Date(isoString);
  const now = new Date();
  const diffSeconds = Math.round((now - then) / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return then.toLocaleString();
}

export const useCommentStore = defineStore('commentStore', () => {
  const comments = ref([]);

  const history = computed(() =>
    comments.value.map((comment) => ({
      ...comment,
      relativeTime: formatRelativeTime(comment.timestamp),
    }))
  );

  function nearby(referenceLocation) {
    if (!referenceLocation) return [];
    return comments.value
      .map((comment) => {
        const distance = computeDistanceMeters(referenceLocation, comment.location);
        return {
          ...comment,
          distance,
          distanceLabel: formatDistance(distance),
          relativeTime: formatRelativeTime(comment.timestamp),
        };
      })
      .filter((comment) => comment.distance <= NEARBY_RADIUS_METERS);
  }

  function addComment({ text, location }) {
    const timestamp = new Date().toISOString();
    comments.value.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      timestamp,
      location,
    });
    persist();
  }

  function restore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      comments.value = raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.error('Unable to parse stored comments', error);
      comments.value = [];
    }
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments.value));
  }

  return {
    comments,
    history,
    nearby,
    addComment,
    restore,
  };
});
