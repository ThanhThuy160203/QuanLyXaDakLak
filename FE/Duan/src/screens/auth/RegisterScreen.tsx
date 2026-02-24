import type { NativeStackScreenProps } from '@react-navigation/native-stack';
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
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { useAuthStore } from '../../store/auth.store';

type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen = ({ navigation }: RegisterScreenProps) => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [localError, setLocalError] = useState<string | null>(null);
	const register = useAuthStore(state => state.register);
	const loading = useAuthStore(state => state.loading);
	const error = useAuthStore(state => state.error);

	const handleRegister = async () => {
		setLocalError(null);
		if (!email || !password || !confirmPassword) {
			setLocalError('Vui lòng nhập đầy đủ thông tin');
			return;
		}

		if (password.length < 6) {
			setLocalError('Mật khẩu phải có ít nhất 6 ký tự');
			return;
		}

		if (password !== confirmPassword) {
			setLocalError('Mật khẩu xác nhận không khớp');
			return;
		}

		try {
			await register({ email, password });
		} catch (err) {
			console.warn('Register error', err);
		}
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			style={styles.container}
		>
			<View style={styles.content}>
				<Text style={styles.title}>Tạo tài khoản mới</Text>
				<Text style={styles.subtitle}>Đăng ký để truy cập hệ thống công việc</Text>

				<View style={styles.formGroup}>
					<Text style={styles.label}>Email công vụ</Text>
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

				<View style={styles.formGroup}>
					<Text style={styles.label}>Xác nhận mật khẩu</Text>
					<TextInput
						placeholder="••••••••"
						placeholderTextColor="#94A3B8"
						secureTextEntry
						value={confirmPassword}
						onChangeText={setConfirmPassword}
						style={styles.input}
					/>
				</View>

				{(localError || error) && (
					<Text style={styles.errorText}>{localError || error}</Text>
				)}

				<TouchableOpacity
					onPress={handleRegister}
					style={[styles.button, loading && styles.buttonDisabled]}
					disabled={loading}
				>
					{loading ? (
						<ActivityIndicator color="#FFFFFF" />
					) : (
						<Text style={styles.buttonLabel}>Đăng ký</Text>
					)}
				</TouchableOpacity>

				<TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Login')}>
					<Text style={styles.linkLabel}>Đã có tài khoản? Đăng nhập</Text>
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
		backgroundColor: '#0F9D58',
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
	linkButton: {
		marginTop: 16,
		alignItems: 'center',
	},
	linkLabel: {
		color: '#1D4ED8',
		fontSize: 14,
		fontWeight: '500',
	},
});
