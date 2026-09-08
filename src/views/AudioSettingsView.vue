<script setup>
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { ArrowLeft, Music, Trash2, AlertCircle, CheckCircle2, Loader2 } from '@lucide/vue'
import FileUploaders from '@/components/FileUploaders.vue'
import { useAudioDB } from '@/composables/useAudioDB'

const router = useRouter()

const {
    insertAudio,
    getAllAudios,
    deleteAudio
} = useAudioDB()

const prayers = [
    { key: 'shubuh', name: 'Shubuh' },
    { key: 'dzuhur', name: 'Dzuhur' },
    { key: 'ashar', name: 'Ashar' },
    { key: 'maghrib', name: 'Maghrib' },
    { key: 'isya', name: 'Isya' },
]

/*
|--------------------------------------------------------------------------
| State
|--------------------------------------------------------------------------
*/

const audios = ref({})
const audioUrls = ref({})

const deletedPrayers = ref(new Set())

const saving = ref(false)
const loading = ref(true)

const saveMessage = ref('')
const errorMessage = ref('')


/*
|--------------------------------------------------------------------------
| Computed
|--------------------------------------------------------------------------
*/

// PENTING: hanya hitung entri yang benar-benar berupa draft baru (isDraft)
// atau ditandai untuk dihapus. audios.value juga berisi audio LAMA yang
// sudah tersimpan sejak loadAudios() — itu bukan "perubahan".
const hasChanges = computed(() => {
    return (
        Object.values(audios.value).some((audio) => audio?.isDraft) ||
        deletedPrayers.value.size > 0
    )
})


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function formatFileSize(bytes) {
    if (bytes === undefined || bytes === null) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}


/*
|--------------------------------------------------------------------------
| Load IndexedDB
|--------------------------------------------------------------------------
*/

const loadAudios = async () => {
    loading.value = true
    errorMessage.value = ''

    try {
        const data = await getAllAudios()

        data.forEach((audio) => {
            audios.value[audio.prayer] = audio
            audioUrls.value[audio.prayer] = URL.createObjectURL(audio.file)
        })
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Gagal memuat audio dari penyimpanan.'
    } finally {
        loading.value = false
    }
}


/*
|--------------------------------------------------------------------------
| Upload → Draft
|--------------------------------------------------------------------------
*/

const handleUpload = (prayer, file) => {
    errorMessage.value = ''
    saveMessage.value = ''

    if (audioUrls.value[prayer]) {
        URL.revokeObjectURL(audioUrls.value[prayer])
    }

    audios.value[prayer] = {
        prayer,
        name: file.name,
        type: file.type,
        size: file.size,
        file,
        isDraft: true,
    }

    audioUrls.value[prayer] = URL.createObjectURL(file)

    deletedPrayers.value.delete(prayer)
    deletedPrayers.value = new Set(deletedPrayers.value)
}


/*
|--------------------------------------------------------------------------
| Delete → Draft (bisa dibatalkan sebelum Save)
|--------------------------------------------------------------------------
*/

const handleDelete = (prayer) => {
    saveMessage.value = ''

    // Hanya DITANDAI dulu — data & preview TIDAK langsung dihapus,
    // supaya user masih bisa klik "Batalkan" sebelum benar-benar Save.
    deletedPrayers.value.add(prayer)
    deletedPrayers.value = new Set(deletedPrayers.value)
}

const cancelDelete = (prayer) => {
    deletedPrayers.value.delete(prayer)
    deletedPrayers.value = new Set(deletedPrayers.value)
}


/*
|--------------------------------------------------------------------------
| Batalkan Semua Perubahan
|--------------------------------------------------------------------------
*/

const discardChanges = async () => {
    // Revoke preview URL untuk draft yang belum tersimpan
    Object.entries(audios.value).forEach(([prayer, audio]) => {
        if (audio?.isDraft && audioUrls.value[prayer]) {
            URL.revokeObjectURL(audioUrls.value[prayer])
        }
    })

    audios.value = {}
    audioUrls.value = {}
    deletedPrayers.value = new Set()
    saveMessage.value = ''
    errorMessage.value = ''

    await loadAudios()
}


/*
|--------------------------------------------------------------------------
| Save All Changes
|--------------------------------------------------------------------------
*/

const handleSave = async () => {
    if (saving.value) return

    saving.value = true
    saveMessage.value = ''
    errorMessage.value = ''

    try {
        // 1. Hapus audio yang ditandai
        for (const prayer of deletedPrayers.value) {
            await deleteAudio(prayer)

            if (audioUrls.value[prayer]) {
                URL.revokeObjectURL(audioUrls.value[prayer])
            }

            delete audios.value[prayer]
            delete audioUrls.value[prayer]
        }

        // 2. Simpan HANYA audio yang berstatus draft (baru/pengganti)
        for (const prayer of prayers) {
            const audio = audios.value[prayer.key]

            if (!audio || !audio.isDraft) continue

            await insertAudio(prayer.key, audio.file)
        }

        deletedPrayers.value = new Set()

        Object.values(audios.value).forEach((audio) => {
            audio.isDraft = false
        })

        saveMessage.value = 'Perubahan audio berhasil disimpan.'
    } catch (error) {
        console.error(error)
        errorMessage.value = 'Gagal menyimpan perubahan. Silakan coba lagi.'
    } finally {
        saving.value = false
    }
}


/*
|--------------------------------------------------------------------------
| Proteksi Perubahan Belum Tersimpan
|--------------------------------------------------------------------------
*/

function handleBeforeUnload(event) {
    if (hasChanges.value) {
        event.preventDefault()
        event.returnValue = ''
    }
}

// Menangkap navigasi di dalam aplikasi (klik tombol kembali, dsb)
onBeforeRouteLeave(() => {
    if (hasChanges.value) {
        const confirmed = window.confirm(
            'Ada perubahan audio yang belum disimpan. Yakin ingin meninggalkan halaman ini?'
        )
        if (!confirmed) return false
    }
})

function goBack() {
    router.push('/')
}


/*
|--------------------------------------------------------------------------
| Lifecycle
|--------------------------------------------------------------------------
*/

onMounted(() => {
    loadAudios()
    window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    Object.values(audioUrls.value).forEach((url) => {
        URL.revokeObjectURL(url)
    })
})
</script>

<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 pb-12 transition-colors">

        <div class="w-full max-w-2xl mx-auto">

            <!-- Back button -->
            <div class="pt-6">
                <button @click="goBack" aria-label="Kembali ke dashboard"
                    class="inline-flex items-center gap-2 p-2 -ml-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ArrowLeft class="w-4 h-4" />
                    <span class="text-sm font-medium">Kembali</span>
                </button>
            </div>

            <!-- Header -->
            <div class="pb-8 pt-4 text-center">
                <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Audio Adzan
                </h1>
                <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Atur audio yang digunakan untuk setiap waktu salat.
                </p>
            </div>

            <!-- Loading -->
            <div v-if="loading"
                class="flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-gray-500 dark:text-gray-400">
                <Loader2 class="w-4 h-4 animate-spin" />
                Memuat audio...
            </div>

            <!-- Content -->
            <div v-else class="flex flex-col gap-6">

                <div v-for="prayer in prayers" :key="prayer.key"
                    class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">

                    <!-- Prayer name -->
                    <div class="flex items-center justify-between">
                        <h2 class="font-semibold text-lg text-gray-900 dark:text-gray-100">
                            {{ prayer.name }}
                        </h2>
                        <span v-if="audios[prayer.key]?.isDraft"
                            class="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-lg">
                            Belum disimpan
                        </span>
                    </div>

                    <!-- Akan dihapus -->
                    <div v-if="deletedPrayers.has(prayer.key)"
                        class="mt-4 flex items-center justify-between gap-3 rounded-xl border border-dashed border-rose-300 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-900/20 px-4 py-3">
                        <p class="text-sm text-rose-600 dark:text-rose-400">
                            Audio ini akan dihapus setelah disimpan.
                        </p>
                        <button type="button"
                            class="shrink-0 text-sm font-semibold text-rose-700 dark:text-rose-300 hover:underline"
                            @click="cancelDelete(prayer.key)">
                            Batalkan
                        </button>
                    </div>

                    <!-- Current audio -->
                    <div v-else-if="audios[prayer.key]" class="mt-4 flex flex-col gap-3">
                        <div
                            class="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-3 py-2.5">
                            <Music class="w-4 h-4 shrink-0 text-gray-400 dark:text-gray-500" />
                            <div class="min-w-0 flex-1">
                                <p class="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {{ audios[prayer.key].name }}
                                </p>
                                <p class="text-xs text-gray-400 dark:text-gray-500">
                                    {{ formatFileSize(audios[prayer.key].size) }}
                                </p>
                            </div>
                        </div>

                        <audio v-if="audioUrls[prayer.key]" :src="audioUrls[prayer.key]" controls class="w-full h-10" />

                        <button type="button"
                            class="self-start inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                            @click="handleDelete(prayer.key)">
                            <Trash2 class="w-4 h-4" />
                            Hapus audio
                        </button>
                    </div>

                    <!-- Upload -->
                    <div class="mt-4">
                        <FileUploaders :input-id="`file-${prayer.key}`" :current-audio="audios[prayer.key]"
                            :current-audio-url="audioUrls[prayer.key]" @upload="handleUpload(prayer.key, $event)" />
                    </div>

                </div>

                <!-- Error -->
                <div v-if="errorMessage"
                    class="flex items-start gap-2 rounded-xl border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-900/20 p-4 text-sm text-rose-700 dark:text-rose-400">
                    <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
                    {{ errorMessage }}
                </div>

                <!-- Success -->
                <div v-if="saveMessage"
                    class="flex items-start gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/20 p-4 text-sm text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 class="w-4 h-4 shrink-0 mt-0.5" />
                    {{ saveMessage }}
                </div>

                <!-- Save -->
                <div
                    class="sticky bottom-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 p-4 shadow-lg backdrop-blur">

                    <div class="flex items-center justify-between gap-4">

                        <div class="min-w-0">
                            <p class="font-semibold text-gray-900 dark:text-gray-100">
                                {{ hasChanges ? 'Ada perubahan' : 'Semua perubahan tersimpan' }}
                            </p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">
                                {{ hasChanges
                                    ? 'Simpan perubahan agar diterapkan.'
                                    : 'Tidak ada perubahan yang perlu disimpan.'
                                }}
                            </p>
                        </div>

                        <div class="flex shrink-0 items-center gap-2">
                            <button v-if="hasChanges" type="button" :disabled="saving"
                                class="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40 transition"
                                @click="discardChanges">
                                Batalkan
                            </button>

                            <button type="button" :disabled="!hasChanges || saving"
                                class="inline-flex items-center gap-2 rounded-xl bg-gray-900 dark:bg-gray-100 px-5 py-3 font-semibold text-white dark:text-gray-900 transition hover:bg-gray-800 dark:hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                                @click="handleSave">
                                <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
                                {{ saving ? 'Menyimpan...' : 'Simpan Perubahan' }}
                            </button>
                        </div>

                    </div>

                </div>

            </div>

        </div>

    </div>
</template>
