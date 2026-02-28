import { format } from 'date-fns';
import { useEffect, useMemo } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { AlertBanner } from '../../../components/AlertBanner';
import { MetricCard } from '../../../components/MetricCard';
import { TaskActionPanel } from '../../../components/TaskActionPanel';
import { TaskCard } from '../../../components/TaskCard';
import { TaskFilterBar } from '../../../components/TaskFilterBar';
import { TaskHistory } from '../../../components/TaskHistory';
import { ROLE_MAP } from '../../../constants/roles';
import { useAuthStore } from '../../../store/auth.store';
import { useTaskStore } from '../../../store/task.store';
import { RoleKey } from '../../../types';
import { buildTaskMetrics, filterTasks, getTaskUrgency } from '../../../utils/tasks';

const role: RoleKey = 'EMPLOYEE';

export const EmployeeDashboardScreen = () => {
  const user = useAuthStore(state => state.user);
  const tasks = useTaskStore(state => state.tasks);
  const loading = useTaskStore(state => state.loading);
  const error = useTaskStore(state => state.error);
  const initialized = useTaskStore(state => state.initialized);
  const timeframe = useTaskStore(state => state.timeframe);
  const statusScope = useTaskStore(state => state.statusScope);
  const setTimeframe = useTaskStore(state => state.setTimeframe);
  const setStatusScope = useTaskStore(state => state.setStatusScope);
  const fetchTasks = useTaskStore(state => state.fetchTasks);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const metrics = useMemo(() => buildTaskMetrics(tasks, role, timeframe), [tasks, timeframe]);

  const roleScopedTasks = useMemo(
    () => filterTasks(tasks, role, timeframe, 'ALL'),
    [tasks, timeframe],
  );

  const visibleTasks = useMemo(
    () => filterTasks(tasks, role, timeframe, statusScope),
    [tasks, timeframe, statusScope],
  );

  const alerts = useMemo(
    () =>
      visibleTasks.filter(task => {
        const urgency = getTaskUrgency(task);
        return urgency === 'OVERDUE' || urgency === 'DUE_SOON';
      }),
    [visibleTasks],
  );

  const roleDetails = ROLE_MAP[role];
  const roleLabel = roleDetails?.label ?? role;

  const handleExportReport = async () => {
    const header = `Báo cáo nhiệm vụ cá nhân`;
    const lines = roleScopedTasks.map(task => {
      const due = format(new Date(task.dueDate), 'dd/MM/yyyy');
      return `• ${task.title} (${task.status}) · Hạn ${due}`;
    });
    try {
      await Share.share({
        message: [header, '', lines.join('\n') || 'Hiện không có nhiệm vụ trong bộ lọc.'].join('\n'),
      });
    } catch (shareError) {
      console.warn('Share failed', shareError);
    }
  };

  const quickActions = [
    {
      key: 'report',
      title: 'Chia sẻ tiến độ',
      subtitle: 'Gửi danh sách nhiệm vụ đã chọn',
      accent: true,
      onPress: handleExportReport,
    },
    {
      key: 'refresh',
      title: 'Làm mới dữ liệu',
      subtitle: 'Đồng bộ trạng thái mới nhất',
      accent: false,
      onPress: () => fetchTasks({ force: true }),
    },
  ];

  const insights = (
    <View style={styles.insightCard}>
      <Text style={styles.sectionTitle}>Kết quả cá nhân</Text>
      <View style={styles.insightRow}>
        <Text style={styles.insightStat}>Đúng hạn: {metrics.completedOnTime}</Text>
        <Text style={styles.insightStat}>Trễ hạn: {metrics.completedLate}</Text>
        <Text style={styles.insightStat}>Đang xử lý: {metrics.inProgress}</Text>
      </View>
    </View>
  );

  if (loading && !initialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1D4ED8" />
        <Text style={styles.loadingText}>Đang tải dữ liệu nhiệm vụ...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.greeting}>Xin chào, {user?.displayName || 'Cán bộ'}</Text>
      <Text style={styles.subtitle}>Đây là góc nhìn dành riêng cho cấp {roleLabel.toLowerCase()}.</Text>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorTitle}>Không thể đồng bộ Firestore</Text>
          <Text style={styles.errorDescription}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.roleSummary}>
        <Text style={styles.roleSummaryEyebrow}>Phân quyền hiện tại</Text>
        <Text style={styles.roleSummaryTitle}>{roleLabel}</Text>
        <Text style={styles.roleSummaryDescription}>
          {roleDetails?.description ?? 'Hệ thống đang áp dụng phân quyền mặc định cho tài khoản này.'}
        </Text>
        {user?.department ? <Text style={styles.roleSummaryMeta}>Đơn vị: {user.department}</Text> : null}
        <Text style={styles.roleSummaryNote}>Liên hệ quản trị viên nếu phân quyền chưa chính xác.</Text>
      </View>

      <View style={styles.quickActions}>
        {quickActions.map(action => (
          <Pressable
            key={action.key}
            onPress={action.onPress}
            style={[styles.quickActionCard, action.accent && styles.quickActionCardAccent]}
          >
            <Text style={[styles.quickActionTitle, action.accent && styles.quickActionTitleLight]}>{action.title}</Text>
            <Text style={[styles.quickActionSubtitle, action.accent && styles.quickActionSubtitleLight]}>
              {action.subtitle}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.metricRow}>
        <MetricCard label="Tổng nhiệm vụ" value={String(metrics.total)} helper="Theo bộ lọc hiện tại" />
        <MetricCard
          label="Tỷ lệ hoàn thành"
          value={`${metrics.completionRate}%`}
          helper={`${metrics.completed} nhiệm vụ đã hoàn tất`}
          accent="#16A34A"
        />
      </View>
      <View style={styles.metricRow}>
        <MetricCard label="Quá hạn" value={String(metrics.overdue)} accent="#DC2626" helper="Cần xử lý ngay" />
        <MetricCard label="Sắp đến hạn" value={String(metrics.dueSoon)} accent="#F97316" helper="Theo dõi sát" />
      </View>

      {insights}

      <AlertBanner tasks={alerts} />

      <TaskFilterBar
        timeframe={timeframe}
        statusScope={statusScope}
        onStatusChange={setStatusScope}
        onTimeframeChange={setTimeframe}
      />

      <Text style={styles.sectionTitle}>Nhiệm vụ của bạn</Text>
      {visibleTasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          footer={
            <View>
              <TaskActionPanel task={task} role={role} />
              <TaskHistory taskId={task.id} />
            </View>
          }
        />
      ))}

      {!visibleTasks.length ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Không có nhiệm vụ phù hợp</Text>
          <Text style={styles.emptyDescription}>Hãy thử đổi bộ lọc hoặc thời gian thống kê.</Text>
        </View>
      ) : null}
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
  greeting: {
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
  roleSummary: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  roleSummaryEyebrow: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  roleSummaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },
  roleSummaryDescription: {
    fontSize: 14,
    color: '#334155',
    marginTop: 8,
  },
  roleSummaryMeta: {
    fontSize: 13,
    color: '#0F172A',
    marginTop: 8,
  },
  roleSummaryNote: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },
  quickActionCardAccent: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  quickActionTitleLight: {
    color: '#FFFFFF',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#475569',
  },
  quickActionSubtitleLight: {
    color: '#E0E7FF',
  },
  metricRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  insightCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightStat: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    color: '#0F172A',
  },
  emptyDescription: {
    fontSize: 13,
    color: '#475569',
  },
});
