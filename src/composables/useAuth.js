import { ref, readonly } from 'vue'
import { supabase, isSupabaseConfigured } from '@/services/supabase.js'

const user = ref(null)
const loading = ref(false)
const error = ref(null)

/**
 * Initialize auth — restore session from storage
 */
async function initAuth() {
  if (!isSupabaseConfigured()) return

  loading.value = true
  try {
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user || null

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user || null
    })
  } catch {
    user.value = null
  } finally {
    loading.value = false
  }
}

/**
 * Login with email and password
 */
async function login(email, password) {
  if (!isSupabaseConfigured()) {
    error.value = 'Supabase tidak dikonfigurasi.'
    return false
  }

  loading.value = true
  error.value = null

  try {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      error.value = 'Email atau password tidak valid.'
      return false
    }

    user.value = data.user
    return true
  } catch {
    error.value = 'Terjadi kesalahan. Silakan coba lagi.'
    return false
  } finally {
    loading.value = false
  }
}

/**
 * Register with email and password
 */
async function register(email, password) {
  if (!isSupabaseConfigured()) {
    error.value = 'Supabase tidak dikonfigurasi.'
    return false
  }

  loading.value = true
  error.value = null

  try {
    const { data, error: authError } = await supabase.auth.signUp({ email, password })

    if (authError) {
      error.value = authError.message
      return false
    }

    user.value = data.user
    return true
  } catch {
    error.value = 'Pendaftaran gagal. Silakan coba lagi.'
    return false
  } finally {
    loading.value = false
  }
}

/**
 * Logout current user
 */
async function logout() {
  if (!isSupabaseConfigured()) return

  loading.value = true
  try {
    await supabase.auth.signOut()
    user.value = null
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

export function useAuth() {
  return {
    user: readonly(user),
    loading: readonly(loading),
    error: readonly(error),
    initAuth,
    login,
    register,
    logout,
  }
}
