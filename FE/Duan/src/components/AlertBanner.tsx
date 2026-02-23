import { StyleSheet, Text, View } from 'react-native';
import { Task } from '../types';
import { getTaskUrgency } from '../utils/tasks';

interface AlertBannerProps {
  tasks: Task[];
}

export const AlertBanner = ({ tasks }: AlertBannerProps) => {
  if (!tasks.length) {
    return (
      <View style={[styles.banner, styles.successBanner]}>
        <Text style={styles.bannerTitle}>Không có cảnh báo</Text>
        <Text style={styles.bannerDescription}>Mọi nhiệm vụ đều đang đúng tiến độ.</Text>
      </View>
    );
  }

  const overdueCount = tasks.filter(task => getTaskUrgency(task) === 'OVERDUE').length;
  const dueSoonCount = tasks.length - overdueCount;

  return (
    <View style={[styles.banner, styles.warningBanner]}>
      <Text style={styles.bannerTitle}>Cảnh báo ngay</Text>
      <Text style={styles.bannerDescription}>
        {overdueCount} nhiệm vụ quá hạn · {dueSoonCount} nhiệm vụ sắp đến hạn
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  warningBanner: {
    backgroundColor: '#FEF3C7',
  },
  successBanner: {
    backgroundColor: '#DCFCE7',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  bannerDescription: {
    fontSize: 13,
    color: '#475569',
  },
});
