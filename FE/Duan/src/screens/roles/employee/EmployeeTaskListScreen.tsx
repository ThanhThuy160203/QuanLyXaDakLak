import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TaskCard } from '../../../components/TaskCard';
import { TaskFilterBar } from '../../../components/TaskFilterBar';
import { ROLE_MAP } from '../../../constants/roles';
import { useTaskStore } from '../../../store/task.store';
import { RoleKey } from '../../../types';
import { filterTasks } from '../../../utils/tasks';

const SOURCE_FILTERS = [
  { label: 'Tất cả nguồn', value: 'ALL' as const },
  { label: 'Sở', value: 'SO' as const },
  { label: 'Ban/Ngành', value: 'BAN_NGANH' as const },
  { label: 'UBND Tỉnh', value: 'UBND_TINH' as const },
  { label: 'UBND Huyện', value: 'UBND_HUYEN' as const },
  { label: 'Chủ tịch', value: 'CHU_TICH' as const },
  { label: 'Nội bộ', value: 'NOI_BO' as const },
];

type SourceFilterValue = (typeof SOURCE_FILTERS)[number]['value'];

const role: RoleKey = 'EMPLOYEE';

export const EmployeeTaskListScreen = () => {
  const tasks = useTaskStore(state => state.tasks);
  const loading = useTaskStore(state => state.loading);
  const initialized = useTaskStore(state => state.initialized);
  const error = useTaskStore(state => state.error);
  const timeframe = useTaskStore(state => state.timeframe);
  const statusScope = useTaskStore(state => state.statusScope);
  const setTimeframe = useTaskStore(state => state.setTimeframe);
  const setStatusScope = useTaskStore(state => state.setStatusScope);
  const fetchTasks = useTaskStore(state => state.fetchTasks);
  const [sourceFilter, setSourceFilter] = useState<SourceFilterValue>('ALL');

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const visibleTasks = useMemo(() => {
    const scoped = filterTasks(tasks, role, timeframe, statusScope);
    if (sourceFilter === 'ALL') {
      return scoped;
    }
    return scoped.filter(task => task.source === sourceFilter);
  }, [tasks, timeframe, statusScope, sourceFilter]);

  const roleLabel = ROLE_MAP[role]?.label ?? role;

  if (loading && !initialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D4ED8" />
        <Text style={styles.loadingText}>Đang tải danh sách nhiệm vụ...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Danh sách nhiệm vụ</Text>
      <Text style={styles.subtitle}>
        Theo dõi toàn bộ nhiệm vụ thuộc cấp {roleLabel.toLowerCase()} với bộ lọc chi tiết.
      </Text>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Không thể đồng bộ Firestore: {error}</Text>
        </View>
      ) : null}

      <TaskFilterBar
        timeframe={timeframe}
        statusScope={statusScope}
        onStatusChange={setStatusScope}
        onTimeframeChange={setTimeframe}
      />

      <View style={styles.sourceWrapper}>
        {SOURCE_FILTERS.map(filter => {
          const isActive = filter.value === sourceFilter;
          return (
            <Pressable
              key={filter.value}
              onPress={() => setSourceFilter(filter.value)}
              style={[styles.sourceChip, isActive && styles.sourceChipActive]}
            >
              <Text style={[styles.sourceLabel, isActive && styles.sourceLabelActive]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {visibleTasks.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}

      {!visibleTasks.length ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Không có nhiệm vụ phù hợp</Text>
          <Text style={styles.emptyText}>Hãy thử đổi bộ lọc hoặc nguồn giao nhiệm vụ.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    padding: 20,
    backgroundColor: '#F1F5F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F1F5F9',
  },
  loadingText: {
    marginTop: 12,
    color: '#475569',
    fontSize: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 16,
    marginTop: 4,
  },
  errorBanner: {
    borderWidth: 1,
    borderColor: '#F87171',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
  },
  sourceWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  sourceChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5F5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginTop: 8,
  },
  sourceChipActive: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0EA5E9',
  },
  sourceLabel: {
    fontSize: 12,
    color: '#0F172A',
  },
  sourceLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    color: '#0F172A',
  },
  emptyText: {
    fontSize: 13,
    color: '#475569',
  },
});
