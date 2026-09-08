import { ref, watch, readonly, onUnmounted } from "vue";
import { useAudioDB } from "@/composables/useAudioDB.js";

import {
  playAdzan,
  stopAdzan,
  isAdzanPlaying,
  unlockAudio,
  setAudioUnlocked,
  showPrayerNotification,
  requestNotificationPermission,
  hasNotificationPermission,
} from "@/services/notification.js";

import { SALAT_PRAYERS } from "@/lib/utils.js";
// Helper
// PENTING: SALAT_PRAYERS (dipakai auto-trigger) berisi nama Indonesia
// ("Subuh", "Dzuhur", "Ashar", "Isya"), sedangkan tombol Test Audio manual
// di DashboardView.vue mengirim nama Inggris ("Fajr", "Dhuhr", "Asr", "Isha").
// Mapping ini harus mendukung KEDUANYA agar auto-trigger dan test manual
// sama-sama menemukan audio yang benar di IndexedDB.
const prayerAudioKeys = {
  Fajr: "shubuh",
  Subuh: "shubuh",
  Dhuhr: "dzuhur",
  Dzuhur: "dzuhur",
  Asr: "ashar",
  Ashar: "ashar",
  Maghrib: "maghrib",
  Isha: "isya",
  Isya: "isya",
};

/**
 * useAdzan composable
 * Monitors prayer times and triggers adzan at the right moment.
 *
 * @param {Ref<object|null>} prayerTimesRef - reactive prayer times object
 * @param {Ref<object>} settingsRef - reactive settings object
 */

export function useAdzan(prayerTimesRef, settingsRef) {
  const { getAudio } = useAudioDB();
  const isPlaying = ref(false);
  const lastTriggeredPrayer = ref(null);
  const audioReady = ref(false);
  const cacheStatus = ref("idle"); // 'idle' | 'caching' | 'cached' | 'error'

  let checkInterval = null;

  // ─── User Interaction Unlock ─────────────────────────────────────────────

  /**
   * Must be called after user clicks "Test Audio" or similar.
   * This satisfies browser autoplay restrictions.
   */
  async function handleUserInteraction(url) {
    const unlocked = await unlockAudio();

    if (!unlocked) {
      console.warn("[ADZAN] Browser belum mengizinkan audio");

      return false;
    }

    setAudioUnlocked(true);

    return true;
  }

  // ─── Test Playback ───────────────────────────────────────────────────────

  /**
   * Test adzan playback (from Settings page test button)
   */
  async function testAdzan() {
    const audioUrl = settingsRef?.value?.adzanUrl;
    setAudioUnlocked(true);
    isPlaying.value = true;
    await playAdzan(audioUrl, settingsRef?.value?.volume ?? 80);
    isPlaying.value = isAdzanPlaying();
  }

  function stopAdzanPlayback() {
    stopAdzan();
    isPlaying.value = false;
  }

  // ─── Auto Trigger ────────────────────────────────────────────────────────

  /**
   * Check if current time matches a prayer time and trigger adzan.
   * Called every second via the clock composable.
   */
  async function checkAndTrigger(now = new Date()) {
    const prayers = prayerTimesRef?.value;
    const settings = settingsRef?.value;

    if (!prayers || !settings) {
      console.log("[ADZAN] prayerTimes/settings belum tersedia");
      return;
    }

    if (!settings.adzanEnabled && !settings.notificationEnabled) {
      console.log("[ADZAN] Auto trigger dilewati: adzan dan notification OFF");
      return;
    }

    const todayKey = now.toDateString(); // untuk reset tiap hari
    const nowSeconds =
      now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    // Toleransi keterlambatan — kalau checkAndTrigger telat jalan (background tab dsb),
    // masih dianggap valid selama tidak lebih dari ini
    const GRACE_PERIOD_SECONDS = 120; // 2 menit

    for (const name of SALAT_PRAYERS) {
      const timeStr = prayers[name];

      if (!timeStr || timeStr === "--:--") {
        continue;
      }

      const [pHH, pMM] = timeStr.split(":").map(Number);
      const prayerSeconds = pHH * 3600 + pMM * 60;

      const diff = nowSeconds - prayerSeconds;

      // Belum waktunya, atau sudah kelewat terlalu lama → skip
      if (diff < 0 || diff > GRACE_PERIOD_SECONDS) {
        continue;
      }

      const key = `${todayKey}-${name}`;

      if (lastTriggeredPrayer.value === key) {
        continue; // sudah pernah ditrigger hari ini
      }

      lastTriggeredPrayer.value = key;

      console.log(`[ADZAN] WAKTU COCOK → ${name} ${timeStr} (telat ${diff}s)`);

      if (settings.notificationEnabled && hasNotificationPermission()) {
        showPrayerNotification(name, timeStr);
      }

      if (!settings.adzanEnabled) {
        console.log("[ADZAN] Jadwal cocok, tetapi adzanEnabled = false");
        break;
      }

      const audioUrl = await getPrayerAudio(name);

      if (!audioUrl) {
        console.warn(`[ADZAN] Audio ${name} tidak ditemukan di IndexedDB`);
        break;
      }

      isPlaying.value = true;

      try {
        const result = await playAdzan(audioUrl, settings.volume ?? 80);

        if (!result) {
          console.warn(`[ADZAN] playAdzan gagal memainkan ${name}`);
        } else {
          console.log(`[ADZAN] Audio ${name} selesai`);
        }
      } catch (error) {
        console.error(`[ADZAN] Playback error ${name}:`, error);
      } finally {
        isPlaying.value = false;

        if (audioUrl.startsWith("blob:")) {
          URL.revokeObjectURL(audioUrl);
        }
      }

      break;
    }
  }

  /**
   * Start the adzan monitor — call this in onMounted
   */
  function startMonitor() {
    if (checkInterval) return;

    checkAndTrigger(new Date());

    checkInterval = setInterval(() => {
      checkAndTrigger(new Date());
    }, 1000);

    // Begitu tab kembali terlihat (user pindah balik / un-minimize),
    // langsung cek ulang — jangan tunggu interval berikutnya
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }

  function handleVisibilityChange() {
    if (document.visibilityState === "visible") {
      console.log("[ADZAN] Tab kembali terlihat, cek ulang jadwal");
      checkAndTrigger(new Date());
    }
  }

  function stopMonitor() {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }

    document.removeEventListener("visibilitychange", handleVisibilityChange);
  }

  // Tambahkan di useAdzan.js, di bagian atas function-function lain
  function resetTriggerHistory() {
    lastTriggeredPrayer.value = null;
  }

  // ─── Notifications ───────────────────────────────────────────────────────

  async function enableNotifications() {
    const granted = await requestNotificationPermission();
    return granted;
  }
  // Lalu buat fungsi untuk mengambil audio berdasarkan nama salat:
  async function getPrayerAudio(prayerName) {
    const audioKey = prayerAudioKeys[prayerName];

    if (!audioKey) {
      console.warn("[ADZAN] Audio key tidak ditemukan:", prayerName);
      return null;
    }

    const audioData = await getAudio(audioKey);

    if (!audioData?.file) {
      console.warn("[ADZAN] Audio tidak ditemukan:", audioKey);
      return null;
    }

    return URL.createObjectURL(audioData.file);
  }
  async function testPrayerAudio(prayerName) {
    const audioUrl = await getPrayerAudio(prayerName);

    if (!audioUrl) {
      console.warn("[ADZAN TEST] Audio tidak ditemukan:", prayerName);
      return false;
    }

    isPlaying.value = true;

    try {
      await playAdzan(audioUrl, settingsRef?.value?.volume ?? 80);

      return true;
    } catch (error) {
      console.error("[ADZAN TEST] Playback gagal:", error);

      return false;
    } finally {
      isPlaying.value = false;
      URL.revokeObjectURL(audioUrl);
    }
  }
  // ─── Lifecycle ───────────────────────────────────────────────────────────

  onUnmounted(stopMonitor);

  return {
    isPlaying: readonly(isPlaying),
    audioReady: readonly(audioReady),
    cacheStatus: readonly(cacheStatus),
    startMonitor,
    stopMonitor,
    checkAndTrigger,
    testAdzan,
    testPrayerAudio,
    stopAdzanPlayback,
    handleUserInteraction,
    enableNotifications,
    resetTriggerHistory,
  };
}
