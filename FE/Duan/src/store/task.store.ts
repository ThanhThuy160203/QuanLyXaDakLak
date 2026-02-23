import { create } from 'zustand';
import { SAMPLE_TASKS } from '../constants/sampleData';
import { ROLE_ORDER } from '../constants/roles';
import {
	RoleKey,
	StatusFilter,
	Task,
	TaskMetrics,
	TimeframeFilter,
} from '../types';
import { buildTaskMetrics, filterTasks, getTaskUrgency } from '../utils/tasks';

type TaskStoreState = {
	tasks: Task[];
	timeframe: TimeframeFilter;
	statusScope: StatusFilter;
	roleView: RoleKey;
	setTimeframe: (timeframe: TimeframeFilter) => void;
	setStatusScope: (statusScope: StatusFilter) => void;
	setRoleView: (role: RoleKey) => void;
	getVisibleTasks: () => Task[];
	getMetrics: () => TaskMetrics;
	getAlerts: () => Task[];
	refreshSampleData: () => void;
};

export const useTaskStore = create<TaskStoreState>((set, get) => ({
	tasks: SAMPLE_TASKS,
	timeframe: 'MONTH',
	statusScope: 'ALL',
	roleView: ROLE_ORDER[0],
	setTimeframe: timeframe => set({ timeframe }),
	setStatusScope: statusScope => set({ statusScope }),
	setRoleView: roleView => set({ roleView }),
	getVisibleTasks: () => {
		const { tasks, roleView, timeframe, statusScope } = get();
		return filterTasks(tasks, roleView, timeframe, statusScope);
	},
	getMetrics: () => {
		const { tasks, roleView, timeframe } = get();
		return buildTaskMetrics(tasks, roleView, timeframe);
	},
	getAlerts: () => {
		const { tasks, roleView } = get();
		return tasks.filter(task => {
			if (task.assigneeRole !== roleView && task.ownerRole !== roleView) {
				return false;
			}

			const urgency = getTaskUrgency(task);
			return urgency === 'OVERDUE' || urgency === 'DUE_SOON';
		});
	},
	refreshSampleData: () => set({ tasks: SAMPLE_TASKS.slice() }),
}));
