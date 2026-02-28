import { format } from 'date-fns';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Task } from '../types';
import { getTaskUrgency } from '../utils/tasks';

interface TaskCardProps {
  task: Task;
  footer?: ReactNode;
}

const urgencyColors = {
  OVERDUE: '#DC2626',
  DUE_SOON: '#F97316',
  ON_TRACK: '#10B981',
};

export const TaskCard = ({ task, footer }: TaskCardProps) => {
  const urgency = getTaskUrgency(task);
  const dueDate = format(new Date(task.dueDate), 'dd/MM/yyyy');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{task.title}</Text>
        <View style={[styles.urgencyBadge, { backgroundColor: urgencyColors[urgency] }]}> 
          <Text style={styles.urgencyLabel}>{urgency === 'OVERDUE' ? 'Quá hạn' : urgency === 'DUE_SOON' ? 'Sắp đến hạn' : 'Đang đúng tiến độ'}</Text>
        </View>
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {task.description}
      </Text>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Phụ trách: {task.assigneeName}</Text>
        <Text style={styles.metaLabel}>Phòng: {task.department}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaValue}>Hạn: {dueDate}</Text>
        <Text style={styles.metaValue}>Tiến độ: {task.progress}%</Text>
      </View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginRight: 12,
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  metaValue: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '500',
  },
  footer: {
    marginTop: 12,
  },
});
