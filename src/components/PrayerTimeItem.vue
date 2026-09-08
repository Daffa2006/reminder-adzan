<script setup>
import { Check, ChevronRight } from '@lucide/vue'

const props = defineProps({
    name: {
        type: String,
        required: true,
    },
    time: {
        type: String,
        default: '--:--',
    },
    status: {
        type: String,
        default: 'upcoming', // 'past' | 'next' | 'upcoming'
    },
})
</script>

<template>
    <div class="flex items-center justify-between px-4 py-3 rounded-xl transition-colors" :class="{
        'bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/40': status === 'next',
        'opacity-50': status === 'past',
    }" :aria-current="status === 'next' ? 'true' : undefined">
        <!-- Prayer name -->
        <div class="flex items-center gap-3">
            <!-- Status dot -->
            <div class="w-2 h-2 rounded-full flex-shrink-0" :class="{
                'bg-teal-500 dark:bg-teal-400': status === 'next',
                'bg-gray-300 dark:bg-gray-600': status === 'past',
                'bg-gray-200 dark:bg-gray-700': status === 'upcoming',
            }" aria-hidden="true"></div>

            <span class="font-semibold" :class="{
                'text-teal-700 dark:text-teal-300': status === 'next',
                'text-gray-400 dark:text-gray-400': status === 'past',
                'text-gray-700 dark:text-gray-200': status === 'upcoming',
            }">
                {{ name }}
            </span>
        </div>

        <!-- Right side: time + status icon -->
        <div class="flex items-center gap-3">
            <span class="text-sm font-semibold tabular-nums" :class="{
                'text-teal-700 dark:text-teal-300': status === 'next',
                'text-gray-400 dark:text-gray-500': status === 'past',
                'text-gray-600 dark:text-gray-400': status === 'upcoming',
            }">
                {{ time }}
            </span>

            <!-- Status icon -->
            <span class="w-5 flex items-center justify-center" aria-hidden="true">
                <Check v-if="status === 'past'" class="w-4 h-4 text-gray-300 dark:text-gray-600" />
                <ChevronRight v-else-if="status === 'next'" class="w-4 h-4 text-teal-500 dark:text-teal-400" />
            </span>
        </div>
    </div>
</template>
