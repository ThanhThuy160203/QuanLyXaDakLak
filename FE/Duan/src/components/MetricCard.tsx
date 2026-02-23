import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MetricCardProps {
  label: string;
  value: string;
  accent?: string;
  helper?: string;
  icon?: ReactNode;
}

export const MetricCard = ({ label, value, helper, accent = '#1D4ED8', icon }: MetricCardProps) => (
  <View style={[styles.card, { borderColor: accent }]}> 
    <View style={styles.header}>
      <Text style={styles.label}>{label}</Text>
      {icon}
    </View>
    <Text style={[styles.value, { color: accent }]}>{value}</Text>
    {helper && <Text style={styles.helper}>{helper}</Text>}
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
  },
  helper: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
  },
});
