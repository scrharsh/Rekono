import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, SelfRegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// 5 requests per minute for auth endpoints
const AUTH_THROTTLE_LIMIT = 5;
const AUTH_THROTTLE_TTL = 60000;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Self-register as a CA' })
  @ApiResponse({ status: 201, description: 'Account created, returns JWT token' })
  @ApiResponse({ status: 409, description: 'Username already taken' })
  async signup(@Body() dto: SelfRegisterDto) {
    return this.authService.selfRegister(dto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL } })
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Returns JWT access token and user info' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 423, description: 'Account locked due to too many failed attempts' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL } })
  @ApiOperation({ summary: 'Refresh JWT token' })
  @ApiResponse({ status: 200, description: 'Returns new JWT access token' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto.access_token);
  }

  @Post('logout')
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user (client should discard token)' })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout() {
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  async getProfile(@Request() req: any) {
    return req.user;
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  async healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
