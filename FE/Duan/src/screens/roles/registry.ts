import { ComponentType } from 'react';
import { RoleKey } from '../../types';
import { AggregatorDashboardScreen } from './aggregator/AggregatorDashboardScreen';
import { AggregatorReportScreen } from './aggregator/AggregatorReportScreen';
import { AggregatorTaskListScreen } from './aggregator/AggregatorTaskListScreen';
import { ChairmanDashboardScreen } from './chairman/ChairmanDashboardScreen';
import { ChairmanReportScreen } from './chairman/ChairmanReportScreen';
import { ChairmanTaskListScreen } from './chairman/ChairmanTaskListScreen';
import { DepartmentHeadDashboardScreen } from './departmentHead/DepartmentHeadDashboardScreen';
import { DepartmentHeadReportScreen } from './departmentHead/DepartmentHeadReportScreen';
import { DepartmentHeadTaskListScreen } from './departmentHead/DepartmentHeadTaskListScreen';
import { DeputyChairDashboardScreen } from './deputyChair/DeputyChairDashboardScreen';
import { DeputyChairReportScreen } from './deputyChair/DeputyChairReportScreen';
import { DeputyChairTaskListScreen } from './deputyChair/DeputyChairTaskListScreen';
import { EmployeeDashboardScreen } from './employee/EmployeeDashboardScreen';
import { EmployeeReportScreen } from './employee/EmployeeReportScreen';
import { EmployeeTaskListScreen } from './employee/EmployeeTaskListScreen';

export type RoleScreenSet = {
  dashboard: ComponentType;
  tasks: ComponentType;
  reports: ComponentType;
};

export const ROLE_SCREEN_REGISTRY: Record<RoleKey, RoleScreenSet> = {
  EMPLOYEE: {
    dashboard: EmployeeDashboardScreen,
    tasks: EmployeeTaskListScreen,
    reports: EmployeeReportScreen,
  },
  DEPARTMENT_HEAD: {
    dashboard: DepartmentHeadDashboardScreen,
    tasks: DepartmentHeadTaskListScreen,
    reports: DepartmentHeadReportScreen,
  },
  DEPUTY_CHAIR: {
    dashboard: DeputyChairDashboardScreen,
    tasks: DeputyChairTaskListScreen,
    reports: DeputyChairReportScreen,
  },
  CHAIRMAN: {
    dashboard: ChairmanDashboardScreen,
    tasks: ChairmanTaskListScreen,
    reports: ChairmanReportScreen,
  },
  AGGREGATOR: {
    dashboard: AggregatorDashboardScreen,
    tasks: AggregatorTaskListScreen,
    reports: AggregatorReportScreen,
  },
};
