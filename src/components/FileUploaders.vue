<script setup>
import { ref, computed } from 'vue'
import { Music, UploadCloud, AlertCircle } from '@lucide/vue'

const props = defineProps({
    inputId: {
        type: String,
        required: true
    },

    currentAudio: {
        type: Object,
        default: null
    },

    // Blob URL untuk audio yang SUDAH tersimpan — dibuat & di-revoke oleh
    // parent (AudioAdzanPage), bukan di sini. Ini memastikan hanya ada SATU
    // sumber kebenaran untuk URL preview, jadi statusnya (draft/tersimpan)
    // selalu sinkron begitu parent selesai menyimpan.
    currentAudioUrl: {
        type: String,
        default: null
    }
})

const emit = defineEmits(['upload'])

const error = ref('')

const displayedAudio = computed(() => {
    if (!props.currentAudio || !props.currentAudioUrl) return null

    return {
        file: props.currentAudio.file,
        url: props.currentAudioUrl,
        isDraft: !!props.currentAudio.isDraft
    }
})

const handleFileChange = (event) => {
    const file = event.target.files[0]

    if (!file) return

    error.value = ''

    if (!file.type.startsWith('audio/')) {
        error.value = 'File harus berupa audio.'
        event.target.value = ''
        return
    }

    // Serahkan sepenuhnya ke parent — biar parent yang membuat blob URL
    // draft-nya. Supaya file yang sama tidak punya dua blob URL berbeda
    // (satu di sini, satu di parent) yang siklus hidupnya bisa tidak sinkron.
    emit('upload', file)

    // Supaya file yang sama bisa dipilih lagi
    event.target.value = ''
}

const formatFileSize = (bytes) => {
    if (bytes < 1024) {
        return `${bytes} B`
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
    <div class="flex flex-col gap-3">

        <!-- Current / selected audio -->
        <div v-if="displayedAudio" class="rounded-xl border p-4" :class="displayedAudio.isDraft
            ? 'border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20'
            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60'
            ">
            <div class="flex items-start gap-3">

                <!-- Audio icon -->
                <div class="flex size-10 shrink-0 items-center justify-center rounded-lg" :class="displayedAudio.isDraft
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    ">
                    <Music class="size-5" />
                </div>

                <div class="min-w-0 flex-1">

                    <div class="flex items-start justify-between gap-3">

                        <div class="min-w-0">
                            <p class="truncate font-semibold text-gray-900 dark:text-gray-100">
                                {{ displayedAudio.file.name }}
                            </p>

                            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {{ formatFileSize(displayedAudio.file.size) }}
                                ·
                                {{ displayedAudio.file.type }}
                            </p>
                        </div>

                        <span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium" :class="displayedAudio.isDraft
                            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                            : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                            ">
                            {{
                                displayedAudio.isDraft
                                    ? 'Belum disimpan'
                                    : 'Tersimpan'
                            }}
                        </span>

                    </div>

                    <!-- Audio preview -->
                    <audio :src="displayedAudio.url" controls class="mt-3 w-full" />

                </div>
            </div>
        </div>

        <!-- Empty state -->
        <div v-else class="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-4 text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">
                Belum ada audio
            </p>
        </div>

        <!-- Upload / replace -->
        <label :for="inputId"
            class="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-5 text-gray-900 dark:text-gray-100 transition hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/60">
            <div class="flex items-center justify-center gap-3">

                <UploadCloud class="size-6 text-gray-500 dark:text-gray-400" />

                <div>
                    <p class="font-semibold">
                        {{ displayedAudio ? 'Ganti audio' : 'Upload audio' }}
                    </p>

                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        MP3, WAV, OGG, atau format audio lainnya
                    </p>
                </div>

            </div>

            <input :id="inputId" type="file" class="sr-only" accept="audio/*" @change="handleFileChange" />
        </label>

        <!-- Error -->
        <div v-if="error"
            class="flex items-start gap-2 rounded-xl border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-900/20 px-4 py-3 text-sm text-rose-700 dark:text-rose-400">
            <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
            {{ error }}
        </div>

    </div>
</template>
