<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import Clock from '@/components/Clock.vue'
import NextPrayerCard from '@/components/NextPrayerCard.vue'
import PrayerTimes from '@/components/PrayerTimes.vue'
import StatusBar from '@/components/StatusBar.vue'
import { useLocation } from '@/composables/useLocation.js'
import { usePrayerTimes } from '@/composables/usePrayerTimes.js'
import { useCountdown } from '@/composables/useCountdown.js'
import { useSettings } from '@/composables/useSettings.js'
import { useAdzan } from '@/composables/useAdzan.js'
const { coords, loadCached, detectLocation } = useLocation();
const {
    prayerTimes,
    hijriDate,
    loading,
    error,
    isFromCache,
    lastUpdated,
    fetchPrayerTimes,
    startDateWatch,
    stopDateWatch,
} = usePrayerTimes()

const { settings, updateSetting } = useSettings()

const {
    timeString,
    dateString,
    nextPrayer,
    countdown,
    progress,
    prayerStatuses,
} = useCountdown(prayerTimes)
const playingPrayer = ref(null)
async function init() {
    // Load cached location first for immediate data
    loadCached()
    const loc = coords.value

    // Fetch prayer times with cached location
    await fetchPrayerTimes(loc.latitude, loc.longitude, settings.value.calculationMethod, settings.value.madhab)

    // Start date watcher
    startDateWatch(loc.latitude, loc.longitude, settings.value.calculationMethod, settings.value.madhab)

    // Then try to get precise location
    detectLocation().then(async (newLoc) => {
        if (
            newLoc &&
            (Math.abs(newLoc.latitude - loc.latitude) > 0.01 ||
                Math.abs(newLoc.longitude - loc.longitude) > 0.01)
        ) {
            // Location changed — refresh prayer times
            await fetchPrayerTimes(newLoc.latitude, newLoc.longitude, settings.value.calculationMethod, settings.value.madhab, true)
            startDateWatch(newLoc.latitude, newLoc.longitude, settings.value.calculationMethod, settings.value.madhab)
        }
    })
}

async function handleRefresh() {
    const loc = coords.value
    await fetchPrayerTimes(loc.latitude, loc.longitude, settings.value.calculationMethod, settings.value.madhab, true)
}

const handleTestPrayer = async (prayer) => {
    playingPrayer.value = prayer

    try {
        await testPrayerAudio(prayer)
    } finally {
        playingPrayer.value = null
    }
}
function handleToggleTheme() {
    const themes = ['light', 'dark', 'system']
    const current = settings.value.theme || 'system'
    const next = themes[(themes.indexOf(current) + 1) % themes.length]
    updateSetting('theme', next)
}

const {
    isPlaying,
    startMonitor,
    stopMonitor,
    stopAdzanPlayback,
    handleUserInteraction,
    testPrayerAudio,
} = useAdzan(prayerTimes, settings);

const audioUnlocked = ref(false);

async function enableAdzanAudio() {
    const success = await handleUserInteraction();

    if (success) {
        audioUnlocked.value = true;
        // Sekalian aktifkan adzanEnabled, supaya user tidak perlu
        // bolak-balik ke halaman "Pengaturan Audio" secara terpisah —
        // banner ini yang jadi satu-satunya tombol "aktifkan adzan" yang terlihat.
        updateSetting('adzanEnabled', true);
    }
}
onMounted(async () => {
    await init()

    startMonitor()
})
onUnmounted(() => {
    stopDateWatch()
    stopMonitor()
})
</script>

<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div class="max-w-2xl mx-auto px-0 sm:px-4">
            <!-- Header -->
            <AppHeader :location-name="coords.locationName" :theme="settings.theme" @toggle-theme="handleToggleTheme" />

            <!-- Main content -->
            <main class="flex flex-col gap-4 px-4 pb-8">
                <!-- Indikator audio sedang diputar -->
                <div v-if="isPlaying" class="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3
           dark:border-gray-700 dark:bg-gray-800">
                    <!-- Icon + text -->
                    <div class="flex min-w-0 flex-1 items-center gap-x-3">

                        <span class="text-xl">
                            🔊
                        </span>

                        <div class="min-w-0">
                            <p class="font-semibold text-emerald-800
                       dark:text-gray-100">
                                Audio sedang diputar
                            </p>

                            <p class="text-xs text-emerald-600
                       dark:text-gray-400">
                                Adzan sedang berlangsung
                            </p>
                        </div>

                        <!-- Animation -->
                        <div class="ml-auto flex shrink-0 gap-1">
                            <span class="size-2 animate-pulse rounded-full bg-emerald-500"></span>

                            <span class="size-2 animate-pulse rounded-full bg-emerald-500
                       [animation-delay:150ms]"></span>

                            <span class="size-2 animate-pulse rounded-full bg-emerald-500
                       [animation-delay:300ms]"></span>
                        </div>

                    </div>

                    <!-- Stop button -->
                    <button type="button" class="shrink-0 rounded-lg border border-rose-200
               bg-white px-3 py-2 text-sm font-semibold
               text-rose-600 transition
               hover:bg-rose-50
               dark:border-gray-600 dark:bg-gray-700
               dark:text-rose-400 dark:hover:bg-gray-600" @click="stopAdzanPlayback">
                        Stop
                    </button>
                </div>
                <!-- Clock -->
                <Clock :time-string="timeString" :date-string="dateString" :hijri-date="hijriDate" />

                <!-- Next Prayer Card -->
                <NextPrayerCard :next-prayer="nextPrayer" :countdown="countdown" :progress="progress"
                    :loading="loading" />

                <!-- Status Bar -->
                <StatusBar :is-from-cache="isFromCache" :last-updated="lastUpdated" :loading="loading" :error="error"
                    @refresh="handleRefresh" />

                <!-- Prayer Times -->
                <PrayerTimes :prayer-times="prayerTimes" :prayer-statuses="prayerStatuses" :loading="loading"
                    :is-from-cache="isFromCache" />

                <!-- Error message (no cache available) -->
                <div v-if="error && !prayerTimes"
                    class="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 rounded-xl p-4 text-sm text-red-600 dark:text-red-400"
                    role="alert">
                    <p class="font-semibold mb-1">Tidak dapat memuat jadwal salat</p>
                    <p class="text-red-500 dark:text-red-400">
                        Periksa koneksi internet Anda dan coba lagi.
                    </p>
                </div>
            </main>
            <div v-if="!audioUnlocked" class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3
           dark:border-gray-700 dark:bg-gray-800">
                <div class="flex items-center gap-3">

                    <div class="flex-1">
                        <p class="font-semibold text-amber-800 dark:text-gray-100">
                            Aktifkan Audio Adzan
                        </p>

                        <p class="mt-1 text-sm text-amber-700 dark:text-gray-400">
                            Klik tombol ini agar adzan dapat diputar otomatis.
                        </p>
                    </div>

                    <button type="button" class="shrink-0 rounded-lg bg-gray-900 px-4 py-2
                   text-sm font-semibold text-white
                   hover:bg-gray-700
                   dark:bg-gray-700 dark:hover:bg-gray-600" @click="enableAdzanAudio">
                        Aktifkan
                    </button>

                </div>
            </div>
            <RouterLink to="/audio-settings" class="rounded-lg bg-gray-900 block w-max mt-6 px-4 py-2 text-white">
                Pengaturan Audio
            </RouterLink>
            <div class="rounded-xl dark:bg-gray-950 bg-white p-4 shadow">
                <p class="mb-3 font-semibold dark:text-gray-100">
                    Test Audio Adzan
                </p>

                <div class="grid grid-cols-2 gap-2">
                    <button v-for="prayer in [
                        ['Fajr', 'Shubuh'],
                        ['Dhuhr', 'Dzuhur'],
                        ['Asr', 'Ashar'],
                        ['Maghrib', 'Maghrib'],
                        ['Isha', 'Isya'],
                    ]" :key="prayer[0]" type="button"
                        class="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium dark:text-gray-100" :class="playingPrayer === prayer[0]
                            ? 'bg-blue-900'
                            : 'bg-gray-900'
                            " @click="handleTestPrayer(prayer[0])">
                        Test {{ prayer[1] }}
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>
