import { useCallback, useEffect, useMemo, useState } from 'react';
import { overtimeService } from '../services/overtimeService';
import { authStore } from '../store/authStore';
import type { OvertimeRecord } from '../types/overtime';

export type FilterType = 'all' | 'pending' | 'approved' | 'rejected';
export type SortType = 'date-desc' | 'date-asc' | 'duration-desc' | 'duration-asc';

export const useOvertimeList = () => {
  const [loading, setLoading] = useState(true);
  const [overtimes, setOvertimes] = useState<OvertimeRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('date-desc');

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

  // Filter counts
  const filterCounts = useMemo(() => {
    const counts = {
      all: overtimes.length,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    overtimes.forEach((overtime) => {
      const status = overtime.status.toLowerCase();
      if (status === 'pending' || status === 'menunggu') {
        counts.pending++;
      } else if (status === 'approved' || status === 'disetujui') {
        counts.approved++;
      } else if (status === 'rejected' || status === 'ditolak') {
        counts.rejected++;
      }
    });

    return counts;
  }, [overtimes]);

  // Filtered and sorted overtimes
  const filteredOvertimes = useMemo(() => {
    let result = [...overtimes];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((overtime) => {
        // Search by date
        const dateMatch = overtime.start_time.toLowerCase().includes(query);
        // Search by reason
        const reasonMatch = overtime.reason?.toLowerCase().includes(query);
        // Search by status
        const statusMatch = overtime.status.toLowerCase().includes(query);
        
        return dateMatch || reasonMatch || statusMatch;
      });
    }

    // Apply status filter
    if (filterType !== 'all') {
      result = result.filter((overtime) => {
        const status = overtime.status.toLowerCase();
        
        if (filterType === 'pending') {
          return status === 'pending' || status === 'menunggu';
        } else if (filterType === 'approved') {
          return status === 'approved' || status === 'disetujui';
        } else if (filterType === 'rejected') {
          return status === 'rejected' || status === 'ditolak';
        }
        
        return true;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortType) {
        case 'date-desc':
          return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
        case 'date-asc':
          return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
        case 'duration-desc':
          return b.total_minutes - a.total_minutes;
        case 'duration-asc':
          return a.total_minutes - b.total_minutes;
        default:
          return 0;
      }
    });

    return result;
  }, [overtimes, searchQuery, filterType, sortType]);

  return {
    loading,
    overtimes: filteredOvertimes,
    allOvertimes: overtimes,
    refreshing,
    error,
    refetch: fetchOvertimes,
    // Search and filter
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    sortType,
    setSortType,
    filterCounts,
  };
};