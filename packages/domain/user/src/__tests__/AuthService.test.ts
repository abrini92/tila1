import { AuthService } from '../services/AuthService';
import { IUserRepository, IPasswordService, ITokenService } from '../ports';
import { User } from '../models';
import { ValidationError, UnauthorizedError } from '@tilawa/utils';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPasswordService: jest.Mocked<IPasswordService>;
  let mockTokenService: jest.Mocked<ITokenService>;

  beforeEach(() => {
    // Create mocks
    mockUserRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockPasswordService = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    mockTokenService = {
      generateAccessToken: jest.fn(),
      verifyAccessToken: jest.fn(),
    };

    authService = new AuthService(
      mockUserRepository,
      mockPasswordService,
      mockTokenService
    );
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const name = 'Test User';

      const mockUser: User = {
        id: 'user-123',
        email,
        password: 'hashed-password',
        name,
        role: 'USER' as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPasswordService.hash.mockResolvedValue('hashed-password');
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockTokenService.generateAccessToken.mockReturnValue('mock-token');

      const result = await authService.register(email, password, name);

      expect(result).toEqual({
        accessToken: 'mock-token',
        user: {
          id: 'user-123',
          email,
          name,
          role: 'USER',
          createdAt: mockUser.createdAt,
        },
      });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockPasswordService.hash).toHaveBeenCalledWith(password);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email,
        password: 'hashed-password',
        name,
        role: 'USER',
      });
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith('user-123', 'USER');
    });

    it('should throw ValidationError for invalid email', async () => {
      await expect(
        authService.register('invalid-email', 'password123')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for short password', async () => {
      await expect(
        authService.register('test@example.com', 'short')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if email already exists', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed',
        role: 'USER' as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.register('test@example.com', 'password123')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const mockUser: User = {
        id: 'user-123',
        email,
        password: 'hashed-password',
        name: 'Test User',
        role: 'USER' as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(true);
      mockTokenService.generateAccessToken.mockReturnValue('mock-token');

      const result = await authService.login(email, password);

      expect(result).toEqual({
        accessToken: 'mock-token',
        user: {
          id: 'user-123',
          email,
          name: 'Test User',
          role: 'USER',
          createdAt: mockUser.createdAt,
        },
      });

      expect(mockPasswordService.compare).toHaveBeenCalledWith(password, 'hashed-password');
    });

    it('should throw UnauthorizedError for non-existent user', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login('test@example.com', 'password123')
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for invalid password', async () => {
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'USER' as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.compare.mockResolvedValue(false);

      await expect(
        authService.login('test@example.com', 'wrong-password')
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('verifyToken', () => {
    it('should successfully verify a valid token', async () => {
      const mockDecoded = { userId: 'user-123', role: 'USER' };
      mockTokenService.verifyAccessToken.mockReturnValue(mockDecoded);

      const result = await authService.verifyToken('valid-token');

      expect(result).toEqual(mockDecoded);
      expect(mockTokenService.verifyAccessToken).toHaveBeenCalledWith('valid-token');
    });

    it('should throw UnauthorizedError for invalid token', async () => {
      mockTokenService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        authService.verifyToken('invalid-token')
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
