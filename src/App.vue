<script setup>
import { onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useSettings } from '@/composables/useSettings.js'
import { useAuth } from '@/composables/useAuth.js'

const { settings, initSettings } = useSettings()
const { user, initAuth } = useAuth()

/**
 * Apply theme class to <html> element
 */
function applyTheme(theme) {
  const html = document.documentElement
  if (theme === 'dark') {
    html.classList.add('dark')
  } else if (theme === 'light') {
    html.classList.remove('dark')
  } else {
    // system — follow OS preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    html.classList.toggle('dark', prefersDark)

    // Listen for OS preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (settings.value.theme === 'system') {
        html.classList.toggle('dark', e.matches)
      }
    })
  }
}

onMounted(async () => {
  // Initialize auth
  await initAuth()
  // Initialize settings (will load from Supabase if logged in)
  await initSettings(user.value)
  // Apply saved theme
  applyTheme(settings.value.theme)
})

// React to theme changes
watch(() => settings.value.theme, applyTheme)
</script>

<template>
  <RouterView />
</template>
