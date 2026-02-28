import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ASSIGNABLE_ROLES_BY_LEVEL } from '../constants/assignmentRules';
import { ROLE_DIRECTORY } from '../constants/roles';
import { useAuthStore } from '../store/auth.store';
import { useTaskStore } from '../store/task.store';
import { RoleKey, Task, TaskAssignmentPayload } from '../types';
import { BaseModal } from './BaseModal';

interface TaskActionPanelProps {
  task: Task;
  role: RoleKey;
}

const buildAssignmentOptions = (
  role: RoleKey,
  task: Task,
  department?: string,
  managedDepartments?: string[],
): TaskAssignmentPayload[] => {
  const allowedRoles = ASSIGNABLE_ROLES_BY_LEVEL[role] ?? [];
  if (!allowedRoles.length) {
    return [];
  }
  const directory = Object.values(ROLE_DIRECTORY);
  const filtersByDepartment =
    role === 'DEPARTMENT_HEAD' || (managedDepartments && managedDepartments.length > 0);

  return directory
    .filter(entry => allowedRoles.includes(entry.role))
    .filter(entry => {
      if (!filtersByDepartment) {
        return true;
      }
      if (role === 'DEPARTMENT_HEAD') {
        return !department || entry.department === department;
      }
      if (managedDepartments && managedDepartments.length) {
        if (!entry.department) {
          return false;
        }
        return managedDepartments.includes(entry.department);
      }
      return true;
    })
    .map(entry => ({
      assigneeRole: entry.role,
      assigneeName: entry.displayName,
      department: entry.department ?? department ?? task.department,
    }));
};

const SectionButton = ({ label, variant = 'secondary', onPress }: { label: string; variant?: 'primary' | 'secondary' | 'danger'; onPress: () => void }) => (
  <Pressable onPress={onPress} style={[styles.actionButton, styles[`actionButton_${variant}` as const]]}>
    <Text style={[styles.actionLabel, styles[`actionLabel_${variant}` as const]]}>{label}</Text>
  </Pressable>
);

export const TaskActionPanel = ({ task, role }: TaskActionPanelProps) => {
  const user = useAuthStore(state => state.user);
  const acknowledgeTask = useTaskStore(state => state.acknowledgeTask);
  const updateTaskProgress = useTaskStore(state => state.updateTaskProgress);
  const submitTaskFeedback = useTaskStore(state => state.submitTaskFeedback);
  const completeTask = useTaskStore(state => state.completeTask);
  const assignTask = useTaskStore(state => state.assignTask);
  const cancelTask = useTaskStore(state => state.cancelTask);

  const [progressValue, setProgressValue] = useState(String(task.progress || 0));
  const [progressNote, setProgressNote] = useState('');
  const [feedbackValue, setFeedbackValue] = useState('');
  const [completeNote, setCompleteNote] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [modal, setModal] = useState<null | 'PROGRESS' | 'FEEDBACK' | 'ASSIGN' | 'CANCEL' | 'COMPLETE'>(null);

  const assignmentOptions = useMemo(
    () => buildAssignmentOptions(role, task, user?.department, user?.managedDepartments),
    [role, task, user?.department, user?.managedDepartments],
  );

  const isTaskClosed = task.status === 'COMPLETED' || task.status === 'CANCELLED';

  const closeModal = () => {
    setModal(null);
    setProgressNote('');
    setFeedbackValue('');
    setCompleteNote('');
    setCancelReason('');
  };

  const ensureUser = () => {
    if (!user) {
      Alert.alert('Thiếu thông tin người dùng', 'Vui lòng đăng nhập lại để thao tác.');
      return false;
    }
    return true;
  };

  const handleAcknowledge = () => {
    if (!ensureUser()) return;
    acknowledgeTask(task.id, user!);
    Alert.alert('Đã xác nhận', 'Bạn đã nhận nhiệm vụ này.');
  };

  const handleSubmitProgress = () => {
    if (!ensureUser()) return;
    const parsed = Number(progressValue);
    updateTaskProgress(task.id, { progress: Number.isNaN(parsed) ? 0 : parsed, note: progressNote.trim() || undefined }, user!);
    Alert.alert('Đã cập nhật', 'Tiến độ nhiệm vụ đã được lưu.');
    closeModal();
  };

  const handleSubmitFeedback = () => {
    if (!ensureUser()) return;
    if (!feedbackValue.trim()) {
      Alert.alert('Thiếu nội dung', 'Vui lòng nhập phản hồi.');
      return;
    }
    submitTaskFeedback(task.id, feedbackValue, user!);
    Alert.alert('Đã gửi phản hồi', 'Thông tin đã chuyển tới cấp có thẩm quyền.');
    closeModal();
  };

  const handleComplete = () => {
    if (!ensureUser()) return;
    completeTask(task.id, completeNote.trim() || undefined, user!);
    Alert.alert('Hoàn tất', 'Nhiệm vụ đã được đánh dấu hoàn thành.');
    closeModal();
  };

  const handleAssign = (option: TaskAssignmentPayload) => {
    if (!ensureUser()) return;
    assignTask(task.id, option, user!);
    Alert.alert('Đã giao nhiệm vụ', `${option.assigneeName} sẽ tiếp nhận nhiệm vụ này.`);
    closeModal();
  };

  const handleCancel = () => {
    if (!ensureUser()) return;
    cancelTask(task.id, cancelReason.trim() || undefined, user!);
    Alert.alert('Đã huỷ nhiệm vụ', 'Trạng thái nhiệm vụ chuyển sang huỷ.');
    closeModal();
  };

  if (isTaskClosed) {
    return null;
  }

  const actions: { key: string; label: string; variant?: 'primary' | 'secondary' | 'danger'; onPress: () => void }[] = [];

  const isAssignee = task.assigneeRole === role;
  const canAssign = assignmentOptions.length > 0;
  const canCancel = ['CHAIRMAN', 'AGGREGATOR'].includes(role) || task.ownerRole === role;

  if (role === 'EMPLOYEE' && task.status === 'NEW' && isAssignee) {
    actions.push({ key: 'ACK', label: 'Nhận nhiệm vụ', variant: 'primary', onPress: handleAcknowledge });
  }

  if (isAssignee && task.status !== 'COMPLETED') {
    actions.push({ key: 'PROGRESS', label: 'Cập nhật tiến độ', onPress: () => setModal('PROGRESS') });
    actions.push({ key: 'FEEDBACK', label: 'Phản hồi/giải trình', onPress: () => setModal('FEEDBACK') });
  }

  if (isAssignee && task.status !== 'COMPLETED') {
    actions.push({ key: 'COMPLETE', label: 'Xác nhận hoàn thành', variant: 'primary', onPress: () => setModal('COMPLETE') });
  }

  if (canAssign) {
    actions.push({ key: 'ASSIGN', label: 'Giao/Chuyển nhiệm vụ', onPress: () => setModal('ASSIGN') });
  }

  if (canCancel && task.status !== 'CANCELLED') {
    actions.push({ key: 'CANCEL', label: 'Huỷ nhiệm vụ', variant: 'danger', onPress: () => setModal('CANCEL') });
  }

  if (!actions.length) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.caption}>Thao tác nhanh</Text>
      <View style={styles.actionRow}>
        {actions.map(action => (
          <SectionButton key={action.key} label={action.label} variant={action.variant} onPress={action.onPress} />
        ))}
      </View>

      <BaseModal visible={modal === 'PROGRESS'} title="Cập nhật tiến độ" onClose={closeModal}>
        <View>
          <Text style={styles.modalLabel}>Tiến độ (%)</Text>
          <TextInput
            value={progressValue}
            onChangeText={setProgressValue}
            keyboardType="number-pad"
            style={styles.input}
            placeholder="0-100"
          />
          <Text style={styles.modalLabel}>Ghi chú</Text>
          <TextInput
            value={progressNote}
            onChangeText={setProgressNote}
            style={[styles.input, styles.multiline]}
            placeholder="Mô tả chi tiết cập nhật"
            multiline
          />
          <View style={styles.modalFooter}>
            <SectionButton label="Huỷ" onPress={closeModal} />
            <SectionButton label="Lưu" variant="primary" onPress={handleSubmitProgress} />
          </View>
        </View>
      </BaseModal>

      <BaseModal visible={modal === 'FEEDBACK'} title="Phản hồi nhiệm vụ" onClose={closeModal}>
        <TextInput
          value={feedbackValue}
          onChangeText={setFeedbackValue}
          style={[styles.input, styles.multiline]}
          placeholder="Nhập phản hồi/giải trình"
          multiline
        />
        <View style={styles.modalFooter}>
          <SectionButton label="Huỷ" onPress={closeModal} />
          <SectionButton label="Gửi" variant="primary" onPress={handleSubmitFeedback} />
        </View>
      </BaseModal>

      <BaseModal visible={modal === 'COMPLETE'} title="Xác nhận hoàn thành" onClose={closeModal}>
        <Text style={styles.modalHelper}>Kiểm tra kỹ trước khi gửi xác nhận hoàn thành.</Text>
        <TextInput
          value={completeNote}
          onChangeText={setCompleteNote}
          style={[styles.input, styles.multiline]}
          placeholder="Ghi chú (không bắt buộc)"
          multiline
        />
        <View style={styles.modalFooter}>
          <SectionButton label="Huỷ" onPress={closeModal} />
          <SectionButton label="Xác nhận" variant="primary" onPress={handleComplete} />
        </View>
      </BaseModal>

      <BaseModal visible={modal === 'ASSIGN'} title="Chọn người nhận" onClose={closeModal}>
        {assignmentOptions.length ? (
          <ScrollView style={styles.optionList}>
            {assignmentOptions.map(option => (
              <Pressable key={`${option.assigneeRole}-${option.assigneeName}`} style={styles.optionRow} onPress={() => handleAssign(option)}>
                <Text style={styles.optionName}>{option.assigneeName}</Text>
                <Text style={styles.optionMeta}>
                  {option.assigneeRole} · {option.department}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.modalHelper}>Không có nhân sự phù hợp để giao nhiệm vụ.</Text>
        )}
        <View style={styles.modalFooter}>
          <SectionButton label="Đóng" onPress={closeModal} />
        </View>
      </BaseModal>

      <BaseModal visible={modal === 'CANCEL'} title="Huỷ nhiệm vụ" onClose={closeModal}>
        <Text style={styles.modalHelper}>Nhập lý do huỷ để lưu lại lịch sử.</Text>
        <TextInput
          value={cancelReason}
          onChangeText={setCancelReason}
          style={[styles.input, styles.multiline]}
          placeholder="Lý do huỷ"
          multiline
        />
        <View style={styles.modalFooter}>
          <SectionButton label="Giữ lại" onPress={closeModal} />
          <SectionButton label="Huỷ nhiệm vụ" variant="danger" onPress={handleCancel} />
        </View>
      </BaseModal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
  },
  caption: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
    marginTop: 8,
  },
  actionButton_primary: {
    borderColor: '#1D4ED8',
    backgroundColor: '#1D4ED8',
  },
  actionButton_secondary: {
    borderColor: '#CBD5F5',
    backgroundColor: '#FFFFFF',
  },
  actionButton_danger: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionLabel_primary: {
    color: '#FFFFFF',
  },
  actionLabel_secondary: {
    color: '#1E293B',
  },
  actionLabel_danger: {
    color: '#B91C1C',
  },
  modalLabel: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
  },
  multiline: {
    height: 90,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalHelper: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 12,
  },
  optionList: {
    maxHeight: 220,
  },
  optionRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  optionName: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  optionMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
});
