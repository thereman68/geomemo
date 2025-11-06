import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '../lib/supabaseClient';

export const useAuthStore = defineStore('authStore', () => {
  const user = ref(null);
  const status = ref('idle');
  const error = ref(null);
  const initialized = ref(false);

  async function init() {
    if (initialized.value) return;
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) {
      error.value = sessionError.message;
    } else {
      user.value = session?.user ?? null;
    }
    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null;
    });
    initialized.value = true;
  }

  async function signIn({ email, password }) {
    status.value = 'signing-in';
    error.value = null;
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      error.value = signInError.message;
    } else {
      user.value = data.user ?? null;
    }
    status.value = 'idle';
    return !signInError;
  }

  async function signUp({ email, password }) {
    status.value = 'signing-up';
    error.value = null;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError) {
      error.value = signUpError.message;
    } else {
      user.value = data.user ?? null;
    }
    status.value = 'idle';
    return !signUpError;
  }

  async function signOut() {
    status.value = 'signing-out';
    error.value = null;
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      error.value = signOutError.message;
    } else {
      user.value = null;
    }
    status.value = 'idle';
    return !signOutError;
  }

  return {
    user,
    status,
    error,
    initialized,
    init,
    signIn,
    signUp,
    signOut,
  };
});
