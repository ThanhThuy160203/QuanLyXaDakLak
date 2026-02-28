import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import type { MainStackParamList } from '../../navigation/MainStack';

export const SettingsScreen = () => {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  const handleLogoutPress = async () => {
    if (isLoggingOut) {
      return;
    }
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error) {
      console.warn('Logout error', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cài đặt</Text>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Thông tin tài khoản</Text>
        <Text style={styles.primaryText}>{user?.displayName || 'Chưa xác định'}</Text>
        <Text style={styles.secondaryText}>{user?.email}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Vai trò</Text>
          <Text style={styles.metaValue}>{user?.role || 'EMPLOYEE'}</Text>
        </View>
        {user?.department && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Đơn vị</Text>
            <Text style={styles.metaValue}>{user.department}</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleProfilePress}>
          <Text style={styles.primaryButtonLabel}>Hồ sơ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, isLoggingOut && styles.buttonDisabled]}
          onPress={handleLogoutPress}
          disabled={isLoggingOut}
        >
          <Text style={styles.secondaryButtonLabel}>{isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  sectionLabel: {
    fontSize: 13,
    color: '#94A3B8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  primaryText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F172A',
  },
  secondaryText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  actions: {
    marginTop: 32,
  },
  primaryButton: {
    backgroundColor: '#1D4ED8',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryButtonLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
