import { ref, computed, readonly, onUnmounted } from 'vue'
import {
  formatTime,
  formatFullDate,
  formatCountdown,
  getNextPrayer,
  getPrayerStatuses,
  getCountdownProgress,
} from '@/lib/utils.js'

const currentTime = ref(new Date())
let timerInterval = null
let instanceCount = 0

/**
 * Single global timer — shared across all component instances
 * to avoid multiple setInterval calls
 */
function startGlobalTimer() {
  if (timerInterval) return
  timerInterval = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
}

function stopGlobalTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

export function useCountdown(prayerTimesRef) {
  instanceCount++
  startGlobalTimer()

  const nextPrayer = computed(() => {
    return getNextPrayer(prayerTimesRef?.value, currentTime.value)
  })

  const countdown = computed(() => {
    if (!nextPrayer.value) return '00:00:00'
    return formatCountdown(nextPrayer.value.secondsUntil)
  })

  const progress = computed(() => {
    if (!nextPrayer.value || !prayerTimesRef?.value) return 0
    return getCountdownProgress(
      prayerTimesRef.value,
      nextPrayer.value.name,
      currentTime.value
    )
  })

  const prayerStatuses = computed(() => {
    if (!prayerTimesRef?.value) return {}
    return getPrayerStatuses(
      prayerTimesRef.value,
      nextPrayer.value?.name,
      currentTime.value
    )
  })

  const timeString = computed(() => formatTime(currentTime.value))
  const dateString = computed(() => formatFullDate(currentTime.value))

  onUnmounted(() => {
    instanceCount--
    if (instanceCount <= 0) {
      instanceCount = 0
      stopGlobalTimer()
    }
  })

  return {
    currentTime: readonly(currentTime),
    timeString,
    dateString,
    nextPrayer,
    countdown,
    progress,
    prayerStatuses,
  }
}
