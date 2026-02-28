import { formatDistanceToNow } from 'date-fns';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTaskStore } from '../store/task.store';

interface TaskHistoryProps {
  taskId: string;
  limit?: number;
}

export const TaskHistory = ({ taskId, limit = 3 }: TaskHistoryProps) => {
  const activityLog = useTaskStore(state => state.activityLog);
  const entries = useMemo(() => activityLog.filter(entry => entry.taskId === taskId), [activityLog, taskId]);
  if (!entries.length) {
    return null;
  }
  const visibleEntries = entries.slice(0, limit);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nhật ký xử lý</Text>
      {visibleEntries.map(entry => (
        <View key={entry.id} style={styles.row}>
          <View style={styles.marker} />
          <View style={styles.meta}>
            <Text style={styles.summary}>{entry.summary}</Text>
            {entry.detail ? <Text style={styles.detail}>{entry.detail}</Text> : null}
            <Text style={styles.timestamp}>
              {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })} · {entry.actor.name}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  marker: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1D4ED8',
    marginTop: 6,
    marginRight: 10,
  },
  meta: {
    flex: 1,
  },
  summary: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  detail: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
});
