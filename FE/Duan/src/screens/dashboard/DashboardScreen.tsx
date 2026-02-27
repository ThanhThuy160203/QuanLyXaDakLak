import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AlertBanner } from '../../components/AlertBanner';
import { MetricCard } from '../../components/MetricCard';
import { TaskCard } from '../../components/TaskCard';
import { TaskFilterBar } from '../../components/TaskFilterBar';
import { ROLE_MAP } from '../../constants/roles';
import { useAuthStore } from '../../store/auth.store';
import { useTaskStore } from '../../store/task.store';
import { buildTaskMetrics, filterTasks, getTaskUrgency } from '../../utils/tasks';

export const DashboardScreen = () => {
	const user = useAuthStore(state => state.user);
	const tasks = useTaskStore(state => state.tasks);
	const timeframe = useTaskStore(state => state.timeframe);
	const statusScope = useTaskStore(state => state.statusScope);
	const roleView = useTaskStore(state => state.roleView);
	const setTimeframe = useTaskStore(state => state.setTimeframe);
	const setStatusScope = useTaskStore(state => state.setStatusScope);
	const setRoleView = useTaskStore(state => state.setRoleView);

	useEffect(() => {
		if (user?.role) {
			setRoleView(user.role);
		}
	}, [user?.role, setRoleView]);

	const metrics = useMemo(() => buildTaskMetrics(tasks, roleView, timeframe), [
		tasks,
		roleView,
		timeframe,
	]);

	const visibleTasks = useMemo(
		() => filterTasks(tasks, roleView, timeframe, statusScope),
		[tasks, roleView, timeframe, statusScope],
	);

	const alerts = useMemo(
		() =>
			visibleTasks.filter(task => {
				const urgency = getTaskUrgency(task);
				return urgency === 'OVERDUE' || urgency === 'DUE_SOON';
			}),
		[visibleTasks],
	);

	const roleDetails = ROLE_MAP[roleView];
	const roleLabel = roleDetails?.label ?? 'Nhân viên';

	return (
		<ScrollView contentContainerStyle={styles.screen}>
			<Text style={styles.greeting}>Xin chào, {user?.displayName || 'cán bộ'}</Text>
			<Text style={styles.subtitle}>
				Bạn đang xem góc nhìn của cấp {roleLabel.toLowerCase()}.
			</Text>

			<View style={styles.roleSummary}>
				<Text style={styles.roleSummaryEyebrow}>Phân quyền hiện tại</Text>
				<Text style={styles.roleSummaryTitle}>{roleLabel}</Text>
				<Text style={styles.roleSummaryDescription}>
					{roleDetails?.description ?? 'Hệ thống đang áp dụng phân quyền mặc định cho tài khoản này.'}
				</Text>
				{user?.department && <Text style={styles.roleSummaryMeta}>Đơn vị: {user.department}</Text>}
				<Text style={styles.roleSummaryNote}>
					Liên hệ quản trị viên nếu phân quyền chưa chính xác. Bạn không thể tự chọn cấp hiển thị.
				</Text>
			</View>

			<View style={styles.metricRow}>
				<MetricCard label="Tổng nhiệm vụ" value={String(metrics.total)} helper="Theo bộ lọc hiện tại" />
				<MetricCard
					label="Hoàn thành"
					value={`${metrics.completionRate}%`}
					helper={`${metrics.completed} nhiệm vụ đã hoàn tất`}
					accent="#16A34A"
				/>
			</View>
			<View style={styles.metricRow}>
				<MetricCard label="Quá hạn" value={String(metrics.overdue)} accent="#DC2626" helper="Cần xử lý ngay" />
				<MetricCard
					label="Sắp đến hạn"
					// value={String(metrics.dueSoon)}
					value={`${metrics.dueSoon}`}
					accent="#F97316"
					helper="Theo dõi sát để tránh trễ"
				/>
			</View>

			<AlertBanner tasks={alerts} />

			<TaskFilterBar
				timeframe={timeframe}
				statusScope={statusScope}
				onStatusChange={setStatusScope}
				onTimeframeChange={setTimeframe}
			/>

			<Text style={styles.sectionTitle}>Nhiệm vụ nổi bật</Text>
			{visibleTasks.map(task => (
				<TaskCard key={task.id} task={task} />
			))}

			{!visibleTasks.length && (
				<View style={styles.emptyState}>
					<Text style={styles.emptyTitle}>Chưa có nhiệm vụ phù hợp bộ lọc</Text>
					<Text style={styles.emptyDescription}>
						Thử thay đổi phạm vi thời gian hoặc trạng thái để tìm nhiệm vụ khác.
					</Text>
				</View>
			)}
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	screen: {
		padding: 20,
		backgroundColor: '#F8FAFC',
	},
	greeting: {
		fontSize: 22,
		fontWeight: '700',
		color: '#0F172A',
	},
	subtitle: {
		fontSize: 14,
		color: '#64748B',
		marginBottom: 16,
	},
	roleSummary: {
		borderWidth: 1,
		borderColor: '#E2E8F0',
		borderRadius: 18,
		padding: 16,
		marginBottom: 16,
		backgroundColor: '#FFFFFF',
	},
	roleSummaryEyebrow: {
		fontSize: 12,
		color: '#94A3B8',
		textTransform: 'uppercase',
		letterSpacing: 1,
		marginBottom: 6,
	},
	roleSummaryTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#0F172A',
	},
	roleSummaryDescription: {
		fontSize: 13,
		color: '#475569',
		marginTop: 8,
		lineHeight: 20,
	},
	roleSummaryMeta: {
		fontSize: 12,
		color: '#0F172A',
		marginTop: 10,
		fontWeight: '600',
	},
	roleSummaryNote: {
		fontSize: 12,
		color: '#94A3B8',
		marginTop: 6,
	},
	metricRow: {
		flexDirection: 'row',
		marginBottom: 12,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: '#0F172A',
		marginBottom: 12,
		marginTop: 8,
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
		color: '#0F172A',
		marginBottom: 6,
	},
	emptyDescription: {
		fontSize: 13,
		color: '#475569',
	},
});
