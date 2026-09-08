<script setup>
import { computed } from 'vue'
import { Clock } from '@lucide/vue'

const props = defineProps({
    nextPrayer: {
        type: Object,
        default: null,
    },
    countdown: {
        type: String,
        default: '--:--:--',
    },
    progress: {
        type: Number,
        default: 0,
    },
    loading: {
        type: Boolean,
        default: false,
    },
})

const progressStyle = computed(() => ({
    width: `${props.progress}%`,
}))
</script>

<template>
    <div
        class="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-4">
        <!-- Label -->
        <div class="flex items-center gap-2">
            <Clock class="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span class="md:text-base text-sm font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase">
                Salat Berikutnya
            </span>
        </div>

        <!-- Loading skeleton -->
        <template v-if="loading && !nextPrayer">
            <div class="flex flex-col gap-2 animate-pulse">
                <div class="h-8 w-32 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
                <div class="h-6 w-20 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
                <div class="h-12 w-44 bg-gray-100 dark:bg-gray-800 rounded-lg mt-2"></div>
            </div>
        </template>

        <!-- Content -->
        <template v-else-if="nextPrayer">
            <div class="flex items-end justify-between">
                <div>
                    <!-- Prayer name -->
                    <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-100">
                        {{ nextPrayer.name }}
                        <span v-if="nextPrayer.isTomorrow"
                            class="text-sm font-medium text-gray-400 dark:text-gray-500 ml-1">
                            (Besok)
                        </span>
                    </h2>
                    <!-- Prayer time -->
                    <p class="text-lg font-semibold text-gray-400 dark:text-gray-500 mt-0.5 tabular-nums">
                        {{ nextPrayer.time }}
                    </p>
                </div>

                <!-- Countdown -->
                <div class="text-right">
                    <p class="text-sm font-medium text-gray-400 dark:text-gray-500 mb-1">Mulai dalam</p>
                    <p class="text-2xl font-bold text-teal-600 dark:text-teal-400 tabular-nums tracking-tight">
                        {{ countdown }}
                    </p>
                </div>
            </div>

            <!-- Progress Bar -->
            <div class="mt-2">
                <div class="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div class="h-full bg-teal-500 dark:bg-teal-400 rounded-full transition-all duration-1000"
                        :style="progressStyle" role="progressbar" :aria-valuenow="Math.round(progress)"
                        aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </div>
        </template>

        <!-- No data state -->
        <template v-else>
            <div class="flex flex-col items-center justify-center py-4 text-gray-400 dark:text-gray-500">
                <Clock class="w-8 h-8 mb-2 opacity-50" />
                <p class="text-sm">Jadwal belum tersedia</p>
            </div>
        </template>
    </div>
</template>
