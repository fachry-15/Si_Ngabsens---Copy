import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyOvertimeState } from '../../components/overtime/EmptyOvertimeState';
import { FilterChips } from '../../components/overtime/FilterChips';
import { OvertimeCard } from '../../components/overtime/OvertimeCard';
import { OvertimeHeader } from '../../components/overtime/OvertimeHeader';
import { SearchBar } from '../../components/overtime/SearchBar';
import { SortButton } from '../../components/overtime/SortButton';
import { OVERTIME_COLORS } from '../../constants/overtime';
import { useOvertimeList } from '../../hooks/useOvertimeList';
import type { OvertimeRecord } from '../../types/overtime';

export default function OvertimeScheduleScreen() {
  const {
    loading,
    overtimes,
    allOvertimes,
    refreshing,
    refetch,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    sortType,
    setSortType,
    filterCounts,
  } = useOvertimeList();

  const renderItem = ({ item }: { item: OvertimeRecord }) => (
    <OvertimeCard overtime={item} />
  );

  const renderHeader = () => (
    <>
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      
      <View style={styles.filterRow}>
        <FilterChips
          selectedFilter={filterType}
          onFilterChange={setFilterType}
          counts={filterCounts}
        />
      </View>

      <View style={styles.sortRow}>
        <Text style={styles.resultText}>
          {overtimes.length} dari {allOvertimes.length} lembur
        </Text>
        <SortButton currentSort={sortType} onSortChange={setSortType} />
      </View>
    </>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <OvertimeHeader />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={OVERTIME_COLORS.PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <OvertimeHeader />

      <FlatList
        data={overtimes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => refetch(true)}
            colors={[OVERTIME_COLORS.PRIMARY]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <EmptyOvertimeState />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OVERTIME_COLORS.BG,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listPadding: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  filterRow: {
    marginBottom: 16,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 14,
    fontFamily: 'Fredoka-Medium',
    color: OVERTIME_COLORS.TEXT_SECONDARY,
  },
  emptyContainer: {
    paddingHorizontal: 20,
  },
});