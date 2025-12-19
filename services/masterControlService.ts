// Service to fetch master controls (e.g., check_out_time)
import { API_CONFIG } from '../config/api';


export interface Shift {
  id: number;
  schedule: string;
  check_in_time: string;
  check_out_time: string;
}

export interface UserShift {
  id: number;
  date: string;
  shift: Shift | null;
}

export const masterControlService = {
  /**
   * Get today's shift for the current user from /shifts endpoint
   * @param token Bearer token
   * @returns UserShift for today or null
   */
  getTodayShift: async (token: string): Promise<UserShift | null> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/shifts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      const text = await response.text();
      let data;
      if (text.trim().startsWith('<!DOCTYPE html>')) {
        console.error('Shifts API returned HTML (likely login page). Check your token or authentication.');
        return null;
      }
      try {
        data = JSON.parse(text);
      } catch (jsonError) {
        console.error('Shifts API did not return JSON:', text);
        return null;
      }
      if (Array.isArray(data)) {
        const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
        const todayShift = data.find((item: UserShift) => item.date === today);
        return todayShift || null;
      }
      return null;
    } catch (error) {
      console.error('Error fetching today\'s shift:', error);
      return null;
    }
  },

  /**
   * Validate if user can check out based on shift parameter
   * @param shift Shift object
   * @returns boolean
   */
  canCheckOut: (shift: Shift | null): boolean => {
    if (!shift) return false;
    const now = new Date();
    // shift.check_out_time format: 'HH:mm:ss' (assumed)
    const [h, m, s] = shift.check_out_time.split(':').map(Number);
    const checkOutTime = new Date(now);
    checkOutTime.setHours(h, m, s || 0, 0);
    // Boleh check out jika waktu sekarang >= waktu check out shift
    return now >= checkOutTime;
  },
};
