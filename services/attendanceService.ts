import { API_CONFIG } from '../config/api';

// ===================================
// I. TYPES & INTERFACES
// ===================================

export type AttendanceType = 'check_in' | 'check_out' | 'izin' | 'sakit';

export interface AttendanceRecord {
  id: number;
  user_id: number;
  date: string;
  time: string | null;
  type: AttendanceType | string;
  status: string | null;
  notes: string | null;
  bukti: string | null;
  latitude: string | null;
  longitude: string | null;
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

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T | null;
  error?: any;
}

export interface TodayAttendanceData {
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string | null;
  checkInRecord: AttendanceRecord | null;
  checkOutRecord: AttendanceRecord | null;
}

// ===================================
// II. UTILS & HELPERS
// ===================================

const ENDPOINTS = {
  ATTENDANCE: `${API_CONFIG.BASE_URL}/attendances`,
  CHECK_LOCATION: `${API_CONFIG.BASE_URL}/check-location`,
  USER_LOCATION: `${API_CONFIG.BASE_URL}/check-user-location`,
  OVERTIME: `${API_CONFIG.BASE_URL}/user-overtimes`,
};

const getHeaders = (token?: string, isMultipart = false) => {
  const headers: HeadersInit = {
    'Accept': 'application/json',
  };
  if (!isMultipart) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

/**
 * Base Fetch Wrapper untuk mengurangi redundansi try-catch
 */
async function fetchAPI<T>(url: string, options: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Server Error');
    return data;
  } catch (error) {
    console.error(`API Error [${url}]:`, error);
    throw error;
  }
}

// ===================================
// III. SERVICE LOGIC
// ===================================

export const attendanceService = {
  
  checkLocation: async (latitude: number, longitude: number) => {
    return fetchAPI(ENDPOINTS.CHECK_LOCATION, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ latitude, longitude }),
    }).catch(() => ({ message: 'Gagal menghubungi server lokasi' }));
  },

  checkUserLocation: async (token: string, latitude: number, longitude: number) => {
    return fetchAPI(ENDPOINTS.USER_LOCATION, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ latitude, longitude }),
    }).catch(() => ({ match: false, message: 'Gagal menghubungi server lokasi' }));
  },

  getAttendanceHistory: async (token: string, userId: number, limit = 20): Promise<AttendanceRecord[]> => {
    try {
      const url = `${ENDPOINTS.ATTENDANCE}?user_id=${userId}&limit=${limit}&sort=desc`;
      const res = await fetchAPI<any>(url, { method: 'GET', headers: getHeaders(token) });
      return res.data?.data || res.data || [];
    } catch {
      return [];
    }
  },

  getTodayAttendance: async (token: string, userId: number): Promise<ApiResponse<TodayAttendanceData>> => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const url = `${ENDPOINTS.ATTENDANCE}?user_id=${userId}&start_date=${today}&end_date=${today}`;
      const res = await fetchAPI<any>(url, { method: 'GET', headers: getHeaders(token) });
      
      const records: AttendanceRecord[] = res.data?.data || res.data || [];
      
      const checkInRecord = records.find(a => a.status?.toLowerCase().replace('_', ' ') === 'check in') || null;
      const checkOutRecord = records.find(a => a.status?.toLowerCase().replace('_', ' ') === 'check out') || null;

      return {
        success: true,
        data: {
          hasCheckedIn: !!checkInRecord,
          hasCheckedOut: !!checkOutRecord,
          checkInTime: checkInRecord?.time || null,
          checkOutTime: checkOutRecord?.time || null,
          status: checkInRecord?.status || null,
          checkInRecord,
          checkOutRecord
        }
      };
    } catch (error: any) {
      return { 
        success: false, 
        message: 'Gagal memuat data hari ini', 
        data: null, 
        error: error.message 
      };
    }
  },

  /**
   * Menggunakan FormData Builder untuk Check In & Check Out
   */
  async submitAttendance(
    type: 'check-in' | 'check-out', 
    params: { userId: number; latitude: number; longitude: number; token: string; bukti?: any; notes?: string; time?: string }
  ) {
    const formData = new FormData();
    formData.append('user_id', params.userId.toString());
    formData.append('latitude', params.latitude.toString());
    formData.append('longitude', params.longitude.toString());
    formData.append('notes', params.notes || '');
    if (params.time) formData.append('time', params.time);
    
    if (params.bukti) {
      formData.append('bukti', {
        uri: params.bukti.uri,
        type: params.bukti.type,
        name: params.bukti.name,
      } as any);
    }

    return fetchAPI(`${ENDPOINTS.ATTENDANCE}/${type}`, {
      method: 'POST',
      headers: getHeaders(params.token, true),
      body: formData,
    });
  },

  getOvertimeData: async (token: string) => {
    try {
      const res = await fetchAPI<any>(ENDPOINTS.OVERTIME, { 
        method: 'GET', 
        headers: getHeaders(token) 
      });
      return { success: true, data: res.data || [] };
    } catch (error: any) {
      return { success: false, message: error.message, data: [] };
    }
  }
};