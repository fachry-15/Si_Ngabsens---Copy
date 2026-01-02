import { API_CONFIG } from '@/config/api';

// ===================================
// I. TYPES & INTERFACES
// ===================================

export interface LoginRequest {
  nip: string;
  password: string;
}

export interface User {
  id: number;
  nip: string;
  name: string;
  role: string;
  email?: string;
  join_date?: string;
  division_id?: any;
  division?: any;
  area?: any;
  division_name?: string;
  area_name?: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: User;
  };
}

// Interface untuk merepresentasikan struktur mentah dari Backend
interface BackendAuthResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: {
      id: number;
      nip: string;
      name: string;
      email?: string;
      join_date?: string;
      division?: any;
      division_id?: any;
      area?: any;
      division_name?: string;
      area_name?: string;
    };
  };
}

// ===================================
// II. SERVICE LOGIC
// ===================================

export const authService = {
  /**
   * Melakukan login user ke sistem
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const LOGIN_URL = `${API_CONFIG.BASE_URL}/login`;

    try {
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result: BackendAuthResponse = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: result.message || 'NIP atau Password salah',
        };
      }

      // Mapping data dari backend ke format yang dibutuhkan aplikasi (Frontend Role)
      const userData = result.data;
      
      if (!userData) {
        throw new Error('Data user tidak ditemukan dalam respon server');
      }

      console.log('🔍 [AuthService] Login response user data:', JSON.stringify(userData.user, null, 2));

      return {
        success: true,
        data: {
          token: userData.token,
          user: {
            id: userData.user.id,
            nip: userData.user.nip,
            name: userData.user.name,
            email: userData.user.email,
            join_date: userData.user.join_date,
            // Simpan semua data division & area dari API
            division_id: userData.user.division_id,
            division: userData.user.division,
            area: userData.user.area,
            division_name: userData.user.division_name,
            area_name: userData.user.area_name,
            // Fallback logic untuk Role
            role: userData.user.division?.name || userData.user.division_name || 'Karyawan',
          },
        },
      };

    } catch (error) {
      return {
        success: false,
        message: handleAuthError(error),
      };
    }
  },
};

/**
 * Helper untuk standarisasi pesan error
 */
function handleAuthError(error: unknown): string {
  console.error('[AuthService Error]:', error);

  if (error instanceof TypeError && error.message.includes('Network request failed')) {
    return 'Koneksi gagal. Pastikan server aktif dan gunakan IP Address jika di device fisik.';
  }

  if (error instanceof Error) return error.message;
  
  return 'Terjadi kesalahan sistem yang tidak diketahui.';
}