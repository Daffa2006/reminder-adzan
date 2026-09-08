<script setup>
import { ref, onUnmounted } from 'vue'
import { useSettings } from '@/composables/useSettings.js'
import { useAdzan } from '@/composables/useAdzan.js'

const { settings, updateSetting } = useSettings()

// Jadwal PALSU — hanya dipakai di halaman test, tidak menyentuh jadwal asli
const fakePrayerTimes = ref({})

const {
    isPlaying,
    startMonitor,
    stopMonitor,
    handleUserInteraction,
    resetTriggerHistory,
} = useAdzan(fakePrayerTimes, settings)

const audioUnlocked = ref(false)
const targetTime = ref('')
const selectedPrayer = ref('Subuh')
const monitorActive = ref(false)
const logs = ref([])

function log(msg) {
    const time = new Date().toLocaleTimeString('id-ID')
    logs.value.unshift(`[${time}] ${msg}`)
    if (logs.value.length > 50) logs.value.pop()
}

async function unlock() {
    const ok = await handleUserInteraction()
    audioUnlocked.value = ok
    log(ok ? '✅ Audio unlocked' : '❌ Gagal unlock audio')
}

const nowDisplay = ref(new Date().toLocaleTimeString('id-ID'))
let clockInterval = null
clockInterval = setInterval(() => {
    nowDisplay.value = new Date().toLocaleTimeString('id-ID')
}, 1000)

function startTest() {
    if (!targetTime.value) {
        log('⚠️ Isi dulu jam target, misal 07:46')
        return
    }

    if (!settings.value.adzanEnabled && !settings.value.notificationEnabled) {
        log('⚠️ adzanEnabled & notificationEnabled masih OFF — nyalakan dulu di bawah')
        return
    }

    resetTriggerHistory()

    fakePrayerTimes.value = { [selectedPrayer.value]: targetTime.value }

    log(`🎯 Jadwal palsu diset: ${selectedPrayer.value} = ${targetTime.value}`)
    log(`⏳ Monitor dimulai. Sekarang jam ${nowDisplay.value}, tunggu sampai ${targetTime.value}...`)

    startMonitor()
    monitorActive.value = true
}

function stopTest() {
    stopMonitor()
    monitorActive.value = false
    log('🛑 Monitor dihentikan manual')
}

onUnmounted(() => {
    if (clockInterval) clearInterval(clockInterval)
    stopMonitor()
})
</script>

<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
        <div class="mx-auto max-w-xl px-4 py-8 space-y-6">
            <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
                🧪 Test Realtime Adzan
            </h1>

            <!-- Jam sekarang -->
            <div
                class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-center">
                <p class="text-sm text-gray-500 dark:text-gray-400">Jam Sekarang</p>
                <p class="text-3xl font-mono font-bold text-gray-900 dark:text-gray-100">{{ nowDisplay }}</p>
            </div>

            <!-- Status settings -->
            <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
                <p class="font-semibold text-gray-900 dark:text-gray-100">Status Pengaturan</p>

                <label class="flex items-center justify-between">
                    <span class="text-gray-700 dark:text-gray-300">Adzan Enabled</span>
                    <input type="checkbox"
                        class="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 accent-gray-700 dark:accent-gray-400"
                        :checked="settings.adzanEnabled"
                        @change="updateSetting('adzanEnabled', $event.target.checked)" />
                </label>

                <label class="flex items-center justify-between">
                    <span class="text-gray-700 dark:text-gray-300">Notification Enabled</span>
                    <input type="checkbox"
                        class="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 accent-gray-700 dark:accent-gray-400"
                        :checked="settings.notificationEnabled"
                        @change="updateSetting('notificationEnabled', $event.target.checked)" />
                </label>

                <button v-if="!audioUnlocked" type="button"
                    class="w-full rounded-lg bg-gray-900 dark:bg-gray-100 px-4 py-2 text-white dark:text-gray-900 font-medium hover:bg-gray-800 dark:hover:bg-white transition-colors"
                    @click="unlock">
                    Unlock Audio Dulu
                </button>
                <p v-else class="text-sm text-gray-600 dark:text-gray-400">✅ Audio sudah unlocked</p>
            </div>

            <!-- Setup test -->
            <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
                <p class="font-semibold text-gray-900 dark:text-gray-100">Set Jadwal Palsu</p>

                <div class="flex gap-2">


                    <input v-model="targetTime" type="time"
                        class="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 disabled:opacity-50"
                        :disabled="monitorActive" />
                </div>

                <button v-if="!monitorActive" type="button"
                    class="w-full rounded-lg bg-gray-700 dark:bg-gray-200 px-4 py-2 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-600 dark:hover:bg-gray-300 transition-colors"
                    @click="startTest">
                    Mulai Monitor & Tunggu
                </button>
                <button v-else type="button"
                    class="w-full rounded-lg bg-gray-600 dark:bg-gray-300 px-4 py-2 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-500 dark:hover:bg-gray-400 transition-colors"
                    @click="stopTest">
                    Hentikan Monitor
                </button>

                <div v-if="isPlaying"
                    class="mt-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2 text-center">
                    <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">🔊 Adzan sedang diputar!</span>
                </div>
            </div>

            <!-- Log panel -->
            <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                <p class="font-semibold mb-2 text-gray-900 dark:text-gray-100">Log</p>
                <div
                    class="max-h-64 overflow-y-auto space-y-1 font-mono text-xs bg-gray-50 dark:bg-gray-950 rounded-lg p-3">
                    <p v-for="(l, i) in logs" :key="i" class="text-gray-600 dark:text-gray-400">
                        {{ l }}
                    </p>
                    <p v-if="logs.length === 0" class="text-gray-400 dark:text-gray-600 italic">Belum ada log</p>
                </div>
            </div>
        </div>
    </div>
</template>
