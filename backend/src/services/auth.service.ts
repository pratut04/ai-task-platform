import jwt from 'jsonwebtoken';
import config from '../config';
import userRepository from '../repositories/user.repository';
import { JwtPayload, UserRole } from '../types';
import { IUser } from '../models/User.model';

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: Omit<IUser, 'password'>;
  tokens: AuthTokens;
}

export class AuthService {
  private generateAccessToken(user: IUser): string {
    const payload: JwtPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as string,
    });
  }

  private generateRefreshToken(user: IUser): string {
    const payload: JwtPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return jwt.sign(payload, config.jwtRefreshSecret, {
      expiresIn: config.jwtRefreshExpiresIn as string,
    });
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    // Check if user already exists
    const exists = await userRepository.existsByEmail(dto.email);
    if (exists) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    const user = await userRepository.create(dto);

    const tokens: AuthTokens = {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };

    return { user, tokens };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    // Fetch user including password
    const user = await userRepository.findByEmail(dto.email, true);
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const isValid = await user.comparePassword(dto.password);
    if (!isValid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const tokens: AuthTokens = {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };

    // Remove password from returned user
    const userWithoutPassword = user.toJSON();

    return { user: userWithoutPassword as unknown as Omit<IUser, 'password'>, tokens };
  }

  async refreshToken(token: string): Promise<AuthTokens> {
    try {
      const payload = jwt.verify(token, config.jwtRefreshSecret) as JwtPayload;
      const user = await userRepository.findById(payload.id);
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      return {
        accessToken: this.generateAccessToken(user),
        refreshToken: this.generateRefreshToken(user),
      };
    } catch {
      throw new Error('INVALID_REFRESH_TOKEN');
    }
  }

  async getProfile(userId: string): Promise<IUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }
    return user;
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwtSecret) as JwtPayload;
    } catch {
      throw new Error('INVALID_ACCESS_TOKEN');
    }
  }
}

export default new AuthService();
