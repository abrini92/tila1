import { IUserRepository, IPasswordService, ITokenService } from '../ports';
import { UserProfile } from '../models';
import { ValidationError, UnauthorizedError } from '@tilawa/utils';
import { isValidEmail, isValidPassword } from '@tilawa/utils';

export class AuthService {
  constructor(
    private userRepository: IUserRepository,
    private passwordService: IPasswordService,
    private tokenService: ITokenService
  ) {}

  async register(email: string, password: string, name?: string): Promise<{ accessToken: string; user: UserProfile }> {
    // Validate input
    if (!isValidEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    if (!isValidPassword(password)) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.passwordService.hash(password);

    // Create user
    const user = await this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      role: 'USER',
    });

    // Generate token
    const accessToken = this.tokenService.generateAccessToken(user.id, user.role);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  async login(email: string, password: string): Promise<{ accessToken: string; user: UserProfile }> {
    // Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.passwordService.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate token
    const accessToken = this.tokenService.generateAccessToken(user.id, user.role);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  async verifyToken(token: string): Promise<{ userId: string; role: string }> {
    try {
      return this.tokenService.verifyAccessToken(token);
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }
}
