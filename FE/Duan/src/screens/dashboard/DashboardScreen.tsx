import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ROLE_MAP } from '../../constants/roles';
import { useAuthStore } from '../../store/auth.store';
import { useTaskStore } from '../../store/task.store';
import { RoleKey } from '../../types';
import { ROLE_SCREEN_REGISTRY } from '../roles/registry';

export const DashboardScreen = () => {
	const roleView = useTaskStore(state => state.roleView);
	const setRoleView = useTaskStore(state => state.setRoleView);
	const userRole = useAuthStore(state => state.user?.role);

	useEffect(() => {
		if (userRole) {
			setRoleView(userRole);
		}
	}, [userRole, setRoleView]);

	const ScreenComponent = ROLE_SCREEN_REGISTRY[roleView]?.dashboard;

	if (ScreenComponent) {
		return <ScreenComponent />;
	}

	return <MissingDashboard role={roleView} />;
};

const MissingDashboard = ({ role }: { role?: RoleKey }) => {
	const label = role ? ROLE_MAP[role]?.label ?? role : 'cấp chưa xác định';
	return (
		<View style={styles.missingContainer}>
			<Text style={styles.missingTitle}>Chưa có giao diện phù hợp</Text>
			<Text style={styles.missingSubtitle}>Dashboard dành cho {label} đang được bổ sung.</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	missingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 24,
		backgroundColor: '#F8FAFC',
	},
	missingTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#0F172A',
		marginBottom: 8,
	},
	missingSubtitle: {
		fontSize: 14,
		color: '#475569',
		textAlign: 'center',
	},
});
