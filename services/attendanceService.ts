/**
 * Mengecek apakah lokasi user sesuai area/divisi user (API: /check-user-location)
 * @param token
 * @param latitude
 * @param longitude
 * @returns Promise<{ match: boolean, area?: string, divisions?: string[], message?: string }>
 */
import { API_CONFIG } from '../config/api';
const checkUserLocation = async (token: string, latitude: number, longitude: number) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/check-user-location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ latitude, longitude }),
    });
    return await response.json();
  } catch (error) {
    return { match: false, message: 'Gagal menghubungi server lokasi' };
  }
};

export interface AttendanceRecord {
  id: number;
  user_id: number;
  date: string;
  time: string | null;
  type: 'check_in' | 'check_out' | 'izin' | 'sakit' | string;
  status: string | null;
  notes: string | null;
  bukti: string | null;
  latitude: string | null; // Tambahan
  longitude: string | null; // Tambahan
  keterangan?: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    nip: string;
    name: string;
    email: string;
    division?: { id: number; name: string };
    company?: { id: number; name_company: string };
  };
}

export interface TodayAttendanceResponse {
  success: boolean;
  message?: string;
  data: {
    hasCheckedIn: boolean;
    hasCheckedOut: boolean;
    checkInTime: string | null;
    checkOutTime: string | null;
    status: string | null;
    checkInRecord: AttendanceRecord | null;
    checkOutRecord: AttendanceRecord | null;
  } | null;
  error?: any;
}

export interface AttendanceStatsResponse {
  success: boolean;
  message?: string;
  data: {
    checkInCount: number;
    checkOutCount: number;
    month: string;
  } | null;
  error?: any;
}

// ===================================
// II. HELPER FUNCTIONS & CONFIG
// ===================================

const ATTENDANCE_ENDPOINT = `${API_CONFIG.BASE_URL}/attendances`;

const getAuthHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${token}`,
});

const createFormDataHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Accept': 'application/json',
});

interface CheckActionParams {
  userId: number;
  latitude: number; 
  longitude: number; 
  bukti?: { uri: string; type: string; name: string };
  token: string;
  notes?: string; 
}



// ===================================
// III. SERVICE LOGIC
// ===================================

/**
 * Mengecek lokasi ke endpoint /check-location
 * @param latitude
 * @param longitude
 * @returns Promise<{ area: string, divisions: string[] } | { message: string }>
 */
const checkLocation = async (latitude: number, longitude: number) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/check-location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ latitude, longitude }),
    });
    return await response.json();
  } catch (error) {
    return { message: 'Gagal menghubungi server lokasi' };
  }
};

export const attendanceService = {
  checkLocation,
  checkUserLocation,
  
  /**
   * 1. Mendapatkan riwayat kehadiran mentah (array record).
   */
  getAttendanceHistory: async (token: string, userId: number, limit: number = 20): Promise<AttendanceRecord[]> => {
    try {
      const response = await fetch(
        `${ATTENDANCE_ENDPOINT}?user_id=${userId}&limit=${limit}&sort=desc`,
        { method: 'GET', headers: getAuthHeaders(token) }
      );
      const responseData = await response.json();
      if (!response.ok) { console.error('API Error:', responseData); return []; }
      return responseData.data?.data || responseData.data || [];
    } catch (error) {
      console.error('Network/Parsing Error:', error);
      return [];
    }
  },

  /**
   * 2. Mendapatkan status kehadiran hari ini (Menggabungkan Check In dan Check Out).
   */
  getTodayAttendance: async (token: string, userId: number): Promise<TodayAttendanceResponse> => {
    const defaultData = {
      hasCheckedIn: false, hasCheckedOut: false, checkInTime: null, checkOutTime: null,
      status: null, checkInRecord: null, checkOutRecord: null,
    };
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `${ATTENDANCE_ENDPOINT}?user_id=${userId}&start_date=${today}&end_date=${today}`,
        { method: 'GET', headers: getAuthHeaders(token) }
      );
      const responseData = await response.json();
      if (!response.ok) { throw new Error(responseData.message || `Gagal memuat data. Status: ${response.status}`); }

      const attendances: AttendanceRecord[] = responseData.data?.data || responseData.data || [];
      // Deteksi check in/out dari type ATAU status
      const checkInRecord = attendances.find(a => a.status && (a.status.toLowerCase() === 'check in' || a.status.toLowerCase() === 'check_in')) || null;
      const checkOutRecord = attendances.find(a => a.status && (a.status.toLowerCase() === 'check out' || a.status.toLowerCase() === 'check_out')) || null;

      return {
        success: true,
        data: {
          ...defaultData,
          hasCheckedIn: checkInRecord !== null,
          hasCheckedOut: checkOutRecord !== null,
          checkInTime: checkInRecord?.time || null,
          checkOutTime: checkOutRecord?.time || null,
          status: checkInRecord?.status || null, 
          checkInRecord,
          checkOutRecord
        },
      };
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      return { success: false, message: 'Gagal memuat data kehadiran hari ini.', data: defaultData, error: error instanceof Error ? error.message : "Kesalahan tidak diketahui" };
    }
  },

  /**
   * 3. Mendapatkan statistik kehadiran bulanan.
   */
  getMonthlyStats: async (token: string, userId: number): Promise<AttendanceStatsResponse> => {
    const now = new Date();
    const defaultStats = { checkInCount: 0, checkOutCount: 0, month: now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) };
    try {
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const response = await fetch(
        `${ATTENDANCE_ENDPOINT}?user_id=${userId}&start_date=${startDate}&end_date=${endDate}`,
        { method: 'GET', headers: getAuthHeaders(token) }
      );
      const responseData = await response.json();
      if (!response.ok) { throw new Error(responseData.message || `Gagal memuat statistik. Status: ${response.status}`); }

      const attendances: AttendanceRecord[] = responseData.data?.data || responseData.data || [];
      // Hitung check in/out dari type ATAU status
      const checkInCount = attendances.filter(a => a.status && a.status.toLowerCase() === 'check in').length;
      const checkOutCount = attendances.filter(a => a.status && a.status.toLowerCase() === 'check out').length;

      return { success: true, data: { ...defaultStats, checkInCount, checkOutCount } };
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
      return { success: false, message: 'Gagal memuat statistik bulanan.', data: defaultStats, error: error instanceof Error ? error.message : "Kesalahan tidak diketahui" };
    }
  },

  /**
   * 4. Melakukan Check In.
   */
  checkIn: async ({ userId, latitude, longitude, bukti, token, notes }: CheckActionParams) => {
    const formData = new FormData();
    formData.append('user_id', userId.toString());
    formData.append('notes', notes || '');
    
    // Kirim data lokasi ke backend
    formData.append('latitude', latitude.toString());
    formData.append('longitude', longitude.toString());
    
    if (bukti) {
      formData.append('bukti', {
        uri: bukti.uri,
        type: bukti.type,
        name: bukti.name,
      } as any);
    }

    const response = await fetch(`${ATTENDANCE_ENDPOINT}/check-in`, {
      method: 'POST',
      headers: createFormDataHeaders(token),
      body: formData,
    });

    return await response.json();
  },

  /**
   * 5. Melakukan Check Out (dengan input waktu manual jika diperlukan).
   */
  checkOut: async ({ userId, latitude, longitude, bukti, token, notes, time }: CheckActionParams & { time?: string }) => {
    const formData = new FormData();
    formData.append('user_id', userId.toString());
    formData.append('notes', notes || '');

    // Kirim data lokasi ke backend
    formData.append('latitude', latitude.toString());
    formData.append('longitude', longitude.toString());

    // Tambahkan input waktu jika ada
    if (time) {
      formData.append('time', time);
    }

    if (bukti) {
      formData.append('bukti', {
        uri: bukti.uri,
        type: bukti.type,
        name: bukti.name,
      } as any);
    }

    const response = await fetch(`${ATTENDANCE_ENDPOINT}/check-out`, {
      method: 'POST',
      headers: createFormDataHeaders(token),
      body: formData,
    });

    return await response.json();
  },
  /**
   * 6. Mengambil data lembur user
   * @param token Bearer token
   * @returns Data lembur user
   */
  getOvertimeData: async (token: string) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/user-overtimes`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });
      const responseData = await response.json();
      if (!response.ok) {
        return { success: false, message: responseData.message || 'Gagal mengambil data lembur', data: [] };
      }
      // Pastikan payload sesuai dengan backend: { success: true, data: [ ... ] }
      return {
        success: responseData.success === true,
        data: responseData.data || [],
      };
    } catch (error) {
      return { success: false, message: 'Gagal mengambil data lembur', data: [] };
    }
  },
};