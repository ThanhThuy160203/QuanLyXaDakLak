import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { AlertBanner } from '../../../components/AlertBanner';
import { BaseModal } from '../../../components/BaseModal';
import { MetricCard } from '../../../components/MetricCard';
import { TaskActionPanel } from '../../../components/TaskActionPanel';
import { TaskCard } from '../../../components/TaskCard';
import { TaskFilterBar } from '../../../components/TaskFilterBar';
import { TaskHistory } from '../../../components/TaskHistory';
import { ASSIGNABLE_ROLES_BY_LEVEL } from '../../../constants/assignmentRules';
import { ROLE_MAP } from '../../../constants/roles';
import { TASK_SOURCE_LABELS, TASK_SOURCE_OPTIONS } from '../../../constants/taskSources';
import { useAuthStore } from '../../../store/auth.store';
import { useTaskStore } from '../../../store/task.store';
import { RoleKey, TaskSource } from '../../../types';
import { buildTaskMetrics, filterTasks, getTaskUrgency } from '../../../utils/tasks';

type TaskCreationForm = {
	title: string;
	description: string;
	assigneeRole: RoleKey;
	assigneeName: string;
	department: string;
	source: TaskSource;
	dueDate: string;
};

const role: RoleKey = 'AGGREGATOR';

const SOURCE_OPTIONS = TASK_SOURCE_OPTIONS;

export const AggregatorDashboardScreen = () => {
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
	const createTask = useTaskStore(state => state.createTask);

	const creationAssignableRoles = ASSIGNABLE_ROLES_BY_LEVEL[role] ?? [];
	const canCreateTask = ['CHAIRMAN', 'AGGREGATOR'].includes(role);

	const buildDefaultDueDate = () => {
		const date = new Date();
		date.setDate(date.getDate() + 5);
		return date.toISOString().slice(0, 10);
	};

	const buildCreationForm = (): TaskCreationForm => ({
		title: '',
		description: '',
		assigneeRole: creationAssignableRoles[0] ?? role,
		assigneeName: '',
		department: user?.department ?? '',
		source: 'NOI_BO',
		dueDate: buildDefaultDueDate(),
	});

	const [creationForm, setCreationForm] = useState<TaskCreationForm>(() => buildCreationForm());
	const [creationModalVisible, setCreationModalVisible] = useState(false);

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

	const performanceByAssignee = useMemo(() => {
		const buckets = new Map<string, { name: string; department: string; total: number; completed: number; overdue: number }>();
		roleScopedTasks.forEach(task => {
			const key = `${task.assigneeName}-${task.department}`;
			const bucket =
				buckets.get(key) ?? {
					name: task.assigneeName,
					department: task.department,
					total: 0,
					completed: 0,
					overdue: 0,
				};
			bucket.total += 1;
			if (task.status === 'COMPLETED') {
				bucket.completed += 1;
			}
			if (getTaskUrgency(task) === 'OVERDUE' && task.status !== 'COMPLETED') {
				bucket.overdue += 1;
			}
			buckets.set(key, bucket);
		});
		return Array.from(buckets.values()).sort((a, b) => {
			if (b.completed !== a.completed) {
				return b.completed - a.completed;
			}
			return a.overdue - b.overdue;
		});
	}, [roleScopedTasks]);

	const departmentRankings = useMemo(() => {
		const buckets = new Map<string, { department: string; total: number; completed: number; overdue: number }>();
		roleScopedTasks.forEach(task => {
			const bucket =
				buckets.get(task.department) ?? {
					department: task.department,
					total: 0,
					completed: 0,
					overdue: 0,
				};
			bucket.total += 1;
			if (task.status === 'COMPLETED') {
				bucket.completed += 1;
			}
			if (getTaskUrgency(task) === 'OVERDUE' && task.status !== 'COMPLETED') {
				bucket.overdue += 1;
			}
			buckets.set(task.department, bucket);
		});
		return Array.from(buckets.values()).sort((a, b) => {
			const ratioA = a.total === 0 ? 0 : a.completed / a.total;
			const ratioB = b.total === 0 ? 0 : b.completed / b.total;
			if (ratioB !== ratioA) {
				return ratioB - ratioA;
			}
			return a.overdue - b.overdue;
		});
	}, [roleScopedTasks]);

	const sourceDistribution = useMemo(() => {
		const buckets = new Map<TaskSource, number>();
		roleScopedTasks.forEach(task => {
			buckets.set(task.source, (buckets.get(task.source) ?? 0) + 1);
		});
		return Array.from(buckets.entries()).map(([source, total]) => ({ source, total }));
	}, [roleScopedTasks]);

	const roleDetails = ROLE_MAP[role];
	const roleLabel = roleDetails?.label ?? role;

	const handleExportReport = async () => {
		const header = `Báo cáo điều phối cấp ${roleLabel}`;
		const lines = roleScopedTasks.map(task => {
			const due = format(new Date(task.dueDate), 'dd/MM/yyyy');
			return `• ${task.title} (${task.status}) - ${task.assigneeName} · Hạn ${due}`;
		});
		try {
			await Share.share({
				message: [header, '', lines.join('\n') || 'Hiện không có nhiệm vụ trong bộ lọc.'].join('\n'),
			});
		} catch (shareError) {
			console.warn('Share failed', shareError);
		}
	};

	const openCreationModal = () => {
		setCreationForm(buildCreationForm());
		setCreationModalVisible(true);
	};

	const handleCreateTaskSubmit = () => {
		if (!user) {
			Alert.alert('Cần đăng nhập', 'Vui lòng đăng nhập để tạo nhiệm vụ.');
			return;
		}
		if (!creationForm.title.trim() || !creationForm.assigneeName.trim()) {
			Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề và người nhận.');
			return;
		}
		try {
			const isoDueDate = new Date(creationForm.dueDate).toISOString();
			const result = createTask(
				{
					title: creationForm.title,
					description: creationForm.description,
					ownerRole: role,
					assigneeRole: creationForm.assigneeRole,
					assigneeName: creationForm.assigneeName,
					department: creationForm.department || user.department || 'Chưa phân phòng',
					source: creationForm.source,
					dueDate: isoDueDate,
				},
				user,
			);
			if (result) {
				Alert.alert('Đã tạo nhiệm vụ', `Mã định danh ${result.id}`);
				setCreationModalVisible(false);
			}
		} catch {
			Alert.alert('Không thể tạo nhiệm vụ', 'Vui lòng thử lại sau.');
		}
	};

	const insights = (
		<View style={styles.insightCard}>
			<Text style={styles.sectionTitle}>Tổng quan hệ thống</Text>
			{departmentRankings.slice(0, 5).map(item => (
				<View key={item.department} style={styles.insightListRow}>
					<Text style={styles.insightListName}>{item.department || 'Chưa rõ đơn vị'}</Text>
					<Text style={styles.insightListMeta}>
						{item.completed}/{item.total} hoàn thành · {item.overdue} quá hạn
					</Text>
				</View>
			))}
			{performanceByAssignee.length ? (
				<View style={styles.insightListRow}>
					<Text style={styles.sectionSubtitle}>Nhân sự nổi bật</Text>
					{performanceByAssignee.slice(0, 3).map(item => (
						<View key={`${item.name}-${item.department}`} style={styles.personRow}>
							<Text style={styles.personName}>{item.name}</Text>
							<Text style={styles.personMeta}>
								{item.department || 'Chưa rõ đơn vị'} · {item.completed}/{item.total} nhiệm vụ
							</Text>
						</View>
					))}
				</View>
			) : null}
			{sourceDistribution.length ? (
				<View style={styles.sourceGrid}>
					{sourceDistribution.map(item => (
						<View key={item.source} style={styles.sourceChip}>
							<Text style={styles.sourceLabel}>{TASK_SOURCE_LABELS[item.source]}</Text>
							<Text style={styles.sourceValue}>{item.total}</Text>
						</View>
					))}
				</View>
			) : null}
		</View>
	);

	const quickActions = [
		{
			key: 'export',
			title: 'Xuất báo cáo',
			subtitle: 'Gửi thống kê nhanh cho lãnh đạo',
			accent: true,
			onPress: handleExportReport,
		},
		{
			key: 'modal',
			title: 'Tạo nhiệm vụ',
			subtitle: 'Giao việc mới cho đơn vị bên dưới',
			onPress: openCreationModal,
		},
		{
			key: 'refresh',
			title: 'Đồng bộ Firestore',
			subtitle: 'Làm mới dữ liệu mới nhất',
			onPress: () => fetchTasks({ force: true }),
		},
	];

	if (loading && !initialized) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#1D4ED8" />
				<Text style={styles.loadingText}>Đang tải dữ liệu nhiệm vụ...</Text>
			</View>
		);
	}

	return (
		<>
			<ScrollView contentContainerStyle={styles.screen}>
				<Text style={styles.greeting}>Xin chào, {user?.displayName || 'cán bộ điều phối'}</Text>
				<Text style={styles.subtitle}>Bạn đang giám sát góc nhìn của cấp {roleLabel.toLowerCase()}.</Text>

				{error ? (
					<View style={styles.errorBanner}>
						<Text style={styles.errorTitle}>Không thể đồng bộ Firestore</Text>
						<Text style={styles.errorDescription}>{error}</Text>
					</View>
				) : null}

				<View style={styles.roleSummary}>
					<Text style={styles.roleSummaryEyebrow}>Chức năng chính</Text>
					<Text style={styles.roleSummaryTitle}>Điều phối & đôn đốc toàn xã</Text>
					<Text style={styles.roleSummaryDescription}>
						Theo dõi luồng nhiệm vụ giữa các phòng ban, phát hiện nút thắt và kích hoạt hành động khẩn cấp.
					</Text>
					<Text style={styles.roleSummaryMeta}>Tổng nhiệm vụ đang quản lý: {metrics.total}</Text>
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
				<View style={styles.metricRow}>
					<MetricCard label="Đang xử lý" value={String(metrics.inProgress)} accent="#6366F1" helper="Đã nhận việc" />
					<MetricCard label="Hoàn thành" value={String(metrics.completed)} helper="Tổng số nhiệm vụ hoàn tất" />
				</View>

				{insights}

				<AlertBanner tasks={alerts} />

				<TaskFilterBar
					timeframe={timeframe}
					statusScope={statusScope}
					onStatusChange={setStatusScope}
					onTimeframeChange={setTimeframe}
				/>

				<Text style={styles.sectionTitle}>Nhiệm vụ nổi bật</Text>
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

			{canCreateTask ? (
				<BaseModal
					visible={creationModalVisible}
					title="Tạo nhiệm vụ mới"
					onClose={() => setCreationModalVisible(false)}
				>
					<Text style={styles.modalLabel}>Tiêu đề</Text>
					<TextInput
						style={styles.input}
						value={creationForm.title}
						onChangeText={value => setCreationForm(prev => ({ ...prev, title: value }))}
						placeholder="Nhập tiêu đề nhiệm vụ"
					/>
					<Text style={styles.modalLabel}>Mô tả</Text>
					<TextInput
						style={[styles.input, styles.multiline]}
						value={creationForm.description}
						onChangeText={value => setCreationForm(prev => ({ ...prev, description: value }))}
						placeholder="Nội dung chi tiết"
						multiline
					/>
					<Text style={styles.modalLabel}>Nguồn giao</Text>
					<View style={styles.chipRow}>
						{SOURCE_OPTIONS.map(option => {
							const isActive = creationForm.source === option.value;
							return (
								<Pressable
									key={option.value}
									onPress={() => setCreationForm(prev => ({ ...prev, source: option.value }))}
									style={[styles.chip, isActive && styles.chipActive]}
								>
									<Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>{option.label}</Text>
								</Pressable>
							);
						})}
					</View>
					<Text style={styles.modalLabel}>Hạn hoàn thành (YYYY-MM-DD)</Text>
					<TextInput
						style={styles.input}
						value={creationForm.dueDate}
						onChangeText={value => setCreationForm(prev => ({ ...prev, dueDate: value }))}
						placeholder="2026-03-01"
					/>
					<Text style={styles.modalLabel}>Giao cho cấp</Text>
					<View style={styles.chipRow}>
						{creationAssignableRoles.map(option => {
							const isActive = creationForm.assigneeRole === option;
							return (
								<Pressable
									key={option}
									onPress={() => setCreationForm(prev => ({ ...prev, assigneeRole: option }))}
									style={[styles.chip, isActive && styles.chipActive]}
								>
									<Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>{ROLE_MAP[option]?.label ?? option}</Text>
								</Pressable>
							);
						})}
					</View>
					<Text style={styles.modalLabel}>Người phụ trách</Text>
					<TextInput
						style={styles.input}
						value={creationForm.assigneeName}
						onChangeText={value => setCreationForm(prev => ({ ...prev, assigneeName: value }))}
						placeholder="Tên cán bộ nhận việc"
					/>
					<Text style={styles.modalLabel}>Phòng ban</Text>
					<TextInput
						style={styles.input}
						value={creationForm.department}
						onChangeText={value => setCreationForm(prev => ({ ...prev, department: value }))}
						placeholder="Ví dụ: Tư pháp"
					/>
					<View style={styles.modalFooter}>
						<Pressable style={styles.modalButton} onPress={() => setCreationModalVisible(false)}>
							<Text style={styles.modalButtonText}>Huỷ</Text>
						</Pressable>
						<Pressable style={[styles.modalButton, styles.modalButtonPrimary]} onPress={handleCreateTaskSubmit}>
							<Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>Tạo nhiệm vụ</Text>
						</Pressable>
					</View>
				</BaseModal>
			) : null}
		</>
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
	quickActions: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginBottom: 16,
	},
	quickActionCard: {
		flex: 1,
		minWidth: 160,
		borderRadius: 18,
		borderWidth: 1,
		borderColor: '#E2E8F0',
		backgroundColor: '#FFFFFF',
		padding: 16,
		marginRight: 12,
		marginBottom: 12,
	},
	quickActionCardAccent: {
		backgroundColor: '#1D4ED8',
		borderColor: '#1D4ED8',
	},
	quickActionTitle: {
		fontSize: 15,
		fontWeight: '700',
		color: '#0F172A',
	},
	quickActionSubtitle: {
		fontSize: 12,
		color: '#475569',
		marginTop: 6,
	},
	quickActionTitleLight: {
		color: '#FFFFFF',
	},
	quickActionSubtitleLight: {
		color: '#E0E7FF',
	},
	insightCard: {
		borderWidth: 1,
		borderColor: '#E2E8F0',
		borderRadius: 18,
		padding: 16,
		backgroundColor: '#FFFFFF',
		marginBottom: 16,
	},
	insightListRow: {
		marginBottom: 10,
	},
	sectionSubtitle: {
		fontSize: 13,
		fontWeight: '700',
		color: '#0F172A',
		marginBottom: 6,
	},
	personRow: {
		marginBottom: 8,
	},
	personName: {
		fontSize: 13,
		fontWeight: '600',
		color: '#0F172A',
	},
	personMeta: {
		fontSize: 12,
		color: '#475569',
	},
	insightListName: {
		fontSize: 14,
		fontWeight: '600',
		color: '#0F172A',
	},
	insightListMeta: {
		fontSize: 12,
		color: '#475569',
		marginTop: 2,
	},
	sourceGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginTop: 8,
	},
	sourceChip: {
		borderWidth: 1,
		borderColor: '#CBD5F5',
		borderRadius: 12,
		paddingVertical: 6,
		paddingHorizontal: 12,
		marginRight: 8,
		marginTop: 8,
		backgroundColor: '#EFF6FF',
	},
	sourceLabel: {
		fontSize: 12,
		color: '#1E3A8A',
	},
	sourceValue: {
		fontSize: 14,
		fontWeight: '700',
		color: '#1D4ED8',
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
	errorBanner: {
		borderWidth: 1,
		borderColor: '#F87171',
		backgroundColor: '#FEF2F2',
		padding: 12,
		borderRadius: 12,
		marginBottom: 16,
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
	chipRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginBottom: 12,
	},
	chip: {
		borderWidth: 1,
		borderColor: '#CBD5F5',
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 6,
		marginRight: 8,
		marginTop: 8,
	},
	chipActive: {
		backgroundColor: '#1D4ED8',
		borderColor: '#1D4ED8',
	},
	chipLabel: {
		fontSize: 12,
		color: '#0F172A',
		fontWeight: '600',
	},
	chipLabelActive: {
		color: '#FFFFFF',
	},
	modalLabel: {
		fontSize: 13,
		color: '#475569',
		fontWeight: '600',
		marginBottom: 4,
	},
	input: {
		borderWidth: 1,
		borderColor: '#CBD5F5',
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 14,
		marginBottom: 12,
		backgroundColor: '#FFFFFF',
	},
	multiline: {
		height: 100,
		textAlignVertical: 'top',
	},
	modalFooter: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
	},
	modalButton: {
		borderWidth: 1,
		borderColor: '#CBD5F5',
		borderRadius: 12,
		paddingVertical: 10,
		paddingHorizontal: 16,
		marginLeft: 12,
	},
	modalButtonPrimary: {
		backgroundColor: '#1D4ED8',
		borderColor: '#1D4ED8',
	},
	modalButtonText: {
		fontSize: 13,
		fontWeight: '600',
		color: '#0F172A',
	},
	modalButtonPrimaryText: {
		color: '#FFFFFF',
	},
});
