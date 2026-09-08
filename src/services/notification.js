/**
 * Notification & Adzan Service
 * Handles browser notifications and audio playback with Cache API.
 */

// Track current playing audio instance
let currentAudio = null;
let audioUnlocked = false;

// ─── Audio Unlock ─────────────────────────────────────────────────────────────

/**
 * Unlock audio playback after user interaction.
 * Call this from a real user interaction such as button click.
 */
export async function unlockAudio() {
  if (audioUnlocked) return true;

  try {
    const silentAudio = new Audio(
      "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",
    );

    silentAudio.volume = 0;

    await silentAudio.play();

    audioUnlocked = true;

    console.log("[AUDIO] Audio berhasil di-unlock");

    return true;
  } catch (error) {
    console.warn("[AUDIO] Gagal unlock audio:", error);
    audioUnlocked = false;

    return false;
  }
}

export function isAudioUnlocked() {
  return audioUnlocked;
}

export function setAudioUnlocked(value = true) {
  audioUnlocked = value;
}

// ─── Audio Playback ───────────────────────────────────────────────────────────

export async function playAdzan(audioUrl, volume = 80) {
  // Hentikan audio sebelumnya
  stopAdzan();

  try {
    const audio = new Audio(audioUrl);

    audio.volume = Math.min(100, Math.max(0, volume)) / 100;

    currentAudio = audio;

    console.log("[AUDIO] Mencoba memainkan:", audioUrl);

    audio.addEventListener(
      "play",
      () => {
        console.log("[AUDIO] PLAY");
      },
      { once: true },
    );

    audio.addEventListener(
      "playing",
      () => {
        console.log("[AUDIO] PLAYING");
      },
      { once: true },
    );

    audio.addEventListener("pause", () => {
      console.log("[AUDIO] PAUSE");
    });

    const playbackFinished = new Promise((resolve, reject) => {
      audio.addEventListener(
        "ended",
        () => {
          console.log("[AUDIO] ENDED");

          if (currentAudio === audio) {
            currentAudio = null;
          }

          if (audioUrl.startsWith("blob:")) {
            URL.revokeObjectURL(audioUrl);
          }

          resolve("ended");
        },
        { once: true },
      );

      audio.addEventListener(
        "error",
        () => {
          console.error("[AUDIO] ERROR:", audio.error);

          if (currentAudio === audio) {
            currentAudio = null;
          }

          if (audioUrl.startsWith("blob:")) {
            URL.revokeObjectURL(audioUrl);
          }

          reject(new Error("Audio playback error"));
        },
        { once: true },
      );
    });

    await audio.play();

    console.log("[AUDIO] audio.play() berhasil");

    await playbackFinished;

    return audio;
  } catch (error) {
    console.error("[AUDIO] audio.play() gagal:", error);

    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    return null;
  }
}

// ─── Stop Audio ──────────────────────────────────────────────────────────────

export function stopAdzan() {
  if (!currentAudio) return;

  console.log("[AUDIO] STOP");

  currentAudio.pause();
  currentAudio.currentTime = 0;
  currentAudio = null;
}

export function isAdzanPlaying() {
  return currentAudio !== null && !currentAudio.paused;
}

// ─── Browser Notifications ───────────────────────────────────────────────────

export async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  const result = await Notification.requestPermission();

  return result === "granted";
}

export function hasNotificationPermission() {
  return "Notification" in window && Notification.permission === "granted";
}

export function showPrayerNotification(prayerName, time) {
  if (!hasNotificationPermission()) return;

  const notification = new Notification(`🕌 Waktu ${prayerName}`, {
    body: `Sekarang pukul ${time}. Saatnya melaksanakan salat ${prayerName}.`,
    icon: "/favicon.ico",
    tag: `prayer-${prayerName}`,
    requireInteraction: false,
  });

  setTimeout(() => notification.close(), 15000);
}
