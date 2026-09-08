<script setup>
import { computed } from 'vue'
import { formatHijriDate } from '@/lib/utils.js'

const props = defineProps({
    timeString: {
        type: String,
        default: '--:--:--',
    },
    dateString: {
        type: String,
        default: '',
    },
    hijriDate: {
        type: Object,
        default: null,
    },
})

const hijriDisplay = computed(() => {
    if (!props.hijriDate) return ''
    return formatHijriDate(props.hijriDate)
})
</script>

<template>
    <div class="flex flex-col items-center py-6 select-none">
        <!-- Digital Clock -->
        <div class="text-5xl sm:text-6xl font-bold text-gray-800 dark:text-gray-100 tabular-nums tracking-tight"
            aria-live="polite" aria-label="Waktu sekarang">
            {{ timeString }}
        </div>

        <!-- Gregorian Date -->
        <p class="mt-3 text-sm sm:text-base font-medium text-gray-500 dark:text-gray-400 capitalize">
            {{ dateString }}
        </p>

        <!-- Hijri Date -->
        <p v-if="hijriDisplay" class="mt-1 text-sm font-medium text-gray-400 dark:text-gray-500">
            {{ hijriDisplay }}
        </p>
        <div v-else class="mt-1 h-5 w-36 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" aria-hidden="true">
        </div>
    </div>
</template>
