import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ROLE_DEFINITIONS } from '../../constants/roles';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { useAuthStore } from '../../store/auth.store';
import type { RoleKey } from '../../types';

type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen = ({ navigation }: RegisterScreenProps) => {
	const [email, setEmail] = useState('');
	const [displayName, setDisplayName] = useState('');
	const [department, setDepartment] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [role, setRole] = useState<RoleKey>('EMPLOYEE');
	const [localError, setLocalError] = useState<string | null>(null);
	const register = useAuthStore(state => state.register);
	const loading = useAuthStore(state => state.loading);
	const error = useAuthStore(state => state.error);
	const roleOptions = useMemo(
		() =>
			ROLE_DEFINITIONS.map(option => ({
				key: option.key,
				label: option.label,
			})),
		[],
	);

	const handleRegister = async () => {
		setLocalError(null);
		if (!email || !password || !confirmPassword || !displayName) {
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
			await register({
				email: email.trim().toLowerCase(),
				password,
				role,
				displayName: displayName.trim(),
				department: department.trim() || undefined,
			});
		} catch (err) {
			console.warn('Register error', err);
		}
	};
	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			style={styles.container}
		>
			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				<View style={styles.hero}>
					<View style={styles.heroBadge}>
						<Text style={styles.heroBadgeLabel}>Quy trình chuẩn</Text>
					</View>
					<Text style={styles.heroTitle}>Khởi tạo tài khoản tác nghiệp</Text>
					<Text style={styles.heroSubtitle}>
						Điền thông tin hồ sơ, xác nhận chức vụ và hoàn tất bảo mật để truy cập hệ thống điều hành.
					</Text>
					<View style={styles.heroStatsRow}>
						<View style={styles.heroStatCard}>
							<Text style={styles.heroStatLabel}>Thời gian duyệt</Text>
							<Text style={styles.heroStatValue}>~4 giờ</Text>
						</View>
						<View style={styles.heroStatCard}>
							<Text style={styles.heroStatLabel}>Hỗ trợ</Text>
							<Text style={styles.heroStatValue}>hành chính</Text>
						</View>
					</View>
				</View>

				<View style={styles.content}>
					<View style={styles.sectionHeader}>
						<View style={styles.stepPill}>
							<Text style={styles.stepPillLabel}>01</Text>
						</View>
						<View>
							<Text style={styles.sectionTitle}>Thông tin đăng nhập</Text>
							<Text style={styles.sectionSubtitle}>Sử dụng email công vụ để hệ thống gán nhiệm vụ chính xác.</Text>
						</View>
					</View>

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

					<View style={styles.inlineFields}>
						<View style={[styles.formGroup, styles.inlineField]}>
							<Text style={styles.label}>Họ và tên hiển thị</Text>
							<TextInput
								placeholder="Nguyễn Văn A"
								placeholderTextColor="#94A3B8"
								value={displayName}
								onChangeText={setDisplayName}
								style={styles.input}
							/>
						</View>
						<View style={[styles.formGroup, styles.inlineField]}>
							<Text style={styles.label}>Đơn vị (tuỳ chọn)</Text>
							<TextInput
								placeholder="Văn phòng UBND Xã"
								placeholderTextColor="#94A3B8"
								value={department}
								onChangeText={setDepartment}
								style={styles.input}
							/>
						</View>
					</View>

					<View style={styles.divider} />

					<View style={styles.sectionHeader}>
						<View style={styles.stepPill}>
							<Text style={styles.stepPillLabel}>02</Text>
						</View>
						<View>
							<Text style={styles.sectionTitle}>Xác nhận chức vụ</Text>
							<Text style={styles.sectionSubtitle}>Lựa chọn chức vụ để dashboard hiển thị KPI phù hợp.</Text>
						</View>
					</View>
					<View style={styles.roleGroup}>
						<Text style={styles.helperLabel}>Chỉ dùng chức vụ bạn đang đảm nhiệm tại xã/phòng ban.</Text>
						<View style={styles.roleList}>
							{roleOptions.map(option => {
								const isActive = option.key === role;
								return (
									<TouchableOpacity
										key={option.key}
										onPress={() => setRole(option.key)}
										style={[styles.roleChip, isActive && styles.roleChipActive]}
									>
										<Text style={[styles.roleChipLabel, isActive && styles.roleChipLabelActive]}>
											{option.label}
										</Text>
									</TouchableOpacity>
								);
							})}
						</View>
					</View>

					<View style={styles.divider} />

					<View style={styles.sectionHeader}>
						<View style={styles.stepPill}>
							<Text style={styles.stepPillLabel}>03</Text>
						</View>
						<View>
							<Text style={styles.sectionTitle}>Bảo mật tài khoản</Text>
							<Text style={styles.sectionSubtitle}>Thiết lập mật khẩu đủ mạnh để đáp ứng tiêu chuẩn an toàn.</Text>
						</View>
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
						<Text style={styles.fieldHint}>Tối thiểu 6 ký tự, ưu tiên chữ hoa và ký tự đặc biệt.</Text>
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

					{(localError || error) && <Text style={styles.errorText}>{localError || error}</Text>}

					<TouchableOpacity
						onPress={handleRegister}
						style={[styles.button, loading && styles.buttonDisabled]}
						disabled={loading}
					>
						{loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonLabel}>Gửi yêu cầu</Text>}
					</TouchableOpacity>

					<View style={styles.supportCard}>
						<View>
							<Text style={styles.supportTitle}>Cần hỗ trợ?</Text>
							<Text style={styles.supportSubtitle}>Liên hệ điều phối viên hành chính để được duyệt nhanh hơn.</Text>
						</View>
						<TouchableOpacity style={styles.supportButton} onPress={() => {}}>
							<Text style={styles.supportButtonLabel}>Gọi 0901 234 567</Text>
						</TouchableOpacity>
					</View>

					<TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Login')}>
						<Text style={styles.linkLabel}>Đã có tài khoản? Đăng nhập</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#E2E8F0',
		padding: 24,
	},
	scrollContent: {
		paddingBottom: 64,
	},
	hero: {
		backgroundColor: '#0B1120',
		padding: 28,
		borderRadius: 28,
		marginBottom: 24,
		shadowColor: '#0F172A',
		shadowOpacity: 0.25,
		shadowRadius: 30,
		elevation: 8,
	},
	heroBadge: {
		alignSelf: 'flex-start',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 999,
		backgroundColor: 'rgba(148, 163, 184, 0.25)',
		marginBottom: 16,
	},
	heroBadgeLabel: {
		color: '#E2E8F0',
		fontSize: 12,
		fontWeight: '600',
		letterSpacing: 0.5,
	},
	heroTitle: {
		color: '#F8FAFC',
		fontSize: 24,
		fontWeight: '700',
		marginBottom: 10,
	},
	heroSubtitle: {
		color: '#CBD5F5',
		fontSize: 14,
		lineHeight: 22,
		marginBottom: 18,
	},
	heroStatsRow: {
		flexDirection: 'row',
		columnGap: 12,
	},
	heroStatCard: {
		flex: 1,
		borderRadius: 20,
		backgroundColor: 'rgba(15, 23, 42, 0.65)',
		padding: 14,
	},
	heroStatLabel: {
		color: '#94A3B8',
		fontSize: 12,
		marginBottom: 6,
	},
	heroStatValue: {
		color: '#F8FAFC',
		fontWeight: '600',
		fontSize: 16,
	},
	content: {
		backgroundColor: '#FFFFFF',
		padding: 26,
		borderRadius: 28,
		shadowColor: '#0F172A',
		shadowOpacity: 0.08,
		shadowRadius: 32,
		elevation: 10,
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 20,
	},
	stepPill: {
		width: 44,
		height: 44,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: '#E2E8F0',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 14,
		backgroundColor: '#F8FAFC',
	},
	stepPillLabel: {
		fontWeight: '600',
		color: '#1D4ED8',
	},
	sectionTitle: {
		fontSize: 17,
		fontWeight: '700',
		color: '#0F172A',
	},
	sectionSubtitle: {
		fontSize: 13,
		color: '#64748B',
		marginTop: 4,
	},
	formGroup: {
		marginBottom: 18,
	},
	inlineFields: {
		flexDirection: 'row',
		columnGap: 16,
	},
	inlineField: {
		flex: 1,
		marginBottom: 0,
	},
	label: {
		fontSize: 13,
		color: '#475569',
		marginBottom: 6,
		fontWeight: '600',
	},
	input: {
		borderWidth: 1,
		borderColor: '#CBD5F5',
		borderRadius: 16,
		paddingHorizontal: 16,
		paddingVertical: 12,
		color: '#0F172A',
		backgroundColor: '#F8FAFC',
	},
	fieldHint: {
		fontSize: 12,
		color: '#94A3B8',
		marginTop: 6,
	},
	divider: {
		height: 1,
		backgroundColor: '#F1F5F9',
		marginVertical: 16,
	},
	roleGroup: {
		marginBottom: 12,
	},
	helperLabel: {
		fontSize: 12,
		color: '#94A3B8',
		marginBottom: 12,
	},
	roleList: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginHorizontal: -6,
	},
	roleChip: {
		paddingVertical: 12,
		paddingHorizontal: 18,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: '#E2E8F0',
		marginHorizontal: 6,
		marginTop: 10,
		backgroundColor: '#FFFFFF',
	},
	roleChipActive: {
		backgroundColor: '#1D4ED8',
		borderColor: '#1D4ED8',
		shadowColor: '#1D4ED8',
		shadowOpacity: 0.25,
		shadowRadius: 10,
		elevation: 4,
	},
	roleChipLabel: {
		fontSize: 13,
		fontWeight: '600',
		color: '#0F172A',
	},
	roleChipLabelActive: {
		color: '#FFFFFF',
	},
	button: {
		backgroundColor: '#0F9D58',
		borderRadius: 18,
		paddingVertical: 15,
		alignItems: 'center',
		marginTop: 4,
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	buttonLabel: {
		color: '#FFFFFF',
		fontWeight: '600',
		fontSize: 16,
		letterSpacing: 0.3,
	},
	errorText: {
		color: '#DC2626',
		fontSize: 13,
		marginBottom: 12,
		fontWeight: '600',
	},
	supportCard: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#F1F5F9',
		borderRadius: 18,
		padding: 18,
		marginTop: 18,
	},
	supportTitle: {
		fontSize: 15,
		fontWeight: '700',
		color: '#0F172A',
	},
	supportSubtitle: {
		fontSize: 12,
		color: '#475569',
		marginTop: 4,
		maxWidth: 200,
	},
	supportButton: {
		backgroundColor: '#1D4ED8',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 14,
	},
	supportButtonLabel: {
		color: '#FFFFFF',
		fontWeight: '600',
		fontSize: 13,
	},
	linkButton: {
		marginTop: 20,
		alignItems: 'center',
	},
	linkLabel: {
		color: '#1D4ED8',
		fontSize: 14,
		fontWeight: '600',
	},
});
