import {
  Injectable,
  UnauthorizedException,
  HttpException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../schemas/user.schema';
import { RegisterDto, SelfRegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async selfRegister(dto: SelfRegisterDto) {
    const existing = await this.userModel.findOne({ username: dto.username });
    if (existing) throw new ConflictException('Username already taken');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = new this.userModel({
      username: dto.username,
      password: hashedPassword,
      role: 'ca',
      showroomIds: [],
    });
    await user.save();

    const payload = {
      sub: user._id.toString(),
      username: user.username,
      role: user.role,
      showroomIds: [],
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user._id, username: user.username, role: user.role, showroomIds: [] },
    };
  }

  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = new this.userModel({
      username: registerDto.username,
      password: hashedPassword,
      role: registerDto.role,
      showroomIds: registerDto.showroomIds || [],
    });

    await user.save();

    const result = user.toObject() as unknown as Record<string, unknown>;
    delete result.password;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.userModel.findOne({ username: loginDto.username });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new HttpException(
        { message: 'Account is locked. Try again later.', lockedUntil: user.lockedUntil },
        423, // HTTP 423 Locked
      );
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      // Increment failed attempts
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= 3) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }

      await user.save();
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = undefined;
      await user.save();
    }

    const payload = {
      sub: user._id.toString(),
      username: user.username,
      role: user.role,
      showroomIds: user.showroomIds.map((id) => id.toString()),
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        showroomIds: user.showroomIds,
      },
    };
  }

  async validateUser(userId: string) {
    return this.userModel.findById(userId).select('-password');
  }

  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async refresh(token: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.userModel.findById(payload.sub).select('-password');
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const newPayload = {
      sub: user._id.toString(),
      username: user.username,
      role: user.role,
      showroomIds: user.showroomIds.map((id) => id.toString()),
    };

    return {
      access_token: this.jwtService.sign(newPayload),
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        showroomIds: user.showroomIds,
      },
    };
  }
}
