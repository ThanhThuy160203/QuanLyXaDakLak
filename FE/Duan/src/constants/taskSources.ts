import { TaskSource } from '../types';

export const TASK_SOURCE_OPTIONS: { label: string; value: TaskSource }[] = [
	{ label: 'Sở', value: 'SO' },
	{ label: 'Ban/Ngành', value: 'BAN_NGANH' },
	{ label: 'UBND tỉnh', value: 'UBND_TINH' },
	{ label: 'UBND huyện', value: 'UBND_HUYEN' },
	{ label: 'Chủ tịch', value: 'CHU_TICH' },
	{ label: 'Nội bộ xã', value: 'NOI_BO' },
];

export const TASK_SOURCE_LABELS: Record<TaskSource, string> = TASK_SOURCE_OPTIONS.reduce((acc, option) => {
	acc[option.value] = option.label;
	return acc;
}, {} as Record<TaskSource, string>);

export const getTaskSourceLabel = (source: TaskSource | string) => TASK_SOURCE_LABELS[source as TaskSource] ?? source;
