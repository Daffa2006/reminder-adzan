/**
 * Shared utility functions
 */

/**
 * Format a Date to HH:MM:SS string
 */
export function formatTime(date) {
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

/**
 * Format a Date to HH:MM string
 */
export function formatTimeShort(date) {
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Format a number of seconds to HH:MM:SS
 */
export function formatCountdown(totalSeconds) {
  if (totalSeconds <= 0) return '00:00:00'
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = Math.floor(totalSeconds % 60)
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

/**
 * Parse a time string "HH:MM" into total minutes from midnight
 */
export function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

/**
 * Parse a time string "HH:MM" into a Date object for today
 */
export function timeStrToDate(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

/**
 * Prayer list used for ordering and display
 * Terbit is informational — not a salat, so it doesn't count as "next prayer"
 */
export const PRAYER_ORDER = ['Imsak', 'Subuh', 'Terbit', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya']

/**
 * Prayers that are actual salat (not informational)
 */
export const SALAT_PRAYERS = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya']

/**
 * Get the next salat from a prayer times object based on current time
 * Only considers actual salat (not Imsak/Terbit)
 * @param {object} prayerTimes - { Subuh: "04:40", ... }
 * @param {Date} now
 * @returns {{ name: string, time: string, secondsUntil: number } | null}
 */
export function getNextPrayer(prayerTimes, now = new Date()) {
  if (!prayerTimes) return null

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()

  for (const name of SALAT_PRAYERS) {
    const timeStr = prayerTimes[name]
    if (!timeStr || timeStr === '--:--') continue

    const [h, m] = timeStr.split(':').map(Number)
    const prayerMinutes = h * 60 + m
    const prayerSeconds = h * 3600 + m * 60

    if (prayerMinutes > nowMinutes) {
      return {
        name,
        time: timeStr,
        secondsUntil: prayerSeconds - nowSeconds,
      }
    }
  }

  // After Isya — next prayer is Subuh tomorrow
  const subuhTime = prayerTimes['Subuh']
  if (subuhTime && subuhTime !== '--:--') {
    const [h, m] = subuhTime.split(':').map(Number)
    const subuhSeconds = h * 3600 + m * 60
    const secondsInDay = 24 * 3600
    const secondsUntil = secondsInDay - nowSeconds + subuhSeconds
    return {
      name: 'Subuh',
      time: subuhTime,
      secondsUntil,
      isTomorrow: true,
    }
  }

  return null
}

/**
 * Get status of each prayer
 * @param {object} prayerTimes
 * @param {string|null} nextPrayerName
 * @param {Date} now
 * @returns {object} { PrayerName: 'past' | 'next' | 'upcoming' }
 */
export function getPrayerStatuses(prayerTimes, nextPrayerName, now = new Date()) {
  if (!prayerTimes) return {}

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const statuses = {}

  for (const name of PRAYER_ORDER) {
    const timeStr = prayerTimes[name]
    if (!timeStr || timeStr === '--:--') {
      statuses[name] = 'upcoming'
      continue
    }

    const [h, m] = timeStr.split(':').map(Number)
    const prayerMinutes = h * 60 + m

    if (name === nextPrayerName) {
      statuses[name] = 'next'
    } else if (prayerMinutes <= nowMinutes) {
      statuses[name] = 'past'
    } else {
      statuses[name] = 'upcoming'
    }
  }

  return statuses
}

/**
 * Format a Date to full Indonesian date string
 * e.g. "Rabu, 19 Agustus 2026"
 */
export function formatFullDate(date) {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Hijri month names in Indonesian
 */
const HIJRI_MONTHS_ID = [
  'Muharram', 'Safar', 'Rabi\'ul Awal', 'Rabi\'ul Akhir',
  'Jumadil Awal', 'Jumadil Akhir', 'Rajab', 'Sya\'ban',
  'Ramadan', 'Syawal', 'Dzulqa\'dah', 'Dzulhijjah',
]

/**
 * Get Indonesian Hijri month name from month number (1-12)
 */
export function hijriMonthName(monthNum) {
  const idx = parseInt(monthNum, 10) - 1
  return HIJRI_MONTHS_ID[idx] || ''
}

/**
 * Format Hijri date object to display string
 * @param {object} hijriDate - from AlAdhan API
 */
export function formatHijriDate(hijriDate) {
  if (!hijriDate || !hijriDate.day) return ''
  const monthName = hijriMonthName(hijriDate.month)
  return `${hijriDate.day} ${monthName} ${hijriDate.year} H`
}

/**
 * Calculate progress (0–100) for next prayer countdown
 * from previous prayer time to next prayer time
 * @param {object} prayerTimes
 * @param {string} nextPrayerName
 * @param {Date} now
 * @returns {number} 0–100
 */
export function getCountdownProgress(prayerTimes, nextPrayerName, now = new Date()) {
  if (!prayerTimes || !nextPrayerName) return 0

  const prayers = SALAT_PRAYERS
  const nextIdx = prayers.indexOf(nextPrayerName)

  const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()

  let startSeconds = 0
  if (nextIdx > 0) {
    const prevName = prayers[nextIdx - 1]
    const prevTime = prayerTimes[prevName]
    if (prevTime && prevTime !== '--:--') {
      const [h, m] = prevTime.split(':').map(Number)
      startSeconds = h * 3600 + m * 60
    }
  }

  const nextTime = prayerTimes[nextPrayerName]
  if (!nextTime || nextTime === '--:--') return 0

  const [nh, nm] = nextTime.split(':').map(Number)
  let endSeconds = nh * 3600 + nm * 60

  // Handle overnight case (Isya -> Subuh next day)
  if (endSeconds < startSeconds) {
    endSeconds += 24 * 3600
  }

  let current = nowSeconds
  if (current < startSeconds) {
    current += 24 * 3600
  }

  const total = endSeconds - startSeconds
  const elapsed = current - startSeconds

  if (total <= 0) return 100
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
}

/**
 * Format relative time (e.g. "2 minutes ago", "just now")
 */
export function formatRelativeTime(date) {
  if (!date) return ''
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)

  if (diff < 60) return 'baru saja'
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}
