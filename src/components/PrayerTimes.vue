<script setup>
import PrayerTimeItem from './PrayerTimeItem.vue'
import { PRAYER_ORDER } from '@/lib/utils.js'

const props = defineProps({
    prayerTimes: {
        type: Object,
        default: null,
    },
    prayerStatuses: {
        type: Object,
        default: () => ({}),
    },
    loading: {
        type: Boolean,
        default: false,
    },
    isFromCache: {
        type: Boolean,
        default: false,
    },
})
</script>

<template>
    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4">
        <!-- Header -->
        <div class="flex items-center justify-between mb-3 px-1">
            <h3 class="font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase">
                Jadwal Salat
            </h3>
            <span v-if="isFromCache" class="text-amber-500 dark:text-amber-400 font-medium"
                title="Menggunakan data tersimpan">
                Tersimpan
            </span>
        </div>

        <!-- Loading skeleton -->
        <div v-if="loading && !prayerTimes" class="flex flex-col gap-1 animate-pulse">
            <div v-for="i in 7" :key="i" class="h-11 bg-gray-50 dark:bg-gray-800 rounded-xl"></div>
        </div>

        <!-- Prayer list -->
        <div v-else-if="prayerTimes" class="flex flex-col gap-1">
            <PrayerTimeItem v-for="name in PRAYER_ORDER" :key="name" :name="name" :time="prayerTimes[name] || '--:--'"
                :status="prayerStatuses[name] || 'upcoming'" />
        </div>

        <!-- Empty state -->
        <div v-else class="py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
            Jadwal salat tidak tersedia
        </div>
    </div>
</template>
