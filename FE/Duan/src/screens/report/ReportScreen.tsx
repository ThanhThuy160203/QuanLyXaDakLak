import { StyleSheet, Text, View } from 'react-native';
import { ROLE_MAP } from '../../constants/roles';
import { useTaskStore } from '../../store/task.store';
import { RoleKey } from '../../types';
import { ROLE_SCREEN_REGISTRY } from '../roles/registry';

export const ReportScreen = () => {
	const roleView = useTaskStore(state => state.roleView);
	const ScreenComponent = ROLE_SCREEN_REGISTRY[roleView]?.reports;

	if (ScreenComponent) {
		return <ScreenComponent />;
	}

	return <MissingReport role={roleView} />;
};

const MissingReport = ({ role }: { role?: RoleKey }) => {
	const label = role ? ROLE_MAP[role]?.label ?? role : 'cấp chưa xác định';
	return (
		<View style={styles.missingContainer}>
			<Text style={styles.missingTitle}>Chưa có báo cáo phù hợp</Text>
			<Text style={styles.missingSubtitle}>Giao diện báo cáo cho {label} sẽ sớm được cập nhật.</Text>
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
