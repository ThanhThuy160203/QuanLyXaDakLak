import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { DEFAULT_ROLE, ROLE_DIRECTORY } from '../constants/roles';
import { FirebaseSignInPayload, signInWithEmail, signUpWithEmail } from '../services/firebaseAuth';
import { AuthSession, RoleKey, UserProfile } from '../types';
import { useTaskStore } from './task.store';

const AUTH_STORAGE_KEY = '@duan/auth';
const ROLE_ASSIGNMENT_STORAGE_KEY = '@duan/role_assignments';

type RoleAssignment = {
	role: RoleKey;
	displayName: string;
	department?: string;
	managedDepartments?: string[];
};

type RegisterPayload = FirebaseSignInPayload & {
	role: RoleKey;
	displayName?: string;
	department?: string;
	managedDepartments?: string[];
};

type StoredAuth = {
	user: UserProfile;
	session: AuthSession;
};

type AuthStoreState = {
	user: UserProfile | null;
	session: AuthSession | null;
	loading: boolean;
	error: string | null;
	hydrated: boolean;
	roleAssignments: Record<string, RoleAssignment>;
	login: (payload: FirebaseSignInPayload) => Promise<void>;
	register: (payload: RegisterPayload) => Promise<void>;
	logout: () => Promise<void>;
	bootstrap: () => Promise<void>;
	overrideRole: (role: RoleKey) => Promise<void>;
};

const syncRoleView = (role?: RoleKey) => {
	try {
		const { setRoleView } = useTaskStore.getState();
		setRoleView(role ?? DEFAULT_ROLE);
	} catch (error) {
		console.warn('Failed to sync dashboard role view', error);
	}
};

const isWebOnlyRole = (role?: RoleKey) => role === 'ADMIN';

const buildProfile = (
	email: string,
	uid: string,
	assignments: Record<string, RoleAssignment>,
): UserProfile => {
	const normalizedEmail = email.toLowerCase();
	const directoryEntry = assignments[normalizedEmail] ?? ROLE_DIRECTORY[normalizedEmail];

	if (!directoryEntry) {
		return {
			uid,
			email: normalizedEmail,
			displayName: normalizedEmail,
			role: DEFAULT_ROLE,
		};
	}

	return {
		uid,
		email: normalizedEmail,
		displayName: directoryEntry.displayName,
		role: directoryEntry.role,
		department: directoryEntry.department,
		managedDepartments: directoryEntry.managedDepartments,
	};
};

export const useAuthStore = create<AuthStoreState>((set, get) => ({
	user: null,
	session: null,
	loading: false,
	error: null,
	hydrated: false,
	roleAssignments: {},
	async bootstrap() {
		if (get().hydrated) {
			return;
		}
		try {
			const [rawAuth, rawAssignments] = await Promise.all([
				AsyncStorage.getItem(AUTH_STORAGE_KEY),
				AsyncStorage.getItem(ROLE_ASSIGNMENT_STORAGE_KEY),
			]);
			const assignments: Record<string, RoleAssignment> = rawAssignments
				? JSON.parse(rawAssignments)
				: {};
			if (!rawAuth) {
				set({ roleAssignments: assignments, hydrated: true });
				syncRoleView(DEFAULT_ROLE);
				return;
			}

			const parsed: StoredAuth = JSON.parse(rawAuth);
			const profile = buildProfile(parsed.user.email, parsed.user.uid, assignments);
			if (isWebOnlyRole(profile.role)) {
				await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
				set({ user: null, session: null, roleAssignments: assignments, hydrated: true });
				syncRoleView(DEFAULT_ROLE);
				return;
			}
			set({ user: profile, session: parsed.session, roleAssignments: assignments, hydrated: true });
			syncRoleView(profile.role);
		} catch (error) {
			console.warn('Failed to restore auth session', error);
			set({ hydrated: true, roleAssignments: {} });
			syncRoleView(DEFAULT_ROLE);
		}
	},
	async login(payload) {
		set({ loading: true, error: null });
		try {
			const { firebaseUser, session } = await signInWithEmail(payload);
			const profile = buildProfile(firebaseUser.email, firebaseUser.uid, get().roleAssignments);
			if (isWebOnlyRole(profile.role)) {
				await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
				set({ user: null, session: null, loading: false });
				syncRoleView(DEFAULT_ROLE);
				return;
			}

			const stored: StoredAuth = {
				user: profile,
				session,
			};
			await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(stored));

			set({ user: profile, session, loading: false });
			syncRoleView(profile.role);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Không thể đăng nhập';
			set({ error: message, loading: false });
			throw error;
		}
	},
	async register(payload) {
		set({ loading: true, error: null });
		try {
			const { firebaseUser, session } = await signUpWithEmail(payload);
			const normalizedEmail = firebaseUser.email.toLowerCase();
			const assignment: RoleAssignment = {
				role: payload.role,
				displayName: payload.displayName?.trim() || normalizedEmail,
				department: payload.department?.trim() || undefined,
				managedDepartments: payload.managedDepartments?.length
					? payload.managedDepartments
					: undefined,
			};
			const updatedAssignments = {
				...get().roleAssignments,
				[normalizedEmail]: assignment,
			};
			await AsyncStorage.setItem(
				ROLE_ASSIGNMENT_STORAGE_KEY,
				JSON.stringify(updatedAssignments),
			);
			const profile = buildProfile(firebaseUser.email, firebaseUser.uid, updatedAssignments);
			if (isWebOnlyRole(profile.role)) {
				await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
				set({ user: null, session: null, loading: false, roleAssignments: updatedAssignments });
				syncRoleView(DEFAULT_ROLE);
				return;
			}

			const stored: StoredAuth = {
				user: profile,
				session,
			};
			await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(stored));

			set({ user: profile, session, loading: false, roleAssignments: updatedAssignments });
			syncRoleView(profile.role);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Không thể đăng ký';
			set({ error: message, loading: false });
			throw error;
		}
	},
	async logout() {
		await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
		set({ user: null, session: null });
		syncRoleView(DEFAULT_ROLE);
	},
	async overrideRole(role) {
		const { user, roleAssignments } = get();
		if (!user) {
			return;
		}

		const normalizedEmail = user.email.toLowerCase();
		const nextAssignments = {
			...roleAssignments,
			[normalizedEmail]: {
				role,
				displayName: user.displayName,
				department: user.department,
				managedDepartments: user.managedDepartments,
			},
		};
		await AsyncStorage.setItem(
			ROLE_ASSIGNMENT_STORAGE_KEY,
			JSON.stringify(nextAssignments),
		);
		if (isWebOnlyRole(role)) {
			await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
			set({ user: null, session: null, roleAssignments: nextAssignments });
			syncRoleView(DEFAULT_ROLE);
			return;
		}
		set({ user: { ...user, role }, roleAssignments: nextAssignments });
		syncRoleView(role);
	},
}));
