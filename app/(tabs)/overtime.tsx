import React from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OvertimeHeader } from '../../components/overtime/OvertimeHeader';
import { OvertimeCard } from '../../components/overtime/OvertimeCard';
import { EmptyOvertimeState } from '../../components/overtime/EmptyOvertimeState';
import { useOvertimeList } from '../../hooks/useOvertimeList';
import { OVERTIME_COLORS } from '../../constants/overtime.constants';
import type { OvertimeRecord } from '../../types/overtime.types';

export default function OvertimeScheduleScreen() {
  const { loading, overtimes, refreshing, refetch } = useOvertimeList();

  const renderItem = ({ item }: { item: OvertimeRecord }) => (
    <OvertimeCard overtime={item} />
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
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => refetch(true)}
            colors={[OVERTIME_COLORS.PRIMARY]}
          />
        }
        ListEmptyComponent={<EmptyOvertimeState />}
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
    padding: 20,
    paddingBottom: 100,
  },
});