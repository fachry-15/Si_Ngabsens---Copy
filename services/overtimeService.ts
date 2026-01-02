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
      console.log('📡 [OvertimeService] Fetching user overtimes...');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/user-overtimes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const responseData = await response.json();
      
      console.log('📥 [OvertimeService] Response status:', response.status);
      console.log('📦 [OvertimeService] Raw response:', JSON.stringify(responseData, null, 2));
      
      if (!response.ok) {
        console.error('❌ [OvertimeService] API Error:', responseData);
        return [];
      }
      
      const data = responseData.data || [];
      
      // Debug: Tampilkan format data setiap overtime
      if (data.length > 0) {
        console.log('🔍 [OvertimeService] First overtime data:');
        console.log('  - start_time:', data[0].start_time);
        console.log('  - end_time:', data[0].end_time);
        console.log('  - status:', data[0].status);
        console.log('  - total_minutes:', data[0].total_minutes);
      }
      
      return data;
    } catch (error) {
      console.error('❌ [OvertimeService] Network/Parsing Error:', error);
      return [];
    }
  },
};
