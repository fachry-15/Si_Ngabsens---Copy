import { API_CONFIG } from '@/config/api';

export interface LoginRequest {
  nip: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: {
      id?: number;
      nip: string;
      name: string;
      role: string;
      email?: string;
    };
  };
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      console.log('Attempting login to:', `${API_CONFIG.BASE_URL}/login`);
      console.log('Credentials:', { nip: credentials.nip, password: '***' });

      const response = await fetch(`${API_CONFIG.BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        return {
          success: false,
          message: responseData.message || 'Login gagal',
        };
      }

      // Backend returns nested data structure: { success, message, data: { token, user } }
      // Extract the actual data from response
      const actualData = responseData.data || responseData;
      
      return {
        success: true,
        data: {
          token: actualData.token,
          user: {
            id: actualData.user.id,
            nip: actualData.user.nip,
            name: actualData.user.name,
            role: actualData.user.division?.name || 'Karyawan', // Use division name as role
            email: actualData.user.email,
          },
        },
      };
    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof TypeError && error.message === 'Network request failed') {
        return {
          success: false,
          message: 'Tidak dapat terhubung ke server. Periksa:\n1. Apakah server sudah berjalan?\n2. Apakah URL sudah benar?\n3. Gunakan IP address (bukan localhost) untuk device fisik',
        };
      }
      
      return {
        success: false,
        message: 'Terjadi kesalahan. Periksa koneksi Anda.',
      };
    }
  },
};
