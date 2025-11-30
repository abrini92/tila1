import { IUserRepository } from '../ports';
import { UserProfile } from '../models';
import { NotFoundError } from '@tilawa/utils';

export class UserService {
  constructor(private userRepository: IUserRepository) {}

  async getUserById(id: string): Promise<UserProfile> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async getUserByEmail(email: string): Promise<UserProfile | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async updateUser(id: string, data: { name?: string }): Promise<UserProfile> {
    const user = await this.userRepository.update(id, data);
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
