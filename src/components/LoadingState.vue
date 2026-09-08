<script setup>
import { Loader2 } from '@lucide/vue'

defineProps({
    message: {
        type: String,
        default: 'Memuat jadwal salat...',
    },
})
</script>

<template>
    <div class="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 class="w-8 h-8 text-teal-500 animate-spin" aria-hidden="true" />
        <p class="text-sm text-gray-400 dark:text-gray-500 font-medium">
            {{ message }}
        </p>
    </div>
</template>
