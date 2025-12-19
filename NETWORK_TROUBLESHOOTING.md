# Troubleshooting Network Request Failed

## Masalah
`Network request failed` terjadi karena aplikasi tidak dapat terhubung ke server backend.

## Solusi

### 1. Pastikan Server Backend Berjalan
```bash
# Cek apakah server sudah running di port 8000
# Di terminal server backend, pastikan ada output seperti:
# Server running at http://127.0.0.1:8000
```

### 2. Gunakan IP Address yang Benar

**Jika testing di Emulator:**
- Android Emulator: Gunakan `10.0.2.2` sebagai pengganti `127.0.0.1`
  ```
  http://10.0.2.2:8000/api
  ```

**Jika testing di Device Fisik:**
- Gunakan IP address komputer Anda di jaringan lokal
- Cari IP dengan command:
  ```bash
  # Windows
  ipconfig
  # Cari "IPv4 Address" di bagian WiFi/Ethernet
  ```
- Contoh: `http://192.168.1.10:8000/api`

### 3. Update Base URL di Aplikasi

1. Buka aplikasi
2. Di halaman login, klik **"Pengaturan API"** di bagian bawah
3. Ubah URL sesuai dengan environment:
   - Emulator Android: `http://10.0.2.2:8000/api`
   - Device Fisik: `http://192.168.X.X:8000/api` (ganti dengan IP komputer)
   - iOS Simulator: `http://localhost:8000/api` atau `http://127.0.0.1:8000/api`

### 4. Pastikan Device/Emulator dan Server di Jaringan yang Sama

Untuk device fisik:
- Pastikan smartphone dan komputer terhubung ke WiFi yang sama
- Firewall di komputer mungkin perlu diizinkan untuk port 8000

### 5. Test Backend API

Gunakan browser atau Postman untuk test:
```
POST http://127.0.0.1:8000/api/login
Content-Type: application/json

{
  "nip": "test_nip",
  "password": "test_password"
}
```

### 6. Check Console Logs

Aplikasi sekarang menampilkan log detail di console:
- URL yang diakses
- Response status
- Error detail

Buka terminal Expo untuk melihat log ini.

## Quick Fix untuk Development

Untuk testing cepat tanpa backend, bisa gunakan mock response:

```typescript
// Temporary untuk testing UI
const mockLogin = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    success: true,
    data: {
      token: 'mock_token',
      user: {
        nip: '123456',
        name: 'Test User',
        role: 'Karyawan',
        email: 'test@ptpal.com'
      }
    }
  };
};
```
