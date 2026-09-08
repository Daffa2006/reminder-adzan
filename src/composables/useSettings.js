import { ref, readonly } from 'vue'
import { supabase, isSupabaseConfigured } from '@/services/supabase.js'

const STORAGE_KEY = 'adzan_settings'

const DEFAULT_SETTINGS = {
  locationName: 'Jakarta, Indonesia',
  latitude: -6.2088,
  longitude: 106.8456,
  calculationMethod: 20,
  madhab: 0,
  notificationEnabled: false,
  adzanEnabled: false,
  volume: 80,
  theme: 'system', // 'light' | 'dark' | 'system'
  adzanUrl: 'https://www.islamcan.com/audio/adhan/azan1.mp3',
}

const settings = ref({ ...DEFAULT_SETTINGS })
const loading = ref(false)

/**
 * Load from localStorage
 */
function loadFromLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      settings.value = { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch {
    settings.value = { ...DEFAULT_SETTINGS }
  }
}

/**
 * Save to localStorage
 */
function saveToLocal(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

/**
 * Load settings from Supabase (authenticated users)
 */
async function loadFromSupabase(userId) {
  if (!isSupabaseConfigured()) return false

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) return false

    settings.value = {
      ...DEFAULT_SETTINGS,
      locationName: data.location_name,
      latitude: data.latitude,
      longitude: data.longitude,
      calculationMethod: data.calculation_method,
      madhab: data.madhab,
      notificationEnabled: data.notification_enabled,
      adzanEnabled: data.adzan_enabled,
      volume: data.volume,
      theme: data.theme || 'system',
    }
    return true
  } catch {
    return false
  }
}

/**
 * Save settings to Supabase (authenticated users)
 */
async function saveToSupabase(userId, data) {
  if (!isSupabaseConfigured()) return false

  try {
    const payload = {
      user_id: userId,
      location_name: data.locationName,
      latitude: data.latitude,
      longitude: data.longitude,
      calculation_method: data.calculationMethod,
      madhab: data.madhab,
      notification_enabled: data.notificationEnabled,
      adzan_enabled: data.adzanEnabled,
      volume: data.volume,
      theme: data.theme,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('user_settings')
      .upsert(payload, { onConflict: 'user_id' })

    return !error
  } catch {
    return false
  }
}

/**
 * Initialize settings — loads from localStorage first, then Supabase if available
 */
async function initSettings(user = null) {
  loadFromLocal()

  if (user && isSupabaseConfigured()) {
    loading.value = true
    await loadFromSupabase(user.id)
    loading.value = false
  }
}

/**
 * Save settings — always saves locally, also to Supabase if authenticated
 */
async function saveSettings(newSettings, user = null) {
  const merged = { ...settings.value, ...newSettings }
  settings.value = merged
  saveToLocal(merged)

  if (user && isSupabaseConfigured()) {
    loading.value = true
    await saveToSupabase(user.id, merged)
    loading.value = false
  }
}

/**
 * Update a specific setting key
 */
function updateSetting(key, value) {
  settings.value = { ...settings.value, [key]: value }
  saveToLocal(settings.value)
}

export function useSettings() {
  return {
    settings: readonly(settings),
    loading: readonly(loading),
    initSettings,
    saveSettings,
    updateSetting,
    DEFAULT_SETTINGS,
  }
}
