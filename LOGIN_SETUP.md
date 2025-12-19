# Setup Login dengan API

Fitur login sudah terintegrasi dengan backend API.

## Instalasi Package

Jalankan command berikut untuk menginstall AsyncStorage:

```bash
npx expo install @react-native-async-storage/async-storage
```

## Konfigurasi

1. **Base URL Default**: `http://127.0.0.1:8000/api`
2. **Endpoint Login**: `{base_url}/login`

## Cara Menggunakan

### 1. Mengubah Base URL

Di halaman login, klik tombol **"Pengaturan API"** di bagian bawah untuk mengubah base URL sesuai server backend Anda.

### 2. Login

- **Step 1**: Masukkan NIP → Klik "Lanjutkan"
- **Step 2**: Masukkan Password → Klik "Login"

### 3. API Request Format

```json
POST {base_url}/login
Content-Type: application/json

{
  "nip": "string",
  "password": "string"
}
```

### 4. API Response Format (Expected)

```json
{
  "token": "string",
  "user": {
    "nip": "string",
    "name": "string", 
    "role": "string",
    "email": "string" (optional)
  }
}
```

## State Management

- **Auth Store**: `store/authStore.ts` - Mengelola state autentikasi
- **Auth Service**: `services/authService.ts` - Handle API calls
- **API Config**: `config/api.ts` - Konfigurasi base URL

## Fitur

✅ 2-step authentication (NIP → Password)
✅ Loading indicator saat login
✅ Error handling dengan Alert
✅ Token & user data disimpan di AsyncStorage
✅ Custom base URL yang bisa diubah via UI
✅ State management terpisah

## File Structure

```
config/
  └── api.ts                 # API configuration
services/
  └── authService.ts         # Authentication service
store/
  └── authStore.ts           # Auth state management
components/
  └── ApiSettingsModal.tsx   # Modal untuk setting base URL
app/
  ├── login.tsx              # Login screen
  └── index.tsx              # Splash screen
```
