<script setup>
import { computed } from 'vue'
import { Wifi, WifiOff, RefreshCw } from '@lucide/vue'
import { formatRelativeTime } from '@/lib/utils.js'

const props = defineProps({
    isFromCache: {
        type: Boolean,
        default: false,
    },
    lastUpdated: {
        type: Date,
        default: null,
    },
    loading: {
        type: Boolean,
        default: false,
    },
    error: {
        type: String,
        default: null,
    },
})

const emit = defineEmits(['refresh'])

const statusText = computed(() => {
    if (props.loading) return 'Memperbarui...'
    if (props.error && props.isFromCache) return 'Offline · Menampilkan jadwal tersimpan'
    if (props.isFromCache && props.lastUpdated) return `Tersimpan · ${formatRelativeTime(props.lastUpdated)}`
    if (props.lastUpdated) return `Diperbarui ${formatRelativeTime(props.lastUpdated)}`
    return ''
})

const icon = computed(() => {
    if (props.loading) return RefreshCw
    if (props.isFromCache || props.error) return WifiOff
    return Wifi
})

const iconClass = computed(() => {
    if (props.loading) return 'text-gray-400 animate-spin'
    if (props.isFromCache || props.error) return 'text-amber-400'
    return 'text-teal-500'
})
</script>

<template>
    <div v-if="statusText" class="flex items-center justify-between gap-2 px-1">
        <div class="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <component :is="icon" :class="['w-3 h-3', iconClass]" aria-hidden="true" />
            <span>{{ statusText }}</span>
        </div>

        <button v-if="!loading" @click="$emit('refresh')" aria-label="Perbarui jadwal"
            class="text-xs text-gray-400 dark:text-gray-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium">
            Perbarui
        </button>
    </div>
</template>
