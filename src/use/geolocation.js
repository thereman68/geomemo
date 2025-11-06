import { ref } from 'vue';

const GEO_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 1_000,
};

export function useGeolocation({ t }) {
  const statusMessage = ref(t('locating'));
  const statusType = ref('info');
  const currentLocation = ref(null);
  const watcherId = ref(null);

  function setStatus(type, message) {
    statusType.value = type;
    statusMessage.value = message;
  }

  function ensureGeolocation() {
    if (watcherId.value != null) {
      return;
    }

    if (!navigator.geolocation) {
      setStatus('error', t('geoError'));
      return;
    }

    watcherId.value = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        currentLocation.value = { lat: latitude, lng: longitude };
        setStatus('success', `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      },
      (error) => {
        console.error('Geolocation error', error);
        if (error.code === error.PERMISSION_DENIED) {
          setStatus('error', t('geoDenied'));
        } else {
          setStatus('error', t('geoError'));
        }
      },
      GEO_OPTIONS
    );
  }

  function stopGeolocation() {
    if (watcherId.value == null) {
      return;
    }
    navigator.geolocation.clearWatch(watcherId.value);
    watcherId.value = null;
  }

  return {
    statusMessage,
    statusType,
    currentLocation,
    ensureGeolocation,
    stopGeolocation,
    setStatus,
  };
}
