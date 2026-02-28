import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

export const CreateTaskScreen = () => (
	<KeyboardAvoidingView
		behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
		keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 80}
		style={styles.container}
	>
		<ScrollView
			contentContainerStyle={styles.scrollContent}
			keyboardShouldPersistTaps="handled"
			scrollEnabled={true}
		>
			<Text style={styles.title}>Tạo nhiệm vụ mới</Text>
			<Text style={styles.description}>
				Khu vực này sẽ cho phép Tổng hợp hoặc Chủ tịch tạo nhiệm vụ, phân loại nguồn giao và giao xuống các cấp.
				Form chi tiết sẽ được kết nối API trong giai đoạn tiếp theo.
			</Text>
		</ScrollView>
	</KeyboardAvoidingView>
);

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},
	scrollContent: {
		flexGrow: 1,
		padding: 20,
	},
	title: {
		fontSize: 20,
		fontWeight: '700',
		color: '#0F172A',
		marginBottom: 12,
	},
	description: {
		fontSize: 14,
		color: '#475569',
		lineHeight: 22,
	},
});
