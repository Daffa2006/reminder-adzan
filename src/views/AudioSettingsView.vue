<script setup>
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import FileUploaders from '@/components/FileUploaders.vue'
import { useAudioDB } from '@/composables/useAudioDB'

const {
    insertAudio,
    getAllAudios,
    deleteAudio
} = useAudioDB()

const prayers = [
    {
        key: 'shubuh',
        name: 'Shubuh'
    },
    {
        key: 'dzuhur',
        name: 'Dzuhur'
    },
    {
        key: 'ashar',
        name: 'Ashar'
    },
    {
        key: 'maghrib',
        name: 'Maghrib'
    },
    {
        key: 'isya',
        name: 'Isya'
    }
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

const hasChanges = computed(() => {
    return (
        Object.keys(audios.value).length > 0 ||
        deletedPrayers.value.size > 0
    )
})


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

            audioUrls.value[audio.prayer] =
                URL.createObjectURL(audio.file)
        })
    } catch (error) {
        console.error(error)

        errorMessage.value =
            'Gagal memuat audio dari penyimpanan.'
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

    // Hapus URL preview lama
    if (audioUrls.value[prayer]) {
        URL.revokeObjectURL(audioUrls.value[prayer])
    }

    // Masukkan ke draft
    audios.value[prayer] = {
        prayer,
        name: file.name,
        type: file.type,
        size: file.size,
        file,
        isDraft: true
    }

    // Buat preview
    audioUrls.value[prayer] =
        URL.createObjectURL(file)

    // Kalau sebelumnya ditandai delete,
    // batalkan delete
    deletedPrayers.value.delete(prayer)

    // Trigger reactivity Set
    deletedPrayers.value =
        new Set(deletedPrayers.value)
}


/*
|--------------------------------------------------------------------------
| Delete → Draft
|--------------------------------------------------------------------------
*/

const handleDelete = (prayer) => {
    saveMessage.value = ''

    if (audioUrls.value[prayer]) {
        URL.revokeObjectURL(audioUrls.value[prayer])
    }

    delete audioUrls.value[prayer]

    /*
     * Jangan langsung delete IndexedDB.
     * Tandai dulu sebagai akan dihapus.
     */
    deletedPrayers.value.add(prayer)

    deletedPrayers.value =
        new Set(deletedPrayers.value)

    delete audios.value[prayer]
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
        /*
         * 1. Delete audio yang ditandai
         */
        for (const prayer of deletedPrayers.value) {
            await deleteAudio(prayer)
        }

        /*
         * 2. Simpan audio baru / pengganti
         */
        for (const prayer of prayers) {
            const audio = audios.value[prayer.key]

            if (!audio) continue

            await insertAudio(
                prayer.key,
                audio.file
            )
        }

        /*
         * 3. Bersihkan state draft
         */
        deletedPrayers.value = new Set()

        /*
         * 4. Tandai semua sebagai tersimpan
         */
        Object.values(audios.value).forEach((audio) => {
            audio.isDraft = false
        })

        saveMessage.value =
            'Perubahan audio berhasil disimpan.'
    } catch (error) {
        console.error(error)

        errorMessage.value =
            'Gagal menyimpan perubahan. Silakan coba lagi.'
    } finally {
        saving.value = false
    }
}


/*
|--------------------------------------------------------------------------
| Lifecycle
|--------------------------------------------------------------------------
*/

onMounted(() => {
    loadAudios()
})

onBeforeUnmount(() => {
    Object.values(audioUrls.value).forEach((url) => {
        URL.revokeObjectURL(url)
    })
})
</script>

<template>
    <div class="min-h-screen bg-gray-50 px-4 pb-12">

        <div class="w-full max-w-2xl mx-auto">

            <!-- Header -->
            <div class="py-12 text-center">
                <h1 class="text-3xl font-bold text-gray-900">
                    Audio Adzan
                </h1>

                <p class="mt-2 text-sm text-gray-500">
                    Atur audio yang digunakan untuk setiap waktu salat.
                </p>
            </div>


            <!-- Loading -->
            <div v-if="loading" class="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500">
                Memuat audio...
            </div>


            <!-- Content -->
            <div v-else class="flex flex-col gap-6">

                <div v-for="prayer in prayers" :key="prayer.key"
                    class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

                    <!-- Prayer name -->
                    <div class="flex items-center justify-between">
                        <h2 class="font-semibold text-lg text-gray-900">
                            {{ prayer.name }}
                        </h2>
                    </div>


                    <!-- Current audio -->
                    <div v-if="audios[prayer.key]" class="mt-4 flex flex-col gap-3">
                        <!-- Delete -->
                        <button type="button"
                            class="self-start rounded-xl px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                            @click="handleDelete(prayer.key)">
                            Hapus audio
                        </button>
                    </div>

                    <!-- Upload -->
                    <div class="mt-4">
                        <FileUploaders :input-id="`file-${prayer.key}`" :current-audio="audios[prayer.key]"
                            @upload="handleUpload(prayer.key, $event)" />
                    </div>

                </div>


                <!-- Error -->
                <div v-if="errorMessage" class="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    {{ errorMessage }}
                </div>


                <!-- Success -->
                <div v-if="saveMessage"
                    class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                    {{ saveMessage }}
                </div>


                <!-- Save -->
                <div class="sticky bottom-4 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur">

                    <div class="flex items-center justify-between gap-4">

                        <div class="min-w-0">
                            <p class="font-semibold text-gray-900">
                                {{ hasChanges
                                    ? 'Ada perubahan'
                                    : 'Semua perubahan tersimpan'
                                }}
                            </p>

                            <p class="text-xs text-gray-500">
                                {{
                                    hasChanges
                                        ? 'Simpan perubahan agar diterapkan.'
                                        : 'Tidak ada perubahan yang perlu disimpan.'
                                }}
                            </p>
                        </div>

                        <button type="button" :disabled="!hasChanges || saving"
                            class="shrink-0 rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                            @click="handleSave">
                            {{ saving ? 'Menyimpan...' : 'Save Changes' }}
                        </button>

                    </div>

                </div>

            </div>

        </div>

    </div>
</template>
