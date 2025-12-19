import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { attendanceService } from '../../services/attendanceService';
import { authStore } from '../../store/authStore';

// --- Font Definition for Consistency (Asumsi sudah dimuat) ---
const FONT = {
  REGULAR: 'Fredoka-Regular',
  MEDIUM: 'Fredoka-Medium',
  SEMIBOLD: 'Fredoka-SemiBold',
  BOLD: 'Fredoka-Bold',
};

// Helper untuk mengkonversi waktu H:i:s (dianggap UTC 00) ke WIB (+7)
const formatWIBTime = (timeStr: string | undefined) => {
    if (!timeStr) return '-';
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
        const [hours, minutes] = timeStr.split(':');
        return `${hours}:${minutes} WIB`;
    }
    // Jika formatnya ISO string penuh 
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return '-';
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m} WIB`;
};

// Types
type HistoryRecord = {
    id: string | number;
    status: string;
    keterangan: string;
    notes?: string;
    latitude?: number;
    longitude?: number;
    area?: string;
    division?: string;
    date: string;
    time: string;
    type?: 'check_in' | 'check_out'; // Tambahkan type jika status tidak jelas
};

export default function HistoryScreen() {
    const router = useRouter();
    // State to store addresses for each record
    const [addressMap, setAddressMap] = useState<{ [key: string]: { area?: string; division?: string } }>({});

    // State for history data and filters
    const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);
    const [filterType, setFilterType] = useState<'all' | 'checkin' | 'checkout'>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [showDateModal, setShowDateModal] = useState<boolean>(false);
    const [datePickerType, setDatePickerType] = useState<'start' | 'end'>('start');

    // Helper to get area/division info
    const getAreaDivisionFromRecord = (record: HistoryRecord & { area?: string; division?: string }) => {
        const divisionText = record.division || '';
        const areaText = record.area || '';

        if (areaText && divisionText) return `${areaText} - ${divisionText.split(',')[0]}`;
        if (areaText) return areaText;
        if (divisionText) return divisionText.split(',')[0];
        return 'Lokasi Tidak Diketahui';
    };

    // Fetch area/division (Background job, tidak memblokir render utama)
    useEffect(() => {
        const fetchAreaDivision = async () => {
            const token = authStore.getState().token;
            if (!token) return;

            const updates: { [key: string]: { area?: string; division?: string } } = {};
            let shouldUpdate = false;
            
            for (const record of historyData) {
                if ((record.latitude && record.longitude) && (!record.area || !record.division)) {
                    const key = `${record.latitude},${record.longitude}`;
                    if (!addressMap[key]) {
                        try {
                            const res = await attendanceService.checkLocation(record.latitude, record.longitude);
                            updates[key] = {
                                area: res.area || undefined,
                                division: Array.isArray(res.divisions) ? res.divisions.join(', ') : (res.division || undefined)
                            };
                            shouldUpdate = true;
                        } catch {
                             // Handle error silently
                        }
                    }
                }
            }
            if (shouldUpdate) {
                setAddressMap(prev => ({ ...prev, ...updates }));
            }
        };
        fetchAreaDivision();
    }, [historyData]);

    // Fetch history from API
    const fetchHistory = async () => {
        setLoading(true);
        try {
            const authState = authStore.getState();
            if (!authState.token || !authState.user?.id) {
                setHistoryData([]);
                setLoading(false);
                return;
            }
            // Fetch more than 50 if necessary, but 50 is a good starting point for performance
            const data = await attendanceService.getAttendanceHistory(authState.token, authState.user.id, 100); 
            setHistoryData(data || []);
            
        } catch (error) {
            setHistoryData([]);
            console.error('Error fetching attendance history:', error);
            Alert.alert('Error', 'Gagal memuat riwayat. Periksa koneksi Anda.');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchHistory();
        setRefreshing(false);
    };

    // Robust and flexible filter and search logic
    const filteredData = historyData.filter((record: HistoryRecord) => {
        // 1. Filter by status/type
        const statusNorm = (record.status || '').toLowerCase();
        if (filterType === 'checkin') {
            if (!/check[_ ]?in|checkin|in/i.test(statusNorm) && record.type !== 'check_in') return false;
        }
        if (filterType === 'checkout') {
            if (!/check[_ ]?out|checkout|out/i.test(statusNorm) && record.type !== 'check_out') return false;
        }

        // 2. Filter by date range
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0); // Normalisasi agar perbandingan tepat di tanggalnya
        
        if (startDate) {
            const filterStartDate = new Date(startDate);
            filterStartDate.setHours(0, 0, 0, 0);
            if (recordDate < filterStartDate) return false;
        }
        if (endDate) {
            const filterEndDate = new Date(endDate);
            filterEndDate.setHours(23, 59, 59, 999); // Inklusif hingga akhir hari
            if (recordDate > filterEndDate) return false;
        }

        // 3. Search across all fields
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const area = record.area || '';
            const division = record.division || '';
            const status = record.status || '';
            const keterangan = record.keterangan || '';
            const notes = record.notes || '';
            const time = record.time || '';
            
            const searchTarget = [
                status,
                keterangan,
                notes,
                area,
                division,
                time,
                recordDate.toLocaleDateString('id-ID'),
                recordDate.toLocaleDateString('en-US'),
            ].join(' ').toLowerCase();
            
            if (!searchTarget.includes(q)) {
                return false;
            }
        }
        return true;
    });
    
    // Urutkan data dari terbaru ke terlama
    const sortedData = filteredData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


    const formatDateDisplay = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };
    
    const formatDateShort = (date: Date) => {
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
    };

    const clearFilters = () => {
        setFilterType('all');
        setSearchQuery('');
        setStartDate(null);
        setEndDate(null);
    };

    const getStatusTheme = (keterangan: string) => {
        const normKeterangan = keterangan ? keterangan.toLowerCase() : 'unknown';
        
        if (normKeterangan.includes('telat')) {
            return { color: '#EF4444', background: '#FEE2E2' }; // Red
        }
        if (normKeterangan.includes('tepat waktu') || normKeterangan.includes('present')) {
            return { color: '#10B981', background: '#D1FAE5' }; // Green
        }
        if (normKeterangan.includes('lebih awal')) {
            return { color: '#F59E0B', background: '#FEF3C7' }; // Orange
        }
        if (normKeterangan.includes('izin') || normKeterangan.includes('sakit')) {
            return { color: '#3B82F6', background: '#DBEAFE' }; // Blue
        }
        return { color: '#6B7280', background: '#F3F4F6' }; // Gray
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                     <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitlePro}>Riwayat Absensi</Text>
                        <Text style={styles.headerSubtitlePro}>Semua catatan absensi anda</Text>
                    </View>
                </View>
            </View>

            {/* Search Bar & Filter */}
            <View style={styles.filterBarPro}>
                <View style={styles.searchContainerPro}>
                    <Ionicons name="search" size={20} color="#999" />
                    <TextInput
                        style={styles.searchInputPro}
                        placeholder="Cari status, catatan, atau tanggal..."
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
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScrollContentPro}
                >
                    <TouchableOpacity
                        style={[styles.filterBtnPro, filterType === 'all' && styles.filterBtnActivePro]}
                        onPress={() => setFilterType('all')}
                    >
                        <Text style={[styles.filterBtnTextPro, filterType === 'all' && styles.filterBtnTextActivePro]}>Semua</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterBtnPro, filterType === 'checkin' && styles.filterBtnActivePro]}
                        onPress={() => setFilterType('checkin')}
                    >
                        <Ionicons name="log-in-outline" size={16} color={filterType === 'checkin' ? '#fff' : '#2b5597'} />
                        <Text style={[styles.filterBtnTextPro, filterType === 'checkin' && styles.filterBtnTextActivePro]}>Check In</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterBtnPro, filterType === 'checkout' && styles.filterBtnActivePro]}
                        onPress={() => setFilterType('checkout')}
                    >
                        <Ionicons name="log-out-outline" size={16} color={filterType === 'checkout' ? '#fff' : '#2b5597'} />
                        <Text style={[styles.filterBtnTextPro, filterType === 'checkout' && styles.filterBtnTextActivePro]}>Check Out</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterBtnPro, startDate && styles.filterBtnActiveDate]}
                        onPress={() => { setDatePickerType('start'); setShowDateModal(true); }}
                    >
                        <Ionicons name="calendar-outline" size={16} color={startDate ? '#fff' : '#2b5597'} />
                        <Text style={[styles.filterBtnTextPro, startDate && styles.filterBtnTextActivePro]}>{startDate ? formatDateShort(startDate) : 'Dari'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterBtnPro, endDate && styles.filterBtnActiveDate]}
                        onPress={() => { setDatePickerType('end'); setShowDateModal(true); }}
                    >
                        <Ionicons name="calendar-outline" size={16} color={endDate ? '#fff' : '#2b5597'} />
                        <Text style={[styles.filterBtnTextPro, endDate && styles.filterBtnTextActivePro]}>{endDate ? formatDateShort(endDate) : 'Sampai'}</Text>
                    </TouchableOpacity>
                    {(filterType !== 'all' || searchQuery || startDate || endDate) && (
                        <TouchableOpacity style={styles.clearFilterBtnPro} onPress={clearFilters}>
                            <Ionicons name="close" size={16} color="#EF4444" />
                            <Text style={styles.clearFilterTextPro}>Reset</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>

            {/* Results Count */}
            <View style={styles.resultsContainerPro}>
                <Text style={styles.resultsTextPro}>{sortedData.length} catatan ditemukan</Text>
            </View>

            {/* History List */}
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollViewContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2b5597"]} />
                }
            >
                {loading ? (
                     <View style={styles.emptyContainer}>
                         <ActivityIndicator size="large" color="#2b5597" />
                         <Text style={styles.emptyText}>Memuat Riwayat...</Text>
                     </View>
                ) : sortedData.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.emptyText}>Tidak ada data ditemukan</Text>
                        <Text style={styles.emptySubtext}>Coba ubah filter atau kriteria pencarian</Text>
                    </View>
                ) : (
                    sortedData.map((record) => {
                        const key = record.latitude && record.longitude ? `${record.latitude},${record.longitude}` : '';
                        const dynamicArea = key ? addressMap[key]?.area : record.area;
                        const dynamicDivision = key ? addressMap[key]?.division : record.division;
                        
                        const statusTheme = getStatusTheme(record.keterangan || (record.status.includes('out') ? 'Tepat Waktu' : 'Tepat Waktu')); // Fallback
                        const isCheckIn = record.status === 'check_in' || record.status.toLowerCase().includes('in');
                        const cardIconColor = isCheckIn ? '#10B981' : '#2b5597';
                        const hasNotes = record.notes && record.notes.trim() !== '' && record.notes !== 'null';
                        
                        return (
                        <TouchableOpacity
                            key={record.id}
                            style={styles.historyCardModern}
                            activeOpacity={0.92}
                            onPress={() => router.push({
                                pathname: '/absensi-detail',
                                params: {
                                    id: record.id,
                                    status: record.status,
                                    keterangan: record.keterangan,
                                    notes: record.notes || '',
                                    area: dynamicArea || '',
                                    division: dynamicDivision || '',
                                    date: record.date,
                                    time: record.time,
                                }
                            })}
                        >
                            <View style={styles.cardRowTop}>
                                <View style={[styles.cardIconCircle, { backgroundColor: cardIconColor }]}>
                                    <Ionicons name={isCheckIn ? 'log-in-outline' : 'log-out-outline'} size={22} color="#fff" />
                                </View>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
                                        {isCheckIn ? 'Check In' : record.status.toLowerCase().includes('out') ? 'Check Out' : (record.status.charAt(0).toUpperCase() + record.status.slice(1))}
                                    </Text>
                                    <Text style={styles.cardDate}>{formatDateDisplay(record.date)}</Text>
                                </View>
                                <View
                                    style={[
                                        styles.statusBadgeModern,
                                        { backgroundColor: statusTheme.background }
                                    ]}
                                >
                                    <Text style={[styles.statusTextModern, { color: statusTheme.color }]}>
                                        {record.keterangan}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.cardRowInfoWrap}>
                                <View style={styles.cardInfoBox}>
                                    <Ionicons name="time-outline" size={16} color="#2b5597" style={{ marginRight: 4 }} />
                                    <Text style={styles.cardInfoText} numberOfLines={1}>{formatWIBTime(record.time)}</Text>
                                </View>
                                <View style={styles.cardInfoBox}>
                                    <Ionicons name="location-outline" size={16} color="#2b5597" style={{ marginRight: 4 }} />
                                    <Text style={styles.cardInfoText} numberOfLines={1}>
                                        {getAreaDivisionFromRecord({ ...record, area: dynamicArea, division: dynamicDivision })}
                                    </Text>
                                </View>
                            </View>
                            {hasNotes && (
                                <View style={styles.cardNotesBox}>
                                    <Ionicons name="document-text-outline" size={15} color="#F59E42" style={{ marginRight: 4 }} />
                                    <Text style={styles.cardNotesLabel}>Catatan:</Text>
                                    <Text style={styles.cardNotesText} numberOfLines={1}>{record.notes}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        );
                    })
                )}
                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Date Picker Modal */}
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
                            Gunakan tombol cepat di bawah ini untuk filter cepat
                        </Text>
                        
                        <View style={styles.quickDateButtons}>
                            {/* Hari Ini */}
                            <TouchableOpacity
                                style={styles.quickDateButton}
                                onPress={() => {
                                    const date = new Date();
                                    datePickerType === 'start' ? setStartDate(date) : setEndDate(date);
                                    setShowDateModal(false);
                                }}
                            >
                                <Ionicons name="today-outline" size={20} color="#FFFFFF" />
                                <Text style={styles.quickDateButtonText}>Hari Ini</Text>
                            </TouchableOpacity>

                            {/* 7 Hari Lalu */}
                            <TouchableOpacity
                                style={styles.quickDateButton}
                                onPress={() => {
                                    const date = new Date();
                                    date.setDate(date.getDate() - 7);
                                    datePickerType === 'start' ? setStartDate(date) : setEndDate(date);
                                    setShowDateModal(false);
                                }}
                            >
                                <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
                                <Text style={styles.quickDateButtonText}>7 Hari Lalu</Text>
                            </TouchableOpacity>

                            {/* 30 Hari Lalu */}
                            <TouchableOpacity
                                style={styles.quickDateButton}
                                onPress={() => {
                                    const date = new Date();
                                    date.setDate(date.getDate() - 30);
                                    datePickerType === 'start' ? setStartDate(date) : setEndDate(date);
                                    setShowDateModal(false);
                                }}
                            >
                                <Ionicons name="calendar-number-outline" size={20} color="#FFFFFF" />
                                <Text style={styles.quickDateButtonText}>30 Hari Lalu</Text>
                            </TouchableOpacity>

                            {/* Awal Bulan Ini */}
                            <TouchableOpacity
                                style={styles.quickDateButton}
                                onPress={() => {
                                    const date = new Date();
                                    date.setDate(1); 
                                    datePickerType === 'start' ? setStartDate(date) : setEndDate(date);
                                    setShowDateModal(false);
                                }}
                            >
                                <Ionicons name="calendar-clear-outline" size={20} color="#FFFFFF" />
                                <Text style={styles.quickDateButtonText}>Awal Bulan Ini</Text>
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

// --- STYLES ---
const styles = StyleSheet.create({
    // --- Global/Layout ---
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitlePro: {
        fontSize: 22,
        color: '#2b5597',
        fontFamily: FONT.BOLD,
        marginBottom: 2,
    },
    headerSubtitlePro: {
        fontSize: 13,
        color: '#666',
        fontFamily: FONT.REGULAR,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        paddingTop: 8,
        paddingBottom: 20,
        flexGrow: 1, // Penting agar bisa di-scroll meskipun kontennya kurang dari layar
    },
    bottomSpacing: {
        height: 20,
    },
    
    // --- Filter & Search Bar ---
    filterBarPro: {
        marginTop: 10,
        marginBottom: 8,
        backgroundColor: '#FFFFFF',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        elevation: 1,
    },
    searchContainerPro: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        marginHorizontal: 20,
        marginBottom: 10,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    searchInputPro: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        color: '#333',
        fontFamily: FONT.REGULAR,
    },
    filterScrollContentPro: {
        paddingHorizontal: 20,
        gap: 8,
    },
    filterBtnPro: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        gap: 6,
    },
    filterBtnActivePro: {
        backgroundColor: '#2b5597',
        borderColor: '#2b5597',
    },
    filterBtnActiveDate: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    filterBtnTextPro: {
        fontSize: 14,
        color: '#2b5597',
        fontFamily: FONT.MEDIUM,
    },
    filterBtnTextActivePro: {
        color: '#fff',
    },
    clearFilterBtnPro: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#EF4444',
        gap: 6,
        marginLeft: 6,
    },
    clearFilterTextPro: {
        fontSize: 14,
        color: '#EF4444',
        fontFamily: FONT.MEDIUM,
    },
    resultsContainerPro: {
        paddingHorizontal: 20,
        paddingVertical: 6,
    },
    resultsTextPro: {
        fontSize: 13,
        color: '#6B7280',
        fontFamily: FONT.REGULAR,
    },
    
    // --- History Card Modern ---
    historyCardModern: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        gap: 0,
    },
    cardRowTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 10,
    },
    cardIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#2b5597', // Dynamic color set in render
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 18,
        color: '#1F2937',
        fontFamily: FONT.BOLD,
        marginBottom: 2,
    },
    cardDate: {
        fontSize: 13,
        color: '#6B7280',
        fontFamily: FONT.REGULAR,
    },
    statusBadgeModern: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        minWidth: 70,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    statusTextModern: {
        fontSize: 12,
        color: '#fff',
        fontFamily: FONT.MEDIUM,
    },
    cardRowInfoWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 6,
    },
    cardInfoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        flex: 1,
        minWidth: 0,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cardInfoText: {
        fontSize: 12,
        color: '#4B5563',
        fontFamily: FONT.MEDIUM,
        flexShrink: 1,
    },
    cardNotesBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFFBEB',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginTop: 10,
        gap: 4,
    },
    cardNotesLabel: {
        fontSize: 13,
        color: '#F59E0B',
        fontFamily: FONT.BOLD,
    },
    cardNotesText: {
        fontSize: 13,
        color: '#F59E0B',
        fontFamily: FONT.MEDIUM,
        flex: 1,
    },
    
    // --- Empty/Loading State ---
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 18,
        fontFamily: FONT.MEDIUM,
        color: '#9CA3AF',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        fontFamily: FONT.REGULAR,
        color: '#9CA3AF',
        textAlign: 'center',
    },

    // --- Modal Styles ---
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
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        color: '#2b5597',
        fontFamily: FONT.BOLD,
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#666',
        fontFamily: FONT.REGULAR,
        textAlign: 'center',
        marginBottom: 24,
    },
    quickDateButtons: {
        gap: 12,
        marginBottom: 20,
    },
    quickDateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2b5597',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    quickDateButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontFamily: FONT.MEDIUM,
    },
    closeModalButton: {
        backgroundColor: '#F5F5F5',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeModalButtonText: {
        fontSize: 16,
        color: '#666',
        fontFamily: FONT.MEDIUM,
    },
});