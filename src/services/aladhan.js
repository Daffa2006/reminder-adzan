/**
 * AlAdhan Prayer Times API Service
 * Docs: https://aladhan.com/prayer-times-api
 */

const BASE_URL = 'https://api.aladhan.com/v1'

/**
 * Calculation methods
 * 20 = KEMENAG (Kementerian Agama Republik Indonesia)
 */
export const CALCULATION_METHODS = [
  { value: 1,  label: 'University of Islamic Sciences, Karachi' },
  { value: 2,  label: 'Islamic Society of North America (ISNA)' },
  { value: 3,  label: 'Muslim World League' },
  { value: 4,  label: 'Umm Al-Qura University, Makkah' },
  { value: 5,  label: 'Egyptian General Authority of Survey' },
  { value: 11, label: 'Majlis Ugama Islam Singapura (MUIS)' },
  { value: 20, label: 'Kementerian Agama Republik Indonesia (KEMENAG)' },
]

export const MADHAB_OPTIONS = [
  { value: 0, label: 'Shafi\'i, Maliki, Hanbali' },
  { value: 1, label: 'Hanafi' },
]

/**
 * Normalize a time string from AlAdhan API (e.g. "04:30 (WIB)") to "04:30"
 */
function normalizeTime(timeStr) {
  if (!timeStr) return '--:--'
  return timeStr.split(' ')[0].trim()
}

/**
 * Build date string for API: DD-MM-YYYY
 */
function buildDateParam(date = new Date()) {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}-${m}-${y}`
}

/**
 * Fetch prayer times from AlAdhan API
 * @param {number} latitude
 * @param {number} longitude
 * @param {number} method - calculation method (default: 20 = KEMENAG)
 * @param {number} school - madhab (default: 0 = Shafi'i)
 * @param {Date} date - defaults to today
 * @returns {Promise<{prayerTimes: object, hijriDate: object, rawData: object}>}
 */
export async function getPrayerTimes(latitude, longitude, method = 20, school = 0, date = new Date()) {
  const dateParam = buildDateParam(date)
  const url = `${BASE_URL}/timings/${dateParam}?latitude=${latitude}&longitude=${longitude}&method=${method}&school=${school}&tune=0,0,0,0,0,0,0,0,0`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`AlAdhan API responded with status ${response.status}`)
    }

    const data = await response.json()

    if (data.code !== 200 || !data.data) {
      throw new Error('Invalid response from AlAdhan API')
    }

    return parseResponse(data.data)
  } catch (err) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection.')
    }
    throw err
  }
}

/**
 * Parse and normalize the AlAdhan API response
 */
function parseResponse(data) {
  const t = data.timings

  const prayerTimes = {
    Imsak:   normalizeTime(t.Imsak),
    Subuh:   normalizeTime(t.Fajr),
    Terbit:  normalizeTime(t.Sunrise),
    Dzuhur:  normalizeTime(t.Dhuhr),
    Ashar:   normalizeTime(t.Asr),
    Maghrib: normalizeTime(t.Maghrib),
    Isya:    normalizeTime(t.Isha),
  }

  const hijri = data.date?.hijri || {}
  const hijriDate = {
    day:        hijri.day   || '',
    month:      hijri.month?.number || '',
    monthName:  hijri.month?.ar    || '',
    monthEn:    hijri.month?.en    || '',
    year:       hijri.year  || '',
    designation: hijri.designation?.abbreviated || 'H',
  }

  const gregorian = data.date?.gregorian || {}
  const meta = data.meta || {}

  return {
    prayerTimes,
    hijriDate,
    gregorianDate: gregorian.date || '',
    timezone: meta.timezone || '',
    method: meta.method?.name || '',
    rawData: data,
  }
}

/**
 * Get the Hijri date for a given Gregorian date
 * Uses the same endpoint but only extracts the hijri date
 */
export async function getHijriDate(date = new Date()) {
  const result = await getPrayerTimes(-6.2088, 106.8456, 20, 0, date)
  return result.hijriDate
}
