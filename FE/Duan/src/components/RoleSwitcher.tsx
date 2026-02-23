import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ROLE_DEFINITIONS, ROLE_ORDER } from '../constants/roles';
import { RoleKey } from '../types';

interface RoleSwitcherProps {
  activeRole: RoleKey;
  onSelect: (role: RoleKey) => void;
  compact?: boolean;
}

export const RoleSwitcher = ({ activeRole, onSelect, compact }: RoleSwitcherProps) => {
  const roles = useMemo(() => ROLE_ORDER.map(key => ROLE_DEFINITIONS.find(r => r.key === key)!), []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chọn cấp xem dữ liệu</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {roles.map(role => {
          const isActive = role.key === activeRole;
          return (
            <Pressable
              key={role.key}
              onPress={() => onSelect(role.key)}
              style={[styles.roleChip, isActive && styles.roleChipActive, compact && styles.roleChipCompact]}
            >
              <Text style={[styles.roleLabel, isActive && styles.roleLabelActive]}>{role.label}</Text>
              {!compact && (
                <Text style={styles.roleDesc} numberOfLines={1}>
                  {role.description}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#0F172A',
  },
  roleChip: {
    width: 220,
    marginRight: 12,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CBD5F5',
    backgroundColor: '#FFFFFF',
  },
  roleChipCompact: {
    width: 150,
  },
  roleChipActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  roleLabel: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  roleLabelActive: {
    color: '#FFFFFF',
  },
  roleDesc: {
    color: '#475569',
    fontSize: 12,
  },
});
