import { User, UserProfile } from './models';

// Repository interface (to be implemented in infra layer)
export interface IUserRepository {
  create(data: { email: string; password: string; name?: string; role?: string }): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}

// Password service interface
export interface IPasswordService {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

// Token service interface
export interface ITokenService {
  generateAccessToken(userId: string, role: string): string;
  verifyAccessToken(token: string): { userId: string; role: string };
}
