import { useEffect, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MetricCard } from '../../../components/MetricCard';
import { ROLE_MAP } from '../../../constants/roles';
import { getTaskSourceLabel } from '../../../constants/taskSources';
import { useTaskStore } from '../../../store/task.store';
import { RoleKey, TaskSource } from '../../../types';
import { buildTaskMetrics } from '../../../utils/tasks';

const role: RoleKey = 'DEPUTY_CHAIR';

export const DeputyChairReportScreen = () => {
  const tasks = useTaskStore(state => state.tasks);
  const loading = useTaskStore(state => state.loading);
  const initialized = useTaskStore(state => state.initialized);
  const error = useTaskStore(state => state.error);
  const fetchTasks = useTaskStore(state => state.fetchTasks);
  const timeframe = useTaskStore(state => state.timeframe);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const metrics = useMemo(() => buildTaskMetrics(tasks, role, timeframe), [tasks, timeframe]);

  const sourceBreakdown = useMemo(() => {
    const result: Record<string, number> = {};
    tasks.forEach(task => {
      if (task.assigneeRole === role || task.ownerRole === role) {
        result[task.source] = (result[task.source] || 0) + 1;
      }
    });
    return result;
  }, [tasks]);

  const departmentRanking = useMemo(() => {
    const bucket: Record<string, { completed: number; total: number }> = {};
    tasks.forEach(task => {
      if (task.assigneeRole !== role) {
        return;
      }
      bucket[task.department] = bucket[task.department] || { completed: 0, total: 0 };
      bucket[task.department].total += 1;
      if (task.status === 'COMPLETED') {
        bucket[task.department].completed += 1;
      }
    });

    return Object.entries(bucket)
      .map(([department, stats]) => ({
        department,
        rate: stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100),
        total: stats.total,
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 4);
  }, [tasks]);

  const roleLabel = ROLE_MAP[role]?.label ?? role;

  if (loading && !initialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D4ED8" />
        <Text style={styles.loadingText}>Đang tải dữ liệu báo cáo...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.title}>Báo cáo phó chủ tịch</Text>
      <Text style={styles.subtitle}>
        Tổng hợp số liệu cấp {roleLabel.toLowerCase()} trong khung thời gian đã chọn.
      </Text>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorTitle}>Không thể đồng bộ Firestore</Text>
          <Text style={styles.errorDescription}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.metricRow}>
        <MetricCard label="Tổng nhiệm vụ" value={String(metrics.total)} helper="Tính theo bộ lọc thời gian" />
        <MetricCard
          label="Hoàn thành"
          value={`${metrics.completionRate}%`}
          helper={`${metrics.completed} nhiệm vụ`}
          accent="#16A34A"
        />
      </View>
      <View style={styles.metricRow}>
        <MetricCard label="Quá hạn" value={String(metrics.overdue)} accent="#DC2626" helper="Cần đôn đốc" />
        <MetricCard label="Sắp đến hạn" value={String(metrics.dueSoon)} accent="#F97316" helper="Theo dõi 72h" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Phân loại nguồn giao</Text>
        {Object.entries(sourceBreakdown).map(([source, count]) => (
          <View key={source} style={styles.row}>
            <Text style={styles.rowLabel}>{getTaskSourceLabel(source as TaskSource)}</Text>
            <Text style={styles.rowValue}>{count}</Text>
          </View>
        ))}
        {!Object.keys(sourceBreakdown).length ? (
          <Text style={styles.emptyText}>Chưa có dữ liệu nguồn phù hợp.</Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Xếp hạng phòng ban</Text>
        {departmentRanking.map((item, index) => (
          <View key={item.department} style={styles.row}>
            <Text style={styles.rowLabel}>
              {index + 1}. {item.department}
            </Text>
            <Text style={styles.rowValue}>
              {item.rate}% ({item.total})
            </Text>
          </View>
        ))}
        {!departmentRanking.length ? (
          <Text style={styles.emptyText}>Chưa có số liệu để xếp hạng.</Text>
        ) : null}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#475569',
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
  errorTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B91C1C',
    marginBottom: 4,
  },
  errorDescription: {
    fontSize: 12,
    color: '#B91C1C',
  },
  metricRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  section: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  rowLabel: {
    fontSize: 14,
    color: '#1E293B',
  },
  rowValue: {
    fontWeight: '600',
    color: '#0F172A',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
  },
});
