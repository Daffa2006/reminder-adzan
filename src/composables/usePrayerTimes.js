import { ref, readonly, watch } from 'vue'
import { getPrayerTimes } from '@/services/aladhan.js'

const CACHE_KEY = 'adzan_prayer_times'

const prayerTimes = ref(null)
const hijriDate = ref(null)
const loading = ref(false)
const error = ref(null)
const isFromCache = ref(false)
const lastUpdated = ref(null)

/**
 * Build a cache key from date + coordinates
 */
function buildCacheKey(lat, lng, date) {
  const d = date || new Date()
  const dateStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
  const latStr = parseFloat(lat).toFixed(4)
  const lngStr = parseFloat(lng).toFixed(4)
  return `${CACHE_KEY}_${dateStr}_${latStr}_${lngStr}`
}

/**
 * Load prayer times from localStorage cache
 */
function loadFromCache(lat, lng) {
  try {
    const key = buildCacheKey(lat, lng, new Date())
    const cached = localStorage.getItem(key)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (parsed.prayerTimes && parsed.hijriDate) {
        return parsed
      }
    }
    // Try any cached data as last resort
    const fallback = localStorage.getItem(CACHE_KEY + '_fallback')
    if (fallback) {
      return JSON.parse(fallback)
    }
  } catch {
    // ignore
  }
  return null
}

/**
 * Save prayer times to localStorage cache
 */
function saveToCache(lat, lng, data) {
  try {
    const key = buildCacheKey(lat, lng, new Date())
    const payload = {
      ...data,
      cachedAt: Date.now(),
    }
    localStorage.setItem(key, JSON.stringify(payload))
    // Also save as general fallback
    localStorage.setItem(CACHE_KEY + '_fallback', JSON.stringify(payload))
  } catch {
    // ignore
  }
}

/**
 * Check if cached data is from today
 */
function isCacheValid(cachedData) {
  if (!cachedData?.cachedAt) return false
  const cached = new Date(cachedData.cachedAt)
  const now = new Date()
  return (
    cached.getFullYear() === now.getFullYear() &&
    cached.getMonth() === now.getMonth() &&
    cached.getDate() === now.getDate()
  )
}

/**
 * Fetch prayer times from API or cache
 * @param {number} lat
 * @param {number} lng
 * @param {number} method - calculation method
 * @param {number} school - madhab
 * @param {boolean} forceRefresh
 */
async function fetchPrayerTimes(lat, lng, method = 20, school = 0, forceRefresh = false) {
  if (!lat || !lng) return

  // Load cache first for immediate display
  const cached = loadFromCache(lat, lng)
  if (cached && isCacheValid(cached) && !forceRefresh) {
    prayerTimes.value = cached.prayerTimes
    hijriDate.value = cached.hijriDate
    isFromCache.value = true
    lastUpdated.value = new Date(cached.cachedAt)
    error.value = null
    return
  }

  // Show cached data while fetching
  if (cached) {
    prayerTimes.value = cached.prayerTimes
    hijriDate.value = cached.hijriDate
    isFromCache.value = true
    lastUpdated.value = new Date(cached.cachedAt)
  }

  loading.value = true
  error.value = null

  try {
    const result = await getPrayerTimes(lat, lng, method, school)
    prayerTimes.value = result.prayerTimes
    hijriDate.value = result.hijriDate
    isFromCache.value = false
    lastUpdated.value = new Date()
    error.value = null
    saveToCache(lat, lng, result)
  } catch (err) {
    if (!prayerTimes.value) {
      // No cache at all — show error
      error.value = 'Tidak dapat memuat jadwal salat. Periksa koneksi internet Anda.'
    } else {
      // Has cache — use it silently with a soft warning
      error.value = 'Tidak dapat memperbarui jadwal. Menampilkan jadwal tersimpan.'
      isFromCache.value = true
    }
    console.warn('Prayer times fetch failed:', err.message)
  } finally {
    loading.value = false
  }
}

/**
 * Track date changes and auto-refresh
 */
let dateWatchInterval = null

function startDateWatch(lat, lng, method, school) {
  let lastDate = new Date().getDate()

  if (dateWatchInterval) clearInterval(dateWatchInterval)

  dateWatchInterval = setInterval(() => {
    const today = new Date().getDate()
    if (today !== lastDate) {
      lastDate = today
      fetchPrayerTimes(lat, lng, method, school, true)
    }
  }, 60000) // Check every minute
}

function stopDateWatch() {
  if (dateWatchInterval) {
    clearInterval(dateWatchInterval)
    dateWatchInterval = null
  }
}

export function usePrayerTimes() {
  return {
    prayerTimes: readonly(prayerTimes),
    hijriDate: readonly(hijriDate),
    loading: readonly(loading),
    error: readonly(error),
    isFromCache: readonly(isFromCache),
    lastUpdated: readonly(lastUpdated),
    fetchPrayerTimes,
    startDateWatch,
    stopDateWatch,
  }
}
