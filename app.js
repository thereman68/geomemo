import { createApp, ref, reactive, computed, onMounted, watch } from "https://unpkg.com/vue@3/dist/vue.esm-browser.js";

const STORAGE_KEY = "geoMemoComments";
const NEARBY_RADIUS_METERS = 10;
const DEFAULT_SIM_LOCATION = { lat: 51.505, lng: -0.09 };
const MAX_COMMENT_LENGTH = 1000;

function parseLocale() {
  const script = document.getElementById("locale-en");
  if (!script) return {};
  try {
    return JSON.parse(script.textContent.trim());
  } catch (error) {
    console.error("Failed to parse locale", error);
    return {};
  }
}

function computeDistanceMeters(a, b) {
  const R = 6371e3;
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;

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

  return Math.round(R * c);
}

function formatDistance(distance) {
  if (distance < 1000) return `${distance} m`;
  return `${(distance / 1000).toFixed(2)} km`;
}

function formatRelativeTime(isoString) {
  const then = new Date(isoString);
  const now = new Date();
  const diffSeconds = Math.round((now - then) / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  if (diffSeconds < 60) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return then.toLocaleString();
}

createApp({
  setup() {
    const i18n = reactive(parseLocale());
    const formText = ref("");
    const comments = ref([]);
    const statusMessage = ref(i18n.locating ?? "Attempting to locate you...");
    const statusType = ref("info");
    const isSimulation = ref(false);
    const currentLocation = ref(null);
    const simulationLocation = ref(null);
    const watcherId = ref(null);
    const map = ref(null);
    const simulationMarker = ref(null);
    const mapContainer = ref(null);

    const hasLocation = computed(() => !!activeLocation.value);
    const activeLocation = computed(() =>
      isSimulation.value ? simulationLocation.value : currentLocation.value
    );

    const charCount = computed(() => formText.value.length);

    const historyComments = computed(() =>
      comments.value.map((comment) => ({
        ...comment,
        relativeTime: formatRelativeTime(comment.timestamp),
      }))
    );

    const nearbyComments = computed(() => {
      if (!activeLocation.value) return [];
      return comments.value
        .map((comment) => {
          const distance = computeDistanceMeters(activeLocation.value, comment.location);
          return {
            ...comment,
            distance,
            distanceLabel: formatDistance(distance),
            relativeTime: formatRelativeTime(comment.timestamp),
          };
        })
        .filter((comment) => comment.distance <= NEARBY_RADIUS_METERS);
    });

    const simulationCoordsDisplay = computed(() => {
      if (!simulationLocation.value) return "--";
      const { lat, lng } = simulationLocation.value;
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    });

    const statusClass = computed(() => ({
      "status--error": statusType.value === "error",
      "status--success": statusType.value === "success",
    }));

    function t(key) {
      return i18n[key] ?? key;
    }

    function setStatus(type, message) {
      statusType.value = type;
      statusMessage.value = message;
    }

    function loadComments() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        comments.value = raw ? JSON.parse(raw) : [];
      } catch (error) {
        console.error("Unable to parse stored comments", error);
        comments.value = [];
      }
    }

    function saveComments() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comments.value));
    }

    function updateLocationStatus() {
      if (activeLocation.value) {
        const { lat, lng } = activeLocation.value;
        const message = isSimulation.value
          ? `${t("simulationCoordsLabel")} ${lat.toFixed(5)}, ${lng.toFixed(5)}`
          : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setStatus("success", message);
      } else {
        setStatus("info", t("locating"));
      }
    }

    function ensureMap() {
      if (map.value || !mapContainer.value) return;
      map.value = L.map(mapContainer.value).setView(
        simulationLocation.value ?? currentLocation.value ?? DEFAULT_SIM_LOCATION,
        16
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map.value);

      map.value.on("click", (event) => {
        updateSimulationLocation(event.latlng);
      });
    }

    function updateSimulationLocation({ lat, lng }) {
      simulationLocation.value = { lat, lng };

      if (!map.value) return;
      if (!simulationMarker.value) {
        simulationMarker.value = L.marker([lat, lng]).addTo(map.value);
      } else {
        simulationMarker.value.setLatLng([lat, lng]);
      }

      map.value.setView([lat, lng], map.value.getZoom());
      updateLocationStatus();
    }

    function startGeolocation() {
      if (!navigator.geolocation) {
        setStatus("error", t("geoError"));
        return;
      }

      watcherId.value = navigator.geolocation.watchPosition(
        (position) => {
          if (isSimulation.value) return;
          const { latitude, longitude } = position.coords;
          currentLocation.value = { lat: latitude, lng: longitude };
          updateLocationStatus();
        },
        (error) => {
          console.error("Geolocation error", error);
          if (error.code === error.PERMISSION_DENIED) {
            setStatus("error", t("geoDenied"));
          } else {
            setStatus("error", t("geoError"));
          }
        },
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 1_000 }
      );
    }

    function stopGeolocation() {
      if (watcherId.value != null) {
        navigator.geolocation.clearWatch(watcherId.value);
        watcherId.value = null;
      }
    }

    function resetSimulation() {
      simulationLocation.value = null;
      if (simulationMarker.value) {
        simulationMarker.value.remove();
        simulationMarker.value = null;
      }
    }

    function handleSubmit() {
      const text = formText.value.trim();
      if (!text) {
        setStatus("error", t("invalidComment"));
        return;
      }

      if (text.length > MAX_COMMENT_LENGTH) {
        setStatus("error", t("commentTooLong"));
        return;
      }

      if (!activeLocation.value) {
        setStatus("error", t("missingLocation"));
        return;
      }

      const timestamp = new Date().toISOString();
      comments.value.unshift({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text,
        timestamp,
        location: activeLocation.value,
      });

      saveComments();
      formText.value = "";
      setStatus("success", t("commentSaved"));
    }

    watch(
      isSimulation,
      (enabled) => {
        if (enabled) {
          stopGeolocation();
          ensureMap();
          if (!simulationLocation.value) {
            simulationLocation.value = currentLocation.value ?? DEFAULT_SIM_LOCATION;
            if (map.value) {
              map.value.setView(
                [simulationLocation.value.lat, simulationLocation.value.lng],
                map.value.getZoom()
              );
              updateSimulationLocation(simulationLocation.value);
            }
          } else {
            updateLocationStatus();
          }
        } else {
          resetSimulation();
          startGeolocation();
          updateLocationStatus();
        }
      },
      { immediate: false }
    );

    watch(activeLocation, () => {
      updateLocationStatus();
    });

    onMounted(() => {
      loadComments();
      startGeolocation();

      window.addEventListener("beforeunload", () => {
        if (isSimulation.value) {
          isSimulation.value = false;
        }
      });
    });

    return {
      MAX_COMMENT_LENGTH,
      t,
      statusMessage,
      statusClass,
      formText,
      charCount,
      handleSubmit,
      isSimulation,
      mapContainer,
      simulationCoordsDisplay,
      nearbyComments,
      historyComments,
      hasLocation,
    };
  },
}).mount("#app");
