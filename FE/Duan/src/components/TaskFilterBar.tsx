import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusFilter, TimeframeFilter } from '../types';

const timeframeOptions: { label: string; value: TimeframeFilter }[] = [
  { label: 'Tháng', value: 'MONTH' },
  { label: 'Quý', value: 'QUARTER' },
  { label: 'Năm', value: 'YEAR' },
];

const statusOptions: { label: string; value: StatusFilter }[] = [
  { label: 'Toàn bộ', value: 'ALL' },
  { label: 'Quá hạn', value: 'OVERDUE' },
  { label: 'Sắp đến hạn', value: 'DUE_SOON' },
];

interface TaskFilterBarProps {
  timeframe: TimeframeFilter;
  statusScope: StatusFilter;
  onTimeframeChange: (value: TimeframeFilter) => void;
  onStatusChange: (value: StatusFilter) => void;
}

export const TaskFilterBar = ({
  timeframe,
  statusScope,
  onStatusChange,
  onTimeframeChange,
}: TaskFilterBarProps) => (
  <View style={styles.container}>
    <View style={styles.filterGroup}>
      <Text style={styles.groupLabel}>Bộ lọc thời gian</Text>
      <View style={styles.chipRow}>
        {timeframeOptions.map(option => {
          const isActive = option.value === timeframe;
          return (
            <Pressable
              key={option.value}
              onPress={() => onTimeframeChange(option.value)}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>

    <View style={styles.filterGroup}>
      <Text style={styles.groupLabel}>Mức độ</Text>
      <View style={styles.chipRow}>
        {statusOptions.map(option => {
          const isActive = option.value === statusScope;
          return (
            <Pressable
              key={option.value}
              onPress={() => onStatusChange(option.value)}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  filterGroup: {
    marginBottom: 12,
  },
  groupLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
  },
  chip: {
    borderWidth: 1,
    borderColor: '#CBD5F5',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  chipLabel: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
  },
  chipLabelActive: {
    color: '#FFFFFF',
  },
});
