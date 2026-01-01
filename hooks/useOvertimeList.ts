import { useCallback, useEffect, useState } from 'react';
import { overtimeService } from '../services/overtimeService';
import { authStore } from '../store/authStore';
import type { OvertimeRecord } from '../types/overtime';

export const useOvertimeList = () => {
  const [loading, setLoading] = useState(true);
  const [overtimes, setOvertimes] = useState<OvertimeRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOvertimes = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      setError(null);
      
      const { token } = authStore.getState();
      if (!token) {
        throw new Error('Token tidak tersedia');
      }
      
      const data = await overtimeService.getUserOvertimes(token);
      setOvertimes(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal memuat data lembur';
      setError(errorMessage);
      console.error('Error fetching overtimes:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOvertimes();
  }, [fetchOvertimes]);

  return {
    loading,
    overtimes,
    refreshing,
    error,
    refetch: fetchOvertimes,
  };
};