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

const role: RoleKey = 'CHAIRMAN';

const SOURCE_OPTIONS = TASK_SOURCE_OPTIONS;

export const ChairmanDashboardScreen = () => {
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
		date.setDate(date.getDate() + 4);
		return date.toISOString().slice(0, 10);
	};

	const buildCreationForm = (): TaskCreationForm => ({
		title: '',
		description: '',
		assigneeRole: creationAssignableRoles[0] ?? role,
		assigneeName: '',
		department: user?.department ?? '',
		source: 'CHU_TICH',
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
		const header = `Báo cáo điều hành cấp ${roleLabel}`;
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
			<Text style={styles.sectionTitle}>Theo dõi phòng ban</Text>
			{departmentRankings.slice(0, 4).map(item => (
				<View key={item.department} style={styles.insightListRow}>
					<Text style={styles.insightListName}>{item.department || 'Chưa rõ đơn vị'}</Text>
					<Text style={styles.insightListMeta}>
						{item.completed}/{item.total} hoàn thành · {item.overdue} quá hạn
					</Text>
				</View>
			))}
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
			key: 'directive',
			title: 'Chỉ đạo khẩn',
			subtitle: 'Gửi thông báo tới phòng ban liên quan',
			accent: true,
			onPress: handleExportReport,
		},
		{
			key: 'create',
			title: 'Giao nhiệm vụ mới',
			subtitle: 'Tạo đầu việc ưu tiên cao',
			onPress: openCreationModal,
		},
		{
			key: 'refresh',
			title: 'Yêu cầu cập nhật',
			subtitle: 'Đôn đốc các phòng ban báo cáo tiến độ',
			onPress: () => fetchTasks({ force: true }),
		},
	];

	if (loading && !initialized) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#DC2626" />
				<Text style={styles.loadingText}>Đang tải dữ liệu nhiệm vụ...</Text>
			</View>
		);
	}

	return (
		<>
			<ScrollView contentContainerStyle={styles.screen}>
				<Text style={styles.greeting}>Xin chào, {user?.displayName || 'Chủ tịch'}</Text>
				<Text style={styles.subtitle}>Đây là bảng điều khiển dành riêng cho cấp {roleLabel.toLowerCase()}.</Text>

				{error ? (
					<View style={styles.errorBanner}>
						<Text style={styles.errorTitle}>Không thể đồng bộ Firestore</Text>
						<Text style={styles.errorDescription}>{error}</Text>
					</View>
				) : null}

				<View style={styles.roleSummary}>
					<Text style={styles.roleSummaryEyebrow}>Chức năng chính</Text>
					<Text style={styles.roleSummaryTitle}>Điều hành UBND xã</Text>
					<Text style={styles.roleSummaryDescription}>
						Thiết lập ưu tiên, điều phối nguồn lực và giám sát các đầu việc quan trọng nhất.
					</Text>
					<Text style={styles.roleSummaryMeta}>Đầu việc đang chờ duyệt: {metrics.inProgress}</Text>
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
						label="Hoàn thành"
						value={`${metrics.completed}`}
						helper={`${metrics.completionRate}% tỷ lệ hoàn tất`}
						accent="#15803D"
					/>
				</View>
				<View style={styles.metricRow}>
					<MetricCard label="Quá hạn" value={String(metrics.overdue)} accent="#DC2626" helper="Cần chỉ đạo gấp" />
					<MetricCard label="Sắp đến hạn" value={String(metrics.dueSoon)} accent="#F97316" helper="Theo dõi sát" />
				</View>
				<View style={styles.metricRow}>
					<MetricCard label="Đang xử lý" value={String(metrics.inProgress)} accent="#6366F1" helper="Đã nhận việc" />
					<MetricCard label="Hoàn thành trễ" value={String(metrics.completedLate)} accent="#F59E0B" helper="Cần rút kinh nghiệm" />
				</View>

				{insights}

				<AlertBanner tasks={alerts} />

				<TaskFilterBar
					timeframe={timeframe}
					statusScope={statusScope}
					onStatusChange={setStatusScope}
					onTimeframeChange={setTimeframe}
				/>

				<Text style={styles.sectionTitle}>Nhiệm vụ ưu tiên</Text>
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
					title="Giao nhiệm vụ mới"
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
						placeholder="Ví dụ: Văn phòng UBND"
					/>
					<View style={styles.modalFooter}>
						<Pressable style={styles.modalButton} onPress={() => setCreationModalVisible(false)}>
							<Text style={styles.modalButtonText}>Huỷ</Text>
						</Pressable>
						<Pressable style={[styles.modalButton, styles.modalButtonPrimary]} onPress={handleCreateTaskSubmit}>
							<Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>Giao nhiệm vụ</Text>
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
		backgroundColor: '#FEF2F2',
	},
	greeting: {
		fontSize: 22,
		fontWeight: '700',
		color: '#7F1D1D',
	},
	subtitle: {
		fontSize: 14,
		color: '#B91C1C',
		marginBottom: 16,
	},
	roleSummary: {
		borderWidth: 1,
		borderColor: '#FCA5A5',
		borderRadius: 18,
		padding: 16,
		marginBottom: 16,
		backgroundColor: '#FFFFFF',
	},
	roleSummaryEyebrow: {
		fontSize: 12,
		color: '#B91C1C',
		textTransform: 'uppercase',
		letterSpacing: 1,
		marginBottom: 6,
	},
	roleSummaryTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#7F1D1D',
	},
	roleSummaryDescription: {
		fontSize: 13,
		color: '#7C2D12',
		marginTop: 8,
		lineHeight: 20,
	},
	roleSummaryMeta: {
		fontSize: 12,
		color: '#7F1D1D',
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
		color: '#7F1D1D',
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
		borderColor: '#FECACA',
		backgroundColor: '#FFFFFF',
		padding: 16,
		marginRight: 12,
		marginBottom: 12,
	},
	quickActionCardAccent: {
		backgroundColor: '#DC2626',
		borderColor: '#DC2626',
	},
	quickActionTitle: {
		fontSize: 15,
		fontWeight: '700',
		color: '#7F1D1D',
	},
	quickActionSubtitle: {
		fontSize: 12,
		color: '#9A3412',
		marginTop: 6,
	},
	quickActionTitleLight: {
		color: '#FFFFFF',
	},
	quickActionSubtitleLight: {
		color: '#FEE2E2',
	},
	insightCard: {
		borderWidth: 1,
		borderColor: '#FED7AA',
		borderRadius: 18,
		padding: 16,
		backgroundColor: '#FFFBEB',
		marginBottom: 16,
	},
	insightListRow: {
		marginBottom: 10,
	},
	insightListName: {
		fontSize: 14,
		fontWeight: '600',
		color: '#78350F',
	},
	insightListMeta: {
		fontSize: 12,
		color: '#92400E',
		marginTop: 2,
	},
	sourceGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginTop: 8,
	},
	sourceChip: {
		borderWidth: 1,
		borderColor: '#FECACA',
		borderRadius: 12,
		paddingVertical: 6,
		paddingHorizontal: 12,
		marginRight: 8,
		marginTop: 8,
		backgroundColor: '#FFF7ED',
	},
	sourceLabel: {
		fontSize: 12,
		color: '#7C2D12',
	},
	sourceValue: {
		fontSize: 14,
		fontWeight: '700',
		color: '#C2410C',
	},
	emptyState: {
		borderRadius: 16,
		borderWidth: 1,
		borderColor: '#FECACA',
		padding: 20,
		backgroundColor: '#FFFFFF',
	},
	emptyTitle: {
		fontSize: 15,
		fontWeight: '600',
		color: '#7F1D1D',
		marginBottom: 6,
	},
	emptyDescription: {
		fontSize: 13,
		color: '#9A3412',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 32,
		backgroundColor: '#FEF2F2',
	},
	loadingText: {
		marginTop: 12,
		fontSize: 14,
		color: '#9A3412',
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
		borderColor: '#FECACA',
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 6,
		marginRight: 8,
		marginTop: 8,
	},
	chipActive: {
		backgroundColor: '#DC2626',
		borderColor: '#DC2626',
	},
	chipLabel: {
		fontSize: 12,
		color: '#7C2D12',
		fontWeight: '600',
	},
	chipLabelActive: {
		color: '#FFFFFF',
	},
	modalLabel: {
		fontSize: 13,
		color: '#7C2D12',
		fontWeight: '600',
		marginBottom: 4,
	},
	input: {
		borderWidth: 1,
		borderColor: '#FECACA',
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
		borderColor: '#FECACA',
		borderRadius: 12,
		paddingVertical: 10,
		paddingHorizontal: 16,
		marginLeft: 12,
	},
	modalButtonPrimary: {
		backgroundColor: '#DC2626',
		borderColor: '#DC2626',
	},
	modalButtonText: {
		fontSize: 13,
		fontWeight: '600',
		color: '#7C2D12',
	},
	modalButtonPrimaryText: {
		color: '#FFFFFF',
	},
});
