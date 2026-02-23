import { useState } from 'react';
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { useAuthStore } from '../../store/auth.store';

export const LoginScreen = () => {
	const [email, setEmail] = useState('nhanvien@duan.gov.vn');
	const [password, setPassword] = useState('DuAn@123');
	const [localError, setLocalError] = useState<string | null>(null);
	const { login, loading, error } = useAuthStore(state => ({
		login: state.login,
		loading: state.loading,
		error: state.error,
	}));

	const handleLogin = async () => {
		setLocalError(null);
		if (!email || !password) {
			setLocalError('Vui lòng nhập email và mật khẩu');
			return;
		}

		try {
			await login({ email, password });
		} catch (err) {
			console.warn('Login error', err);
		}
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			style={styles.container}
		>
			<View style={styles.content}>
				<Text style={styles.title}>Đăng nhập hệ thống công việc</Text>
				<Text style={styles.subtitle}>Sử dụng tài khoản Firebase tạm thời</Text>

				<View style={styles.formGroup}>
					<Text style={styles.label}>Email</Text>
					<TextInput
						placeholder="ten@duan.gov.vn"
						placeholderTextColor="#94A3B8"
						value={email}
						onChangeText={setEmail}
						autoCapitalize="none"
						keyboardType="email-address"
						style={styles.input}
					/>
				</View>

				<View style={styles.formGroup}>
					<Text style={styles.label}>Mật khẩu</Text>
					<TextInput
						placeholder="••••••••"
						placeholderTextColor="#94A3B8"
						secureTextEntry
						value={password}
						onChangeText={setPassword}
						style={styles.input}
					/>
				</View>

				{(localError || error) && (
					<Text style={styles.errorText}>{localError || error}</Text>
				)}

				<TouchableOpacity
					onPress={handleLogin}
					style={[styles.button, loading && styles.buttonDisabled]}
					disabled={loading}
				>
					{loading ? (
						<ActivityIndicator color="#FFFFFF" />
					) : (
						<Text style={styles.buttonLabel}>Đăng nhập</Text>
					)}
				</TouchableOpacity>
			</View>
		</KeyboardAvoidingView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#EFF6FF',
		padding: 24,
		justifyContent: 'center',
	},
	content: {
		backgroundColor: '#FFFFFF',
		padding: 24,
		borderRadius: 24,
		shadowColor: '#0F172A',
		shadowOpacity: 0.08,
		shadowRadius: 24,
		elevation: 6,
	},
	title: {
		fontSize: 22,
		fontWeight: '700',
		color: '#0F172A',
	},
	subtitle: {
		fontSize: 14,
		color: '#64748B',
		marginTop: 4,
		marginBottom: 24,
	},
	formGroup: {
		marginBottom: 16,
	},
	label: {
		fontSize: 13,
		color: '#475569',
		marginBottom: 6,
	},
	input: {
		borderWidth: 1,
		borderColor: '#CBD5F5',
		borderRadius: 14,
		paddingHorizontal: 14,
		paddingVertical: 12,
		color: '#0F172A',
	},
	button: {
		backgroundColor: '#1D4ED8',
		borderRadius: 16,
		paddingVertical: 14,
		alignItems: 'center',
		marginTop: 12,
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	buttonLabel: {
		color: '#FFFFFF',
		fontWeight: '600',
		fontSize: 15,
	},
	errorText: {
		color: '#DC2626',
		fontSize: 13,
		marginBottom: 8,
	},
});
