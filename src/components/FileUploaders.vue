<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'

const props = defineProps({
    inputId: {
        type: String,
        required: true
    },

    currentAudio: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['upload'])

const selectedFile = ref(null)
const previewUrl = ref(null)
const error = ref('')

const displayedAudio = computed(() => {
    if (selectedFile.value && previewUrl.value) {
        return {
            file: selectedFile.value,
            url: previewUrl.value,
            isDraft: true
        }
    }

    if (props.currentAudio) {
        return {
            file: props.currentAudio.file,
            url: props.currentAudio.url,
            isDraft: false
        }
    }

    return null
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

    // Hapus preview draft sebelumnya
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value)
    }

    selectedFile.value = file
    previewUrl.value = URL.createObjectURL(file)

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

onBeforeUnmount(() => {
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value)
    }
})
</script>

<template>
    <div class="flex flex-col gap-3">

        <!-- Current / selected audio -->
        <div v-if="displayedAudio" class="rounded-xl border p-4" :class="displayedAudio.isDraft
                ? 'border-amber-200 bg-amber-50'
                : 'border-gray-200 bg-gray-50'
            ">
            <div class="flex items-start gap-3">

                <!-- Audio icon -->
                <div class="flex size-10 shrink-0 items-center justify-center rounded-lg" :class="displayedAudio.isDraft
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                    ">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                        stroke="currentColor" class="size-5">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M9 9l10.5-3v10.5A2.25 2.25 0 0117.25 18a2.25 2.25 0 01-2.25-2.25v-.75a2.25 2.25 0 012.25-2.25c.792 0 1.5.408 1.908 1.026M9 9v9.75A2.25 2.25 0 016.75 21 2.25 2.25 0 014.5 18.75V18a2.25 2.25 0 012.25-2.25c.792 0 1.5.408 1.908 1.026M9 9l10.5-3" />
                    </svg>
                </div>

                <div class="min-w-0 flex-1">

                    <div class="flex items-start justify-between gap-3">

                        <div class="min-w-0">
                            <p class="truncate font-semibold text-gray-900">
                                {{ displayedAudio.file.name }}
                            </p>

                            <p class="mt-1 text-xs text-gray-500">
                                {{ formatFileSize(displayedAudio.file.size) }}
                                ·
                                {{ displayedAudio.file.type }}
                            </p>
                        </div>

                        <span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium" :class="displayedAudio.isDraft
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
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
        <div v-else class="rounded-xl border border-dashed border-gray-300 p-4 text-center">
            <p class="text-sm text-gray-500">
                Belum ada audio
            </p>
        </div>


        <!-- Upload / replace -->
        <label :for="inputId"
            class="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-5 text-gray-900 transition hover:border-gray-400 hover:bg-gray-50">
            <div class="flex items-center justify-center gap-3">

                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                    stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5A2.25 2.25 0 006.75 19.5h7.5A2.25 2.25 0 0016.5 17.25v-7.5A2.25 2.25 0 0014.25 7.5h-.75m0-3-3-3m0 0-3 3m3-3v11.25m6-2.25h.75A2.25 2.25 0 0121 15.75v4.5A2.25 2.25 0 0118.75 22.5h-7.5A2.25 2.25 0 019 20.25v-.75" />
                </svg>

                <div>
                    <p class="font-semibold">
                        {{ displayedAudio ? 'Ganti audio' : 'Upload audio' }}
                    </p>

                    <p class="text-xs text-gray-500">
                        MP3, WAV, OGG, atau format audio lainnya
                    </p>
                </div>

            </div>

            <input :id="inputId" type="file" class="sr-only" accept="audio/*" @change="handleFileChange" />
        </label>


        <!-- Error -->
        <div v-if="error" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {{ error }}
        </div>

    </div>
</template>
