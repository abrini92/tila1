import { Entity, UserRole } from '@tilawa/types';

export interface User extends Entity {
  email: string;
  password: string;
  name?: string;
  role: UserRole;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  createdAt: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
}
