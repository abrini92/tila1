import * as jwt from 'jsonwebtoken';
import { ITokenService } from '@tilawa/domain-user';

export class TokenService implements ITokenService {
  constructor(
    private jwtSecret: string,
    private expiresIn: string = '7d'
  ) {}

  generateAccessToken(userId: string, role: string): string {
    const payload = { userId, role };
    // @ts-ignore - jwt types issue
    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.expiresIn });
  }

  verifyAccessToken(token: string): { userId: string; role: string } {
    const decoded = jwt.verify(token, this.jwtSecret) as { userId: string; role: string };
    return decoded;
  }
}
