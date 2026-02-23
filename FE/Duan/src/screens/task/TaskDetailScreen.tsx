import { StyleSheet, Text, View } from 'react-native';

export const TaskDetailScreen = () => (
	<View style={styles.container}>
		<Text style={styles.title}>Chi tiết nhiệm vụ</Text>
		<Text style={styles.description}>
			Màn hình chi tiết sẽ hiển thị luồng phản hồi, file đính kèm và lịch sử giao nhiệm vụ. Bạn có thể điều hướng tới
			màn hình này từ danh sách nhiệm vụ sau khi tích hợp API thực tế.
		</Text>
	</View>
);

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
		padding: 20,
	},
	title: {
		fontSize: 20,
		fontWeight: '700',
		color: '#0F172A',
		marginBottom: 8,
	},
	description: {
		fontSize: 14,
		color: '#475569',
		lineHeight: 22,
	},
});
