import { ref, readonly } from 'vue'

const STORAGE_KEY = 'adzan_location'

const DEFAULT_LOCATION = {
  latitude: -6.2088,
  longitude: 106.8456,
  locationName: 'Jakarta, Indonesia',
}

const coords = ref({ ...DEFAULT_LOCATION })
const loading = ref(false)
const error = ref(null)

/**
 * Load location from localStorage
 */
function loadCached() {
  try {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (parsed.latitude && parsed.longitude) {
        coords.value = parsed
        return true
      }
    }
  } catch {
    // ignore
  }
  return false
}

/**
 * Save location to localStorage
 */
function saveToCache(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

/**
 * Detect current location using browser Geolocation API
 * Falls back to cached or default if denied
 */
async function detectLocation() {
  if (!navigator.geolocation) {
    error.value = 'Geolocation tidak didukung browser ini.'
    loadCached()
    return
  }

  loading.value = true
  error.value = null

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        // Try to reverse geocode the city name
        let locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=id`,
            { headers: { 'User-Agent': 'AdzanApp/1.0' } }
          )
          if (res.ok) {
            const geoData = await res.json()
            const addr = geoData.address || {}
            const city = addr.city || addr.town || addr.county || addr.state || ''
            const country = addr.country || ''
            if (city || country) {
              locationName = [city, country].filter(Boolean).join(', ')
            }
          }
        } catch {
          // Keep coordinate string as fallback name
        }

        const newCoords = { latitude, longitude, locationName }
        coords.value = newCoords
        saveToCache(newCoords)
        loading.value = false
        resolve(newCoords)
      },
      (err) => {
        loading.value = false
        if (err.code === err.PERMISSION_DENIED) {
          error.value = 'Izin lokasi ditolak. Menggunakan lokasi terakhir.'
        } else {
          error.value = 'Tidak dapat mendeteksi lokasi.'
        }
        // Fall back to cached or default
        if (!loadCached()) {
          coords.value = { ...DEFAULT_LOCATION }
        }
        resolve(coords.value)
      },
      { timeout: 10000, maximumAge: 60000 * 30 }
    )
  })
}

/**
 * Manually set location (from settings)
 */
function setLocation(data) {
  coords.value = data
  saveToCache(data)
}

export function useLocation() {
  return {
    coords: readonly(coords),
    loading: readonly(loading),
    error: readonly(error),
    detectLocation,
    setLocation,
    loadCached,
    DEFAULT_LOCATION,
  }
}
