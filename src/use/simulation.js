import { computed, ref } from 'vue';
import L from 'leaflet';

const DEFAULT_SIM_LOCATION = { lat: 51.505, lng: -0.09 };

export function useSimulation({ setStatus, t, currentLocation }) {
  const isSimulation = ref(false);
  const simulationLocation = ref(null);
  const mapContainer = ref(null);
  const map = ref(null);
  const simulationMarker = ref(null);

  const activeLocation = computed(() =>
    isSimulation.value ? simulationLocation.value : currentLocation.value
  );

  const hasLocation = computed(() => !!activeLocation.value);

  const simulationCoordsDisplay = computed(() => {
    if (!simulationLocation.value) return '--';
    const { lat, lng } = simulationLocation.value;
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  });

  function ensureMap() {
    if (map.value || !mapContainer.value) return;

    map.value = L.map(mapContainer.value).setView(
      simulationLocation.value ?? currentLocation.value ?? DEFAULT_SIM_LOCATION,
      16
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map.value);

    map.value.on('click', (event) => {
      updateSimulationLocation(event.latlng);
    });
  }

  function updateSimulationLocation({ lat, lng }) {
    simulationLocation.value = { lat, lng };

    if (map.value) {
      if (!simulationMarker.value) {
        simulationMarker.value = L.marker([lat, lng]).addTo(map.value);
      } else {
        simulationMarker.value.setLatLng([lat, lng]);
      }
      map.value.setView([lat, lng], map.value.getZoom());
    }

    setStatus('success', `${t('simulationCoordsLabel')} ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
  }

  function initSimulation() {
    ensureMap();
    if (!simulationLocation.value) {
      updateSimulationLocation(currentLocation.value ?? DEFAULT_SIM_LOCATION);
    } else {
      updateSimulationLocation(simulationLocation.value);
    }
  }

  function teardownSimulation() {
    simulationLocation.value = null;
    if (simulationMarker.value) {
      simulationMarker.value.remove();
      simulationMarker.value = null;
    }
    if (map.value) {
      map.value.off();
    }
  }

  return {
    isSimulation,
    mapContainer,
    simulationCoordsDisplay,
    hasLocation,
    activeLocation,
    initSimulation,
    teardownSimulation,
    updateSimulationLocation,
  };
}
