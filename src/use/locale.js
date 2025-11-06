import { computed, ref } from 'vue';
import en from '../locales/en.json';

const locales = {
  en,
};

export function useLocale() {
  const current = ref('en');

  const messages = computed(() => locales[current.value] ?? en);

  function t(key) {
    return messages.value[key] ?? key;
  }

  return {
    locale: current,
    messages,
    t,
  };
}
