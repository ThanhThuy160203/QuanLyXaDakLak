import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { FirebaseSignInPayload, signInWithEmail } from '../services/firebaseAuth';
import { DEFAULT_ROLE, ROLE_DIRECTORY } from '../constants/roles';
import { AuthSession, RoleKey, UserProfile } from '../types';

const AUTH_STORAGE_KEY = '@duan/auth';

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
	login: (payload: FirebaseSignInPayload) => Promise<void>;
	logout: () => Promise<void>;
	bootstrap: () => Promise<void>;
	overrideRole: (role: RoleKey) => void;
};

const buildProfile = (email: string, uid: string): UserProfile => {
	const normalizedEmail = email.toLowerCase();
	const directoryEntry = ROLE_DIRECTORY[normalizedEmail];

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
	async bootstrap() {
		try {
			const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
			if (!raw) {
				set({ hydrated: true });
				return;
			}

			const parsed: StoredAuth = JSON.parse(raw);
			set({ user: parsed.user, session: parsed.session, hydrated: true });
		} catch (error) {
			console.warn('Failed to restore auth session', error);
			set({ hydrated: true });
		}
	},
	async login(payload) {
		set({ loading: true, error: null });
		try {
			const { firebaseUser, session } = await signInWithEmail(payload);
			const profile = buildProfile(firebaseUser.email, firebaseUser.uid);

			const stored: StoredAuth = {
				user: profile,
				session,
			};
			await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(stored));

			set({ user: profile, session, loading: false });
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Không thể đăng nhập';
			set({ error: message, loading: false });
			throw error;
		}
	},
	async logout() {
		await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
		set({ user: null, session: null });
	},
	overrideRole(role) {
		const { user } = get();
		if (!user) {
			return;
		}

		set({ user: { ...user, role } });
	},
}));
