export type RoleKey =
  | 'EMPLOYEE'
  | 'DEPARTMENT_HEAD'
  | 'DEPUTY_CHAIR'
  | 'CHAIRMAN'
  | 'AGGREGATOR';

export type RoleDefinition = {
  key: RoleKey;
  label: string;
  description: string;
  scope: 'PERSONAL' | 'DEPARTMENT' | 'DISTRICT' | 'CITY' | 'CROSS_DEPARTMENT';
  capabilities: string[];
  escalatesTo?: RoleKey[];
  assignsTo: RoleKey[];
};
