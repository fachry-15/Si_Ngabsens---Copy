import { API_CONFIG } from '../config/api';

export interface OvertimeRecord {
  id: number;
  start_time: string;
  end_time: string;
  total_minutes: number;
  durasi_lembur: string;
  reason: string;
  status: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export const overtimeService = {
  getUserOvertimes: async (token: string): Promise<OvertimeRecord[]> => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/user-overtimes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const responseData = await response.json();
      if (!response.ok) {
        console.error('API Error:', responseData);
        return [];
      }
      return responseData.data || [];
    } catch (error) {
      console.error('Network/Parsing Error:', error);
      return [];
    }
  },
};
