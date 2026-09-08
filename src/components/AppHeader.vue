<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Settings, MapPin, Moon, Sun, Monitor } from '@lucide/vue'

const props = defineProps({
    locationName: {
        type: String,
        default: 'Mendeteksi lokasi...',
    },
    theme: {
        type: String,
        default: 'system',
    },
})

const emit = defineEmits(['toggleTheme'])
const router = useRouter()

const themeIcon = computed(() => {
    if (props.theme === 'light') return Sun
    if (props.theme === 'dark') return Moon
    return Monitor
})

function goToSettings() {
    router.push('/settings')
}
</script>

<template>
    <header class="flex items-center justify-between px-4 py-4 sm:px-6">
        <!-- Logo & App Name -->
        <div class="flex items-center gap-2">
            <span class="text-2xl" role="img" aria-label="Masjid">🕌</span>
            <span class="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
                Adzan
            </span>
        </div>

        <!-- Location -->
        <div class="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <MapPin class="w-3.5 h-3.5 flex-shrink-0" />
            <span class="truncate max-w-[200px]">{{ locationName }}</span>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
            <!-- Theme toggle -->
            <button @click="$emit('toggleTheme')" aria-label="Ganti tema"
                class="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <component :is="themeIcon" class="w-4 h-4" />
            </button>

            <!-- Settings -->
            <button @click="goToSettings" aria-label="Pengaturan"
                class="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Settings class="w-4 h-4" />
            </button>
        </div>
    </header>

    <!-- Mobile location bar -->
    <div class="flex sm:hidden items-center gap-1.5 px-4 pb-2 text-sm text-gray-500 dark:text-gray-400">
        <MapPin class="w-3.5 h-3.5 flex-shrink-0" />
        <span class="truncate">{{ locationName }}</span>
    </div>
</template>
