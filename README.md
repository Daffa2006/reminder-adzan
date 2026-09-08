# 🕌 Adzan — Prayer Time App

Aplikasi jadwal salat modern berbasis web, dibangun dengan Vue 3, Tailwind CSS, Supabase, dan AlAdhan API.

## ✨ Fitur

- 🕐 Jam digital real-time
- 📅 Tanggal Masehi dan Hijriah
- 📍 Deteksi lokasi otomatis (Geolocation API)
- 🕌 Jadwal salat harian (Imsak, Subuh, Terbit, Dzuhur, Ashar, Maghrib, Isya)
- ⏳ Countdown menuju waktu salat berikutnya
- 📊 Progress bar waktu antar salat
- 🌙 Dark mode (Terang / Gelap / Sistem)
- 💾 Cache offline — tetap berfungsi tanpa internet
- ☁️ Sinkronisasi pengaturan via Supabase (opsional)
- 🔐 Autentikasi email/password (via Supabase Auth)

---

## 🛠 Tech Stack

| Teknologi | Versi |
|-----------|-------|
| Vue 3 | ^3.5 |
| Vite | ^8.1 |
| Tailwind CSS | ^4.3 |
| Supabase JS | ^2 |
| @lucide/vue | latest |
| vue-router | ^4 |

---

## 🚀 Instalasi

```bash
# Clone atau buka project
cd reminder-adzan

# Install dependencies
npm install

# Salin environment template
cp .env.example .env
# Edit .env dan isi Supabase credentials (opsional)

# Jalankan dev server
npm run dev
```

Buka http://localhost:5173/

---

## ⚙️ Environment Variables

Buat file `.env` di root project:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> **Catatan**: Aplikasi tetap berfungsi penuh dalam **mode tamu** tanpa Supabase credentials. Pengaturan akan disimpan ke `localStorage`.

---

## 🗄️ Supabase Setup

### 1. Buat project di Supabase

Kunjungi [supabase.com](https://supabase.com) dan buat project baru.

### 2. Jalankan SQL berikut di Supabase SQL Editor

```sql
-- Tabel pengaturan pengguna
CREATE TABLE public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  location_name TEXT DEFAULT 'Jakarta, Indonesia',
  latitude DOUBLE PRECISION DEFAULT -6.2088,
  longitude DOUBLE PRECISION DEFAULT 106.8456,
  calculation_method INTEGER DEFAULT 20,
  madhab INTEGER DEFAULT 0,
  notification_enabled BOOLEAN DEFAULT false,
  adzan_enabled BOOLEAN DEFAULT false,
  volume INTEGER DEFAULT 80,
  theme TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);

-- Aktifkan RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: user hanya bisa akses data miliknya sendiri
CREATE POLICY "Users can read own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON public.user_settings FOR DELETE
  USING (auth.uid() = user_id);
```

### 3. Salin credentials

Dari **Settings → API** di Supabase dashboard:
- `Project URL` → `VITE_SUPABASE_URL`
- `anon public key` → `VITE_SUPABASE_ANON_KEY`

---

## 🕌 AlAdhan API

Aplikasi menggunakan [AlAdhan Prayer Times API](https://aladhan.com/prayer-times-api).

**Endpoint:**
```
GET https://api.aladhan.com/v1/timings/{date}?latitude={lat}&longitude={lng}&method={method}
```

**Metode kalkulasi default:**
- `20` = Kementerian Agama Republik Indonesia (KEMENAG)

Dapat diubah melalui halaman **Pengaturan**.

---

## 📁 Struktur Project

```
src/
├── components/
│   ├── AppHeader.vue       # Header + navigasi + theme toggle
│   ├── Clock.vue           # Jam digital + tanggal Masehi & Hijriah
│   ├── NextPrayerCard.vue  # Kartu salat berikutnya + countdown
│   ├── PrayerTimes.vue     # Daftar jadwal salat
│   ├── PrayerTimeItem.vue  # Item jadwal salat (nama, waktu, status)
│   ├── LoadingState.vue    # Loading spinner
│   └── StatusBar.vue       # Indikator status update / cache
│
├── views/
│   ├── DashboardView.vue   # Halaman utama
│   ├── SettingsView.vue    # Halaman pengaturan
│   └── LoginView.vue       # Halaman login/register
│
├── services/
│   ├── aladhan.js          # AlAdhan API service
│   ├── supabase.js         # Supabase client
│   └── notification.js     # Notifikasi & adzan (arsitektur)
│
├── composables/
│   ├── usePrayerTimes.js   # Fetch + cache jadwal salat
│   ├── useCountdown.js     # Timer & countdown (satu timer global)
│   ├── useLocation.js      # Geolocation + reverse geocoding
│   ├── useSettings.js      # Pengaturan (localStorage + Supabase)
│   └── useAuth.js          # Supabase Auth
│
├── router/
│   └── index.js            # Vue Router
│
├── lib/
│   └── utils.js            # Fungsi utilitas
│
├── App.vue                 # Root component (tema + auth init)
├── main.js                 # Entry point
└── style.css               # Global styles + Quicksand
```

---

## 🔧 Development

```bash
npm run dev      # Dev server
npm run build    # Production build
npm run preview  # Preview build
```

---

## 🌐 Offline / Cache

Aplikasi menyimpan jadwal salat ke `localStorage` dengan key berbasis tanggal + koordinat.

Flow:
1. App dibuka → load dari cache (jika tersedia)
2. Request AlAdhan API → update cache
3. Jika API gagal → tampilkan cache + indikator "Offline"
4. Tengah malam → refresh otomatis untuk jadwal hari berikutnya

---

## 📱 Responsif

- **Mobile**: Layout vertikal, header ringkas
- **Tablet/Desktop**: Maksimum width 2xl, terpusat

---

## 🔔 Notifikasi & Adzan

Arsitektur notifikasi tersedia di `src/services/notification.js`:
- Browser Notification API
- Audio playback dengan guard autoplay browser
- Penjadwalan berdasarkan waktu salat

Aktifkan melalui **Pengaturan → Adzan & Notifikasi**.
