<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
    ArrowLeft, MapPin, Save, Bell, Volume2, Palette,
    Sun, Moon, Monitor, Check, AlertCircle, Loader2,
} from '@lucide/vue'
import { useSettings } from '@/composables/useSettings.js'
import { useAuth } from '@/composables/useAuth.js'
import { useLocation } from '@/composables/useLocation.js'
import { usePrayerTimes } from '@/composables/usePrayerTimes.js'
import { CALCULATION_METHODS, MADHAB_OPTIONS } from '@/services/aladhan.js'

const router = useRouter()
const { settings, saveSettings } = useSettings()
const { user } = useAuth()
const { coords, detectLocation, setLocation } = useLocation()
const { fetchPrayerTimes } = usePrayerTimes()

const THEME_OPTIONS = [
    { value: 'light', label: 'Terang', icon: Sun },
    { value: 'dark', label: 'Gelap', icon: Moon },
    { value: 'system', label: 'Sistem', icon: Monitor },
]

const form = reactive({
    locationName: '',
    latitude: 0,
    longitude: 0,
    calculationMethod: 20,
    madhab: 0,
    notificationEnabled: false,
    adzanEnabled: false,
    volume: 80,
    theme: 'system',
})

const saved = ref(false)
const saving = ref(false)
const saveError = ref('')

const detectingLocation = ref(false)
const locationError = ref('')

onMounted(() => {
    Object.assign(form, settings.value)
})

async function handleDetectLocation() {
    locationError.value = ''
    detectingLocation.value = true

    try {
        const loc = await detectLocation()

        if (loc) {
            form.locationName = loc.locationName
            form.latitude = loc.latitude
            form.longitude = loc.longitude
        } else {
            locationError.value = 'Lokasi tidak dapat dideteksi. Pastikan izin lokasi browser diizinkan, atau isi lokasi secara manual di bawah.'
        }
    } catch (error) {
        locationError.value = `Gagal mendeteksi lokasi: ${error?.message ?? 'terjadi kesalahan tak terduga.'}`
    } finally {
        detectingLocation.value = false
    }
}

async function handleSave() {
    saving.value = true
    saveError.value = ''

    try {
        await saveSettings({ ...form }, user.value)

        setLocation({
            locationName: form.locationName,
            latitude: form.latitude,
            longitude: form.longitude,
        })

        // Refresh jadwal salat dari API dengan lokasi/metode terbaru
        await fetchPrayerTimes(form.latitude, form.longitude, form.calculationMethod, form.madhab, true)

        saved.value = true
        setTimeout(() => {
            saved.value = false
        }, 2000)
    } catch (error) {
        saveError.value = `Gagal menyimpan pengaturan: ${error?.message ?? 'terjadi kesalahan, coba lagi.'}`
    } finally {
        saving.value = false
    }
}

function goBack() {
    router.push('/')
}

watch(() => form.theme, (newTheme) => {
    applyTheme(newTheme)
})

function applyTheme(theme) {
    const html = document.documentElement
    if (theme === 'dark') {
        html.classList.add('dark')
    } else if (theme === 'light') {
        html.classList.remove('dark')
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        html.classList.toggle('dark', prefersDark)
    }
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div class="max-w-2xl mx-auto px-0 sm:px-4">
            <!-- Header -->
            <header class="flex items-center gap-3 px-4 py-4">
                <button @click="goBack" aria-label="Kembali ke dashboard"
                    class="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ArrowLeft class="w-4 h-4" />
                </button>
                <h1 class="text-lg font-bold text-gray-800 dark:text-gray-100">Pengaturan</h1>
            </header>

            <main class="flex flex-col gap-4 px-4 pb-8">

                <!-- Location Section -->
                <section
                    class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                    <div class="flex items-center gap-2 mb-4">
                        <MapPin class="w-4 h-4 text-gray-400" />
                        <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Lokasi</h2>
                    </div>

                    <div class="flex flex-col gap-3">
                        <div>
                            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Nama Lokasi
                            </label>
                            <input v-model="form.locationName" type="text" placeholder="Jakarta, Indonesia"
                                class="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition" />
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Latitude
                                </label>
                                <input v-model.number="form.latitude" type="number" step="0.0001" placeholder="-6.2088"
                                    class="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition" />
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Longitude
                                </label>
                                <input v-model.number="form.longitude" type="number" step="0.0001"
                                    placeholder="106.8456"
                                    class="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition" />
                            </div>
                        </div>

                        <button @click="handleDetectLocation" :disabled="detectingLocation"
                            class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition">
                            <Loader2 v-if="detectingLocation" class="w-4 h-4 animate-spin" />
                            <MapPin v-else class="w-4 h-4" />
                            {{ detectingLocation ? 'Mendeteksi...' : 'Deteksi Lokasi Otomatis' }}
                        </button>

                        <p v-if="locationError"
                            class="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 rounded-lg px-3 py-2">
                            <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
                            {{ locationError }}
                        </p>
                    </div>
                </section>

                <!-- Prayer Calculation Section -->
                <section
                    class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                    <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Metode Perhitungan</h2>

                    <div class="flex flex-col gap-3">
                        <div>
                            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Metode Kalkulasi
                            </label>
                            <select v-model.number="form.calculationMethod"
                                class="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition">
                                <option v-for="method in CALCULATION_METHODS" :key="method.value" :value="method.value">
                                    {{ method.label }}
                                </option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Mazhab (Waktu Ashar)
                            </label>
                            <select v-model.number="form.madhab"
                                class="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition">
                                <option v-for="opt in MADHAB_OPTIONS" :key="opt.value" :value="opt.value">
                                    {{ opt.label }}
                                </option>
                            </select>
                        </div>
                    </div>
                </section>

                <!-- Adzan Section -->
                <section
                    class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                    <div class="flex items-center gap-2 mb-4">
                        <Bell class="w-4 h-4 text-gray-400" />
                        <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Adzan & Notifikasi</h2>
                    </div>

                    <div class="flex flex-col gap-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Notifikasi</p>
                                <p class="text-xs text-gray-400 dark:text-gray-500">Tampilkan notifikasi saat waktu
                                    salat</p>
                            </div>
                            <button @click="form.notificationEnabled = !form.notificationEnabled"
                                :aria-checked="form.notificationEnabled" role="switch"
                                :aria-label="form.notificationEnabled ? 'Matikan notifikasi' : 'Aktifkan notifikasi'"
                                class="relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                                :class="form.notificationEnabled ? 'bg-teal-500' : 'bg-gray-200 dark:bg-gray-700'">
                                <span class="block w-4 h-4 bg-white rounded-full shadow-sm transition-transform"
                                    :class="form.notificationEnabled ? 'translate-x-6' : 'translate-x-1'"></span>
                            </button>
                        </div>

                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Suara Adzan</p>
                                <p class="text-xs text-gray-400 dark:text-gray-500">Mainkan adzan saat waktu salat
                                    tiba</p>
                            </div>
                            <button @click="form.adzanEnabled = !form.adzanEnabled" :aria-checked="form.adzanEnabled"
                                role="switch"
                                :aria-label="form.adzanEnabled ? 'Matikan suara adzan' : 'Aktifkan suara adzan'"
                                class="relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                                :class="form.adzanEnabled ? 'bg-teal-500' : 'bg-gray-200 dark:bg-gray-700'">
                                <span class="block w-4 h-4 bg-white rounded-full shadow-sm transition-transform"
                                    :class="form.adzanEnabled ? 'translate-x-6' : 'translate-x-1'"></span>
                            </button>
                        </div>

                        <div v-if="form.adzanEnabled">
                            <div class="flex items-center gap-2 mb-2">
                                <Volume2 class="w-4 h-4 text-gray-400" />
                                <label class="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Volume: {{ form.volume }}%
                                </label>
                            </div>
                            <input v-model.number="form.volume" type="range" min="0" max="100"
                                class="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700 accent-teal-500"
                                aria-label="Volume adzan" />
                        </div>
                    </div>
                </section>

                <!-- Appearance Section
                <section
                    class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                    <div class="flex items-center gap-2 mb-4">
                        <Palette class="w-4 h-4 text-gray-400" />
                        <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Tampilan</h2>
                    </div>

                    <div class="grid grid-cols-3 gap-2">
                        <button v-for="option in THEME_OPTIONS" :key="option.value" @click="form.theme = option.value"
                            :aria-pressed="form.theme === option.value"
                            class="flex flex-col items-center gap-1.5 py-3 px-3 text-sm rounded-xl border transition-colors font-medium"
                            :class="form.theme === option.value
                                ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                ">
                            <component :is="option.icon" class="w-4 h-4" />
                            {{ option.label }}
                        </button>
                    </div>
                </section>


                <section
                    class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                    <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Akun</h2>
                    <p v-if="user" class="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Masuk sebagai: {{ user.email }}
                    </p>
                    <p v-else class="text-xs text-gray-400 dark:text-gray-500 mb-3">
                        Mode tamu — pengaturan disimpan secara lokal
                    </p>
                    <router-link v-if="!user" to="/login"
                        class="inline-block text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline">
                        Masuk / Daftar
                    </router-link>
                </section>

         <--Save error -->
                <p v-if="saveError"
                    class="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 rounded-xl px-4 py-3">
                    <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
                    {{ saveError }}
                </p>

                <!-- Save Button -->
                <button @click="handleSave" :disabled="saving"
                    class="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-semibold text-sm transition-colors shadow-sm">
                    <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
                    <Check v-else-if="saved" class="w-4 h-4" />
                    <Save v-else class="w-4 h-4" />
                    {{ saving ? 'Menyimpan...' : saved ? 'Tersimpan' : 'Simpan Pengaturan' }}
                </button>
            </main>
        </div>
    </div>
</template>
