import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from './authStore';

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
  const authStore = useAuthStore();
  const comments = ref([]);
  const loading = ref(false);
  const error = ref(null);

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

  function mapRecordToComment(record) {
    return {
      id: record.id,
      text: record.text,
      timestamp: record.created_at,
      userId: record.user_id,
      location: {
        lat: record.location_lat,
        lng: record.location_lng,
      },
    };
  }

  async function refresh() {
    if (!authStore.user) {
      comments.value = [];
      error.value = null;
      return;
    }

    loading.value = true;
    error.value = null;

    const { data, error: fetchError } = await supabase
      .from('comments')
      .select('id, text, created_at, user_id, location_lat, location_lng')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Unable to load comments', fetchError);
      error.value = fetchError.message;
      comments.value = [];
    } else {
      comments.value = (data ?? []).map(mapRecordToComment);
    }

    loading.value = false;
  }

  async function addComment({ text, location }) {
    if (!authStore.user) {
      const notAuthenticated = new Error('User must be signed in to add comments');
      error.value = notAuthenticated.message;
      throw notAuthenticated;
    }

    const { data, error: insertError } = await supabase
      .from('comments')
      .insert({
        text,
        user_id: authStore.user.id,
        location_lat: location.lat,
        location_lng: location.lng,
      })
      .select('id, text, created_at, user_id, location_lat, location_lng')
      .single();

    if (insertError) {
      console.error('Unable to save comment', insertError);
      error.value = insertError.message;
      throw insertError;
    }

    comments.value = [mapRecordToComment(data), ...comments.value];
  }

  watch(
    () => authStore.user,
    () => {
      refresh();
    },
    { immediate: true }
  );

  return {
    comments,
    history,
    nearby,
    addComment,
    refresh,
    loading,
    error,
  };
});
