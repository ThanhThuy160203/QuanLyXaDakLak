import { firebaseConfig } from '../config/firebaseConfig';
import { firestoreConfig } from '../config/firestoreConfig';
import { ROLE_ORDER } from '../constants/roles';
import { RoleKey, Task, TaskStatus } from '../types';

type FirestoreValue = {
	stringValue?: string;
	integerValue?: string;
	doubleValue?: number;
	booleanValue?: boolean;
	timestampValue?: string;
	mapValue?: {
		fields?: Record<string, FirestoreValue>;
	};
};

type FirestoreDocument = {
	name: string;
	fields?: Record<string, FirestoreValue>;
};

type FirestoreListResponse = {
	documents?: FirestoreDocument[];
};

const FIRESTORE_BASE_URL = 'https://firestore.googleapis.com/v1';
const TASK_SOURCES: Task['source'][] = ['SO', 'BAN_NGANH', 'UBND_TINH', 'UBND_HUYEN', 'CHU_TICH', 'NOI_BO'];
const TASK_STATUSES: TaskStatus[] = ['NEW', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED'];

const isFirestoreConfigured = () =>
	firestoreConfig.projectId && firestoreConfig.projectId !== 'YOUR_FIREBASE_PROJECT_ID';

const assertFirebaseApiKey = () => {
	if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'YOUR_FIREBASE_WEB_API_KEY') {
		throw new Error('Vui lòng cấu hình apiKey Firebase trong firebaseConfig.ts');
	}
};

const buildTasksUrl = () => {
	if (!isFirestoreConfigured()) {
		throw new Error('Vui lòng cấu hình firestoreConfig.ts với projectId hợp lệ');
	}

	return `${FIRESTORE_BASE_URL}/projects/${firestoreConfig.projectId}/databases/${firestoreConfig.databaseId}/documents/${firestoreConfig.tasksCollectionPath}`;
};

const parseStringField = (value?: FirestoreValue, fallback = ''): string => {
	if (!value) {
		return fallback;
	}
	if (typeof value.stringValue === 'string') {
		return value.stringValue;
	}
	if (typeof value.timestampValue === 'string') {
		return value.timestampValue;
	}
	return fallback;
};

const parseNumberField = (value?: FirestoreValue, fallback = 0): number => {
	if (!value) {
		return fallback;
	}
	if (typeof value.doubleValue === 'number') {
		return value.doubleValue;
	}
	if (typeof value.integerValue === 'string') {
		const parsed = Number(value.integerValue);
		return Number.isNaN(parsed) ? fallback : parsed;
	}
	return fallback;
};

const isRoleKey = (value: string): value is RoleKey =>
	ROLE_ORDER.includes(value as RoleKey);

const parseRoleField = (value?: FirestoreValue): RoleKey => {
	const raw = parseStringField(value, 'EMPLOYEE');
	return isRoleKey(raw) ? raw : 'EMPLOYEE';
};

const isTaskStatus = (value: string): value is TaskStatus =>
	TASK_STATUSES.includes(value as TaskStatus);

const parseStatusField = (value?: FirestoreValue): TaskStatus => {
	const raw = parseStringField(value, 'NEW');
	return isTaskStatus(raw) ? raw : 'NEW';
};

const isTaskSource = (value: string): value is Task['source'] =>
	TASK_SOURCES.includes(value as Task['source']);

const parseSourceField = (value?: FirestoreValue): Task['source'] => {
	const raw = parseStringField(value, 'NOI_BO');
	return isTaskSource(raw) ? raw : 'NOI_BO';
};

const parseDueDateField = (value?: FirestoreValue): string => {
	const iso = parseStringField(value);
	if (iso) {
		return iso;
	}
	return new Date().toISOString();
};

const toTask = (doc: FirestoreDocument): Task | null => {
	const fields = doc.fields;
	if (!fields) {
		return null;
	}

	const id = doc.name?.split('/').pop() ?? '';
	const title = parseStringField(fields.title);
	if (!id || !title) {
		return null;
	}

	return {
		id,
		title,
		description: parseStringField(fields.description),
		ownerRole: parseRoleField(fields.ownerRole),
		assigneeRole: parseRoleField(fields.assigneeRole),
		assigneeName: parseStringField(fields.assigneeName),
		department: parseStringField(fields.department),
		source: parseSourceField(fields.source),
		dueDate: parseDueDateField(fields.dueDate),
		status: parseStatusField(fields.status),
		progress: parseNumberField(fields.progress),
		attachments: fields.attachments ? parseNumberField(fields.attachments) : undefined,
	};
};

export const fetchTasksFromFirestore = async (): Promise<Task[]> => {
	assertFirebaseApiKey();
	const endpoint = `${buildTasksUrl()}?key=${firebaseConfig.apiKey}`;
	const response = await fetch(endpoint);
	if (!response.ok) {
		const errorPayload = await response.text();
		throw new Error(`Không thể tải nhiệm vụ từ Firestore: ${errorPayload}`);
	}

	const payload = (await response.json()) as FirestoreListResponse;
	const documents = payload.documents ?? [];
	const tasks = documents
		.map(toTask)
		.filter((task): task is Task => Boolean(task));

	return tasks;
};
