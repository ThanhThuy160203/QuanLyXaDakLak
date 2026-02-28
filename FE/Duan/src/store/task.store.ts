import { create } from 'zustand';
import { ROLE_DIRECTORY, ROLE_MAP, ROLE_ORDER } from '../constants/roles';
import { fetchTasksFromFirestore } from '../services/task.service';
import {
    CreateTaskPayload,
    RoleKey,
    StatusFilter,
    Task,
    TaskActivity,
    TaskAssignmentPayload,
    TaskMetrics,
    TaskStatus,
    TimeframeFilter,
    UserProfile,
} from '../types';
import { buildTaskMetrics, filterTasks, getTaskUrgency } from '../utils/tasks';

const buildActivityEntry = (
	taskId: string,
	type: TaskActivity['type'],
	summary: string,
	actor: { name: string; role: RoleKey },
	detail?: string,
	meta?: Record<string, string | number>,
): TaskActivity => ({
	id: `${taskId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
	taskId,
	type,
	summary,
	detail,
	actor,
	timestamp: new Date().toISOString(),
	meta,
});

const buildSeedActivityLog = (tasks: Task[]): TaskActivity[] =>
	tasks.map(task =>
		buildActivityEntry(
			task.id,
			'ASSIGNED',
			`Giao nhiệm vụ cho ${task.assigneeName}`,
			{ name: ROLE_MAP[task.ownerRole]?.label ?? task.ownerRole, role: task.ownerRole },
			undefined,
			{ department: task.department, source: task.source },
		),
	);

const clampProgress = (value: number) => {
	if (Number.isNaN(value)) {
		return 0;
	}
	return Math.max(0, Math.min(100, value));
};

export type PersonnelRecord = {
	name: string;
	role: RoleKey;
	department?: string;
};

const FALLBACK_PERSONNEL: PersonnelRecord[] = Object.values(ROLE_DIRECTORY).map(entry => ({
	name: entry.displayName,
	role: entry.role,
	department: entry.department,
}));

const buildPersonnelDirectory = (tasks: Task[]): PersonnelRecord[] => {
	const directoryMap = new Map<string, PersonnelRecord>();
	tasks.forEach(task => {
		if (!task.assigneeName?.trim()) {
			return;
		}
		const key = `${task.assigneeName.toLowerCase()}|${task.assigneeRole}|${task.department ?? ''}`;
		directoryMap.set(key, {
			name: task.assigneeName,
			role: task.assigneeRole,
			department: task.department,
		});
	});
	if (directoryMap.size === 0) {
		FALLBACK_PERSONNEL.forEach(person => {
			directoryMap.set(`${person.name.toLowerCase()}|${person.role}|${person.department ?? ''}`, person);
		});
	}
	return Array.from(directoryMap.values());
};

type TaskStoreState = {
	tasks: Task[];
	loading: boolean;
	error: string | null;
	initialized: boolean;
	timeframe: TimeframeFilter;
	statusScope: StatusFilter;
	roleView: RoleKey;
	activityLog: TaskActivity[];
	personnelDirectory: PersonnelRecord[];
	setTimeframe: (timeframe: TimeframeFilter) => void;
	setStatusScope: (statusScope: StatusFilter) => void;
	setRoleView: (role: RoleKey) => void;
	fetchTasks: (options?: { force?: boolean }) => Promise<void>;
	getVisibleTasks: () => Task[];
	getMetrics: () => TaskMetrics;
	getAlerts: () => Task[];
	getTaskHistory: (taskId: string) => TaskActivity[];
	getPersonnelDirectory: () => PersonnelRecord[];
	acknowledgeTask: (taskId: string, actor: UserProfile) => void;
	updateTaskProgress: (
		taskId: string,
		payload: { progress: number; note?: string },
		actor: UserProfile,
	) => void;
	submitTaskFeedback: (taskId: string, feedback: string, actor: UserProfile) => void;
	completeTask: (taskId: string, note: string | undefined, actor: UserProfile) => void;
	assignTask: (
		taskId: string,
		payload: TaskAssignmentPayload,
		actor: UserProfile,
	) => void;
	cancelTask: (taskId: string, reason: string | undefined, actor: UserProfile) => void;
	createTask: (payload: CreateTaskPayload, actor: UserProfile) => Task | null;
};

type TaskStatePatch = { tasks: Task[] } & Partial<TaskStoreState>;

const withPersonnelSync = (patch: TaskStatePatch) => ({
	...patch,
	personnelDirectory: buildPersonnelDirectory(patch.tasks),
});

export const useTaskStore = create<TaskStoreState>((set, get) => ({
	tasks: [],
	loading: false,
	error: null,
	initialized: false,
	timeframe: 'MONTH',
	statusScope: 'ALL',
	roleView: ROLE_ORDER[0],
	activityLog: [],
	personnelDirectory: FALLBACK_PERSONNEL,
	setTimeframe: timeframe => set({ timeframe }),
	setStatusScope: statusScope => set({ statusScope }),
	setRoleView: roleView => set({ roleView }),
	fetchTasks: async options => {
		const { initialized, loading } = get();
		if (loading || (initialized && !options?.force)) {
			return;
		}
		set({ loading: true, error: null });
		try {
			const tasks = await fetchTasksFromFirestore();
			set(
				withPersonnelSync({
					tasks,
					loading: false,
					initialized: true,
					activityLog: buildSeedActivityLog(tasks),
				}),
			);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Không thể tải nhiệm vụ';
			console.warn('Failed to fetch tasks from Firestore', error);
			set(
				withPersonnelSync({
					tasks: [],
					loading: false,
					error: message,
					initialized: true,
					activityLog: [],
				}),
			);
		}
	},
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
	getTaskHistory: taskId => get().activityLog.filter(entry => entry.taskId === taskId),
	getPersonnelDirectory: () => get().personnelDirectory,
	acknowledgeTask: (taskId, actor) => {
		if (!actor) {
			return;
		}
		const currentTask = get().tasks.find(task => task.id === taskId);
		if (!currentTask) {
			return;
		}
		const nextStatus: TaskStatus = currentTask.status === 'NEW' ? 'IN_PROGRESS' : currentTask.status;
		set(state => {
			const tasks = state.tasks.map(task =>
				task.id === taskId
					? {
						...task,
						status: nextStatus,
						progress: task.progress === 0 ? 10 : task.progress,
					}
					: task,
			);
			return withPersonnelSync({
				tasks,
				activityLog: [
					buildActivityEntry(
						taskId,
						'ACKNOWLEDGED',
						`${actor.displayName} đã xác nhận nhận nhiệm vụ`,
						{ name: actor.displayName, role: actor.role },
					),
					...state.activityLog,
				],
			});
		});
	},
	updateTaskProgress: (taskId, payload, actor) => {
		const currentTask = get().tasks.find(task => task.id === taskId);
		if (!actor || !currentTask) {
			return;
		}
		const nextProgress = clampProgress(payload.progress);
		const nextStatus: TaskStatus = nextProgress >= 100 ? 'REVIEW' : currentTask.status === 'NEW' ? 'IN_PROGRESS' : currentTask.status;
		set(state => {
			const tasks = state.tasks.map(task =>
				task.id === taskId
					? {
						...task,
						progress: nextProgress,
						status: nextStatus,
					}
					: task,
			);
			return withPersonnelSync({
				tasks,
				activityLog: [
					buildActivityEntry(
						taskId,
						'PROGRESS_UPDATED',
						`${actor.displayName} cập nhật tiến độ ${nextProgress}%`,
						{ name: actor.displayName, role: actor.role },
						payload.note,
					),
					...state.activityLog,
				],
			});
		});
	},
	submitTaskFeedback: (taskId, feedback, actor) => {
		if (!actor || !feedback.trim()) {
			return;
		}
		const currentTask = get().tasks.find(task => task.id === taskId);
		if (!currentTask) {
			return;
		}
		set(state => ({
			activityLog: [
				buildActivityEntry(
					taskId,
					'FEEDBACK',
					`${actor.displayName} phản hồi nhiệm vụ`,
					{ name: actor.displayName, role: actor.role },
					feedback.trim(),
				),
				...state.activityLog,
			],
		}));
	},
	completeTask: (taskId, note, actor) => {
		const currentTask = get().tasks.find(task => task.id === taskId);
		if (!actor || !currentTask) {
			return;
		}
		set(state => {
			const tasks = state.tasks.map(task =>
				task.id === taskId
					? {
						...task,
						status: 'COMPLETED',
						progress: 100,
					}
					: task,
			);
			return withPersonnelSync({
				tasks,
				activityLog: [
					buildActivityEntry(
						taskId,
						'COMPLETED',
						`${actor.displayName} xác nhận hoàn thành`,
						{ name: actor.displayName, role: actor.role },
						note,
					),
					...state.activityLog,
				],
			});
		});
	},
	assignTask: (taskId, payload, actor) => {
		const currentTask = get().tasks.find(task => task.id === taskId);
		if (!actor || !currentTask) {
			return;
		}
		set(state => {
			const tasks = state.tasks.map(task =>
				task.id === taskId
					? {
						...task,
						ownerRole: actor.role,
						assigneeRole: payload.assigneeRole,
						assigneeName: payload.assigneeName,
						department: payload.department,
						status: 'NEW',
						progress: 0,
					}
					: task,
			);
			return withPersonnelSync({
				tasks,
				activityLog: [
					buildActivityEntry(
						taskId,
						'REASSIGNED',
						`${actor.displayName} giao nhiệm vụ cho ${payload.assigneeName}`,
						{ name: actor.displayName, role: actor.role },
						undefined,
						{ department: payload.department, targetRole: payload.assigneeRole },
					),
					...state.activityLog,
				],
			});
		});
	},
	cancelTask: (taskId, reason, actor) => {
		const currentTask = get().tasks.find(task => task.id === taskId);
		if (!actor || !currentTask) {
			return;
		}
		set(state => {
			const tasks = state.tasks.map(task =>
				task.id === taskId
					? {
						...task,
						status: 'CANCELLED',
					}
					: task,
			);
			return withPersonnelSync({
				tasks,
				activityLog: [
					buildActivityEntry(
						taskId,
						'CANCELLED',
						`${actor.displayName} huỷ nhiệm vụ`,
						{ name: actor.displayName, role: actor.role },
						reason,
					),
					...state.activityLog,
				],
			});
		});
	},
	createTask: (payload, actor) => {
		if (!actor) {
			return null;
		}
		const newTask: Task = {
			id: `TASK-${Date.now()}`,
			title: payload.title.trim(),
			description: payload.description.trim(),
			ownerRole: payload.ownerRole,
			assigneeRole: payload.assigneeRole,
			assigneeName: payload.assigneeName,
			department: payload.department,
			source: payload.source,
			dueDate: payload.dueDate,
			status: payload.status ?? 'NEW',
			progress: payload.progress ?? 0,
		};
		set(state =>
			withPersonnelSync({
				tasks: [newTask, ...state.tasks],
				activityLog: [
					buildActivityEntry(
						newTask.id,
						'ASSIGNED',
						`${actor.displayName} tạo nhiệm vụ mới`,
						{ name: actor.displayName, role: actor.role },
						undefined,
						{ assignee: payload.assigneeName, department: payload.department },
					),
					...state.activityLog,
				],
			}),
		);
		return newTask;
	},
}));
