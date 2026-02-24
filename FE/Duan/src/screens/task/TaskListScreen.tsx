import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TaskCard } from '../../components/TaskCard';
import { TaskFilterBar } from '../../components/TaskFilterBar';
import { ROLE_MAP } from '../../constants/roles';
import { useTaskStore } from '../../store/task.store';
import { filterTasks } from '../../utils/tasks';

const SOURCE_FILTERS = [
	{ label: 'Tất cả nguồn', value: 'ALL' as const },
	{ label: 'Sở/Ban/Ngành', value: 'SO' as const },
	{ label: 'UBND Tỉnh', value: 'UBND_TINH' as const },
	{ label: 'UBND Huyện', value: 'UBND_HUYEN' as const },
	{ label: 'Chủ tịch', value: 'CHU_TICH' as const },
	{ label: 'Nội bộ', value: 'NOI_BO' as const },
];

type SourceFilterValue = (typeof SOURCE_FILTERS)[number]['value'];

export const TaskListScreen = () => {
	const tasks = useTaskStore(state => state.tasks);
	const roleView = useTaskStore(state => state.roleView);
	const timeframe = useTaskStore(state => state.timeframe);
	const statusScope = useTaskStore(state => state.statusScope);
	const setTimeframe = useTaskStore(state => state.setTimeframe);
	const setStatusScope = useTaskStore(state => state.setStatusScope);
	const [sourceFilter, setSourceFilter] = useState<SourceFilterValue>('ALL');

	const visibleTasks = useMemo(() => {
		const scoped = filterTasks(tasks, roleView, timeframe, statusScope);
		if (sourceFilter === 'ALL') {
			return scoped;
		}
		return scoped.filter(task => task.source === sourceFilter);
	}, [tasks, roleView, timeframe, statusScope, sourceFilter]);

	const roleLabel = ROLE_MAP[roleView]?.label ?? roleView;

	return (
		<ScrollView contentContainerStyle={styles.screen}>
			<Text style={styles.title}>Danh sách nhiệm vụ</Text>
			<Text style={styles.subtitle}>
				Theo dõi toàn bộ nhiệm vụ thuộc cấp {roleLabel.toLowerCase()} với bộ lọc chi tiết.
			</Text>

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
							<Text style={[styles.sourceLabel, isActive && styles.sourceLabelActive]}>
								{filter.label}
							</Text>
						</Pressable>
					);
				})}
			</View>

			{visibleTasks.map(task => (
				<TaskCard key={task.id} task={task} />
			))}

			{!visibleTasks.length && (
				<View style={styles.emptyState}>
					<Text style={styles.emptyTitle}>Không có nhiệm vụ phù hợp</Text>
					<Text style={styles.emptyText}>Hãy thử đổi bộ lọc hoặc nguồn giao nhiệm vụ.</Text>
				</View>
			)}
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	screen: {
		padding: 20,
		backgroundColor: '#F1F5F9',
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
