import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Sample data - in real app, this would come from API/database
interface AttendanceRecord {
  id: string;
  type: 'checkin' | 'checkout';
  date: Date;
  time: string;
  status: 'Tepat Waktu' | 'Terlambat' | 'Lebih Awal';
  location: string;
}

const SAMPLE_DATA: AttendanceRecord[] = [
  {
    id: '1',
    type: 'checkin',
    date: new Date(2024, 11, 9),
    time: '08:00',
    status: 'Tepat Waktu',
    location: 'PT PAL Indonesia, Surabaya'
  },
  {
    id: '2',
    type: 'checkout',
    date: new Date(2024, 11, 9),
    time: '17:00',
    status: 'Tepat Waktu',
    location: 'PT PAL Indonesia, Surabaya'
  },
  {
    id: '3',
    type: 'checkin',
    date: new Date(2024, 11, 8),
    time: '08:15',
    status: 'Terlambat',
    location: 'PT PAL Indonesia, Surabaya'
  },
  {
    id: '4',
    type: 'checkout',
    date: new Date(2024, 11, 8),
    time: '17:05',
    status: 'Tepat Waktu',
    location: 'PT PAL Indonesia, Surabaya'
  },
  {
    id: '5',
    type: 'checkin',
    date: new Date(2024, 11, 7),
    time: '07:55',
    status: 'Lebih Awal',
    location: 'PT PAL Indonesia, Surabaya'
  },
  {
    id: '6',
    type: 'checkout',
    date: new Date(2024, 11, 7),
    time: '17:00',
    status: 'Tepat Waktu',
    location: 'PT PAL Indonesia, Surabaya'
  },
  {
    id: '7',
    type: 'checkin',
    date: new Date(2024, 11, 6),
    time: '08:00',
    status: 'Tepat Waktu',
    location: 'PT PAL Indonesia, Surabaya'
  },
  {
    id: '8',
    type: 'checkout',
    date: new Date(2024, 11, 6),
    time: '16:55',
    status: 'Lebih Awal',
    location: 'PT PAL Indonesia, Surabaya'
  },
  {
    id: '9',
    type: 'checkin',
    date: new Date(2024, 11, 5),
    time: '08:10',
    status: 'Terlambat',
    location: 'PT PAL Indonesia, Surabaya'
  },
  {
    id: '10',
    type: 'checkout',
    date: new Date(2024, 11, 5),
    time: '17:00',
    status: 'Tepat Waktu',
    location: 'PT PAL Indonesia, Surabaya'
  },
];

export default function HistoryScreen() {
  const [filterType, setFilterType] = useState<'all' | 'checkin' | 'checkout'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'start' | 'end'>('start');

  // Filter data based on selected filters
  const filteredData = SAMPLE_DATA.filter(record => {
    // Filter by type
    if (filterType !== 'all' && record.type !== filterType) return false;

    // Filter by search query (location or status)
    if (searchQuery && !record.location.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !record.status.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Filter by date range
    if (startDate && record.date < startDate) return false;
    if (endDate && record.date > endDate) return false;

    return true;
  });

  const formatDate = (date: Date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatDateShort = (date: Date) => {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const clearFilters = () => {
    setFilterType('all');
    setSearchQuery('');
    setStartDate(null);
    setEndDate(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Tepat Waktu':
        return '#4CAF50';
      case 'Terlambat':
        return '#F44336';
      case 'Lebih Awal':
        return '#2196F3';
      default:
        return '#757575';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat Kehadiran</Text>
        <Text style={styles.headerSubtitle}>Semua catatan check-in & check-out</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari lokasi atau status..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterButtonText, filterType === 'all' && styles.filterButtonTextActive]}>
              Semua
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterType === 'checkin' && styles.filterButtonActive]}
            onPress={() => setFilterType('checkin')}
          >
            <Ionicons 
              name="log-in-outline" 
              size={16} 
              color={filterType === 'checkin' ? '#FFFFFF' : '#2b5597'} 
            />
            <Text style={[styles.filterButtonText, filterType === 'checkin' && styles.filterButtonTextActive]}>
              Check In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterType === 'checkout' && styles.filterButtonActive]}
            onPress={() => setFilterType('checkout')}
          >
            <Ionicons 
              name="log-out-outline" 
              size={16} 
              color={filterType === 'checkout' ? '#FFFFFF' : '#2b5597'} 
            />
            <Text style={[styles.filterButtonText, filterType === 'checkout' && styles.filterButtonTextActive]}>
              Check Out
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              setDatePickerType('start');
              setShowDateModal(true);
            }}
          >
            <Ionicons name="calendar-outline" size={16} color="#2b5597" />
            <Text style={styles.filterButtonText}>
              {startDate ? formatDateShort(startDate) : 'Dari'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              setDatePickerType('end');
              setShowDateModal(true);
            }}
          >
            <Ionicons name="calendar-outline" size={16} color="#2b5597" />
            <Text style={styles.filterButtonText}>
              {endDate ? formatDateShort(endDate) : 'Sampai'}
            </Text>
          </TouchableOpacity>

          {(filterType !== 'all' || searchQuery || startDate || endDate) && (
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={clearFilters}
            >
              <Ionicons name="close" size={16} color="#F44336" />
              <Text style={styles.clearFilterText}>Reset</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredData.length} catatan ditemukan
        </Text>
      </View>

      {/* History List */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {filteredData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>Tidak ada data ditemukan</Text>
            <Text style={styles.emptySubtext}>
              Coba ubah filter atau kriteria pencarian
            </Text>
          </View>
        ) : (
          filteredData.map((record, index) => (
            <View key={record.id} style={styles.historyCard}>
              <View style={styles.historyCardHeader}>
                <View style={styles.historyTypeContainer}>
                  <View style={[
                    styles.historyTypeIcon,
                    record.type === 'checkin' ? styles.checkInIcon : styles.checkOutIcon
                  ]}>
                    <Ionicons 
                      name={record.type === 'checkin' ? 'log-in-outline' : 'log-out-outline'} 
                      size={20} 
                      color="#FFFFFF" 
                    />
                  </View>
                  <View>
                    <Text style={styles.historyType}>
                      {record.type === 'checkin' ? 'Check In' : 'Check Out'}
                    </Text>
                    <Text style={styles.historyDate}>{formatDate(record.date)}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.status) }]}>
                  <Text style={styles.statusText}>{record.status}</Text>
                </View>
              </View>

              <View style={styles.historyCardBody}>
                <View style={styles.historyInfoRow}>
                  <Ionicons name="time-outline" size={18} color="#666" />
                  <Text style={styles.historyInfoText}>{record.time} WIB</Text>
                </View>
                <View style={styles.historyInfoRow}>
                  <Ionicons name="location-outline" size={18} color="#666" />
                  <Text style={styles.historyInfoText}>{record.location}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.detailButton}>
                <Text style={styles.detailButtonText}>Lihat Detail</Text>
                <Ionicons name="chevron-forward" size={16} color="#2b5597" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Simple Date Picker Modal */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDateModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Pilih Tanggal {datePickerType === 'start' ? 'Awal' : 'Akhir'}
            </Text>
            <Text style={styles.modalSubtitle}>
              Untuk fitur date picker lengkap, gunakan library seperti react-native-date-picker
            </Text>
            
            <View style={styles.quickDateButtons}>
              <TouchableOpacity
                style={styles.quickDateButton}
                onPress={() => {
                  const date = new Date();
                  if (datePickerType === 'start') {
                    setStartDate(date);
                  } else {
                    setEndDate(date);
                  }
                  setShowDateModal(false);
                }}
              >
                <Text style={styles.quickDateButtonText}>Hari Ini</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickDateButton}
                onPress={() => {
                  const date = new Date();
                  date.setDate(date.getDate() - 7);
                  if (datePickerType === 'start') {
                    setStartDate(date);
                  } else {
                    setEndDate(date);
                  }
                  setShowDateModal(false);
                }}
              >
                <Text style={styles.quickDateButtonText}>7 Hari Lalu</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickDateButton}
                onPress={() => {
                  const date = new Date();
                  date.setDate(date.getDate() - 30);
                  if (datePickerType === 'start') {
                    setStartDate(date);
                  } else {
                    setEndDate(date);
                  }
                  setShowDateModal(false);
                }}
              >
                <Text style={styles.quickDateButtonText}>30 Hari Lalu</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowDateModal(false)}
            >
              <Text style={styles.closeModalButtonText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2b5597',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    marginBottom: 12,
  },
  filterScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2b5597',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#2b5597',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#2b5597',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
    gap: 6,
  },
  clearFilterText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '600',
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  historyTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  historyTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInIcon: {
    backgroundColor: '#4CAF50',
  },
  checkOutIcon: {
    backgroundColor: '#2b5597',
  },
  historyType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 13,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  historyCardBody: {
    gap: 8,
    marginBottom: 12,
  },
  historyInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyInfoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 4,
    gap: 4,
  },
  detailButtonText: {
    fontSize: 14,
    color: '#2b5597',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2b5597',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  quickDateButtons: {
    gap: 12,
    marginBottom: 20,
  },
  quickDateButton: {
    backgroundColor: '#2b5597',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickDateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeModalButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});
