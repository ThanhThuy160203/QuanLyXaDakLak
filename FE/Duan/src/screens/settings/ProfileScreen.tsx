import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useAuthStore } from '../../store/auth.store';

const buildInitials = (displayName?: string, email?: string) => {
  const source = displayName?.trim() || email?.trim() || '';
  if (!source) {
    return '??';
  }
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(chunk => chunk[0]?.toUpperCase() ?? '')
    .join('');
};

export const ProfileScreen = () => {
  const user = useAuthStore(state => state.user);
  const updateProfile = useAuthStore(state => state.updateProfile);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    department: '',
    managedDepartments: '',
  });

  useEffect(() => {
    if (!user) {
      setForm({ displayName: '', department: '', managedDepartments: '' });
      return;
    }
    setForm({
      displayName: user.displayName,
      department: user.department ?? '',
      managedDepartments: user.managedDepartments?.join(', ') ?? '',
    });
  }, [user]);

  const initials = useMemo(() => buildInitials(user?.displayName, user?.email), [user]);
  const canSave = form.displayName.trim().length > 0;

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!user || saving || !canSave) {
      return;
    }

    setSaving(true);
    try {
      const managedList = form.managedDepartments
        .split(',')
        .map(entry => entry.trim())
        .filter(Boolean);
      await updateProfile({
        displayName: form.displayName,
        department: form.department,
        managedDepartments: form.managedDepartments.length ? managedList : [],
      });
      Alert.alert('Thành công', 'Hồ sơ của bạn đã được cập nhật.');
      setEditing(false);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu hồ sơ. Vui lòng thử lại.');
      console.warn('Profile update failed', error);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Không tìm thấy tài khoản</Text>
        <Text style={styles.emptySubtitle}>
          Vui lòng đăng nhập lại để tiếp tục quản lý hồ sơ của bạn.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLabel}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user.displayName}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.badgeRow}>
          <Text style={styles.badge}>Vai trò: {user.role}</Text>
          {user.department ? <Text style={styles.badge}>Đơn vị: {user.department}</Text> : null}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionLabel}>Thông tin cá nhân</Text>
            <Text style={styles.sectionTitle}>Quản lý hồ sơ</Text>
          </View>
          <TouchableOpacity
            style={[styles.editButton, editing && styles.editButtonActive]}
            onPress={() => setEditing(current => !current)}
          >
            <Text style={[styles.editButtonLabel, editing && styles.editButtonLabelActive]}>
              {editing ? 'Hủy' : 'Chỉnh sửa'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Họ tên hiển thị</Text>
          <TextInput
            value={form.displayName}
            onChangeText={value => handleChange('displayName', value)}
            style={[styles.input, !editing && styles.inputDisabled]}
            editable={editing}
            placeholder="Nhập tên bạn muốn hiển thị"
            placeholderTextColor="#94A3B8"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Đơn vị</Text>
          <TextInput
            value={form.department}
            onChangeText={value => handleChange('department', value)}
            style={[styles.input, !editing && styles.inputDisabled]}
            editable={editing}
            placeholder="Ví dụ: Văn phòng UBND"
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Phòng ban quản lý</Text>
          <TextInput
            value={form.managedDepartments}
            onChangeText={value => handleChange('managedDepartments', value)}
            style={[styles.input, styles.inputMultiline, !editing && styles.inputDisabled]}
            editable={editing}
            placeholder="Ngăn cách bằng dấu phẩy"
            placeholderTextColor="#94A3B8"
            multiline
            textAlignVertical="top"
          />
          {!form.managedDepartments && (
            <Text style={styles.helperText}>VD: Văn phòng, Ban điều hành, Kinh tế</Text>
          )}
        </View>

        {editing && (
          <TouchableOpacity
            style={[styles.saveButton, (!canSave || saving) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!canSave || saving}
          >
            <Text style={styles.saveButtonLabel}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>Bảo mật</Text>
        <Text style={styles.helperText}>
          Email đăng nhập ({user.email}) và vai trò ({user.role}) do quản trị hệ thống thiết lập.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
  headerCard: {
    backgroundColor: '#1D4ED8',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#0F172A',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 6,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarLabel: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    color: '#E0E7FF',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    fontSize: 12,
    color: '#E0E7FF',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    color: '#94A3B8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5F5',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  inputMultiline: {
    minHeight: 80,
  },
  inputDisabled: {
    backgroundColor: '#E2E8F0',
    color: '#475569',
  },
  helperText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
  },
  editButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  editButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  editButtonLabelActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
