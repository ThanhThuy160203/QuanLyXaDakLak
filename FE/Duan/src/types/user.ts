import { RoleKey } from './role';

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  role: RoleKey;
  department?: string;
  managedDepartments?: string[];
  managedRooms?: string[];
  managedEmployees?: string[];
};

export type AuthSession = {
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  fetchedAt: number;
};
