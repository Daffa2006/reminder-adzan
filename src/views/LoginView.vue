<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Mail, Lock, LogIn } from '@lucide/vue'
import { useAuth } from '@/composables/useAuth.js'
import { isSupabaseConfigured } from '@/services/supabase.js'

const router = useRouter()
const { login, register, loading, error } = useAuth()

const isLogin = ref(true)
const form = reactive({ email: '', password: '' })
const successMessage = ref('')

async function handleSubmit() {
    successMessage.value = ''
    let ok = false

    if (isLogin.value) {
        ok = await login(form.email, form.password)
        if (ok) {
            router.push('/settings')
        }
    } else {
        ok = await register(form.email, form.password)
        if (ok) {
            successMessage.value = 'Pendaftaran berhasil! Silakan cek email Anda.'
            isLogin.value = true
        }
    }
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <div class="max-w-md mx-auto w-full px-4">
            <!-- Header -->
            <header class="flex items-center gap-3 py-4">
                <button @click="$router.back()" aria-label="Kembali"
                    class="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ArrowLeft class="w-4 h-4" />
                </button>
                <h1 class="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {{ isLogin ? 'Masuk' : 'Daftar' }}
                </h1>
            </header>

            <!-- Supabase not configured warning -->
            <div v-if="!isSupabaseConfigured()"
                class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4 text-sm text-amber-700 dark:text-amber-300">
                <p class="font-semibold mb-1">Supabase belum dikonfigurasi</p>
                <p>Tambahkan <code class="bg-amber-100 dark:bg-amber-800/40 px-1 rounded">VITE_SUPABASE_URL</code> dan
                    <code class="bg-amber-100 dark:bg-amber-800/40 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> ke file
                    <code>.env</code> Anda.
                </p>
            </div>

            <main
                class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    {{ isLogin ? 'Masuk untuk menyimpan pengaturan Anda ke cloud.' : 'Buat akun untuk menyinkronkan
                    pengaturan.' }}
                </p>

                <!-- Success message -->
                <div v-if="successMessage"
                    class="bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-xl p-3 mb-4 text-sm text-teal-700 dark:text-teal-300">
                    {{ successMessage }}
                </div>

                <!-- Error message -->
                <div v-if="error" role="alert"
                    class="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-3 mb-4 text-sm text-red-600 dark:text-red-400">
                    {{ error }}
                </div>

                <form @submit.prevent="handleSubmit" class="flex flex-col gap-3">
                    <!-- Email -->
                    <div>
                        <label for="email" class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Email
                        </label>
                        <div class="relative">
                            <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                                aria-hidden="true" />
                            <input id="email" v-model="form.email" type="email" required autocomplete="email"
                                placeholder="email@contoh.com"
                                class="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition" />
                        </div>
                    </div>

                    <!-- Password -->
                    <div>
                        <label for="password" class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Password
                        </label>
                        <div class="relative">
                            <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                                aria-hidden="true" />
                            <input id="password" v-model="form.password" type="password" required
                                :autocomplete="isLogin ? 'current-password' : 'new-password'"
                                placeholder="Minimal 6 karakter" minlength="6"
                                class="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition" />
                        </div>
                    </div>

                    <!-- Submit -->
                    <button type="submit" :disabled="loading || !isSupabaseConfigured()"
                        class="flex items-center justify-center gap-2 w-full py-3 mt-2 rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-semibold text-sm transition-colors shadow-sm">
                        <LogIn class="w-4 h-4" />
                        {{ loading ? 'Memproses...' : isLogin ? 'Masuk' : 'Daftar' }}
                    </button>
                </form>

                <!-- Toggle login/register -->
                <p class="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    {{ isLogin ? 'Belum punya akun?' : 'Sudah punya akun?' }}
                    <button @click="isLogin = !isLogin"
                        class="ml-1 font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                        {{ isLogin ? 'Daftar' : 'Masuk' }}
                    </button>
                </p>
            </main>
        </div>
    </div>
</template>
