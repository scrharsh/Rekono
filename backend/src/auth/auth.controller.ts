import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Headers,
  Req,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, SelfRegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ActivateSubscriptionDto } from './dto/subscription.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SkipSubscriptionCheck } from './decorators/skip-subscription.decorator';
import { SubscriptionPlan } from '../schemas/user.schema';

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

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  @SkipSubscriptionCheck()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user subscription status' })
  async getSubscription(@Request() req: any) {
    return this.authService.getSubscriptionStatus(req.user.userId);
  }

  @Post('subscription/activate')
  @UseGuards(JwtAuthGuard)
  @SkipSubscriptionCheck()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate current user subscription (CA remains free)' })
  async activateSubscription(
    @Request() req: any,
    @Body() dto: ActivateSubscriptionDto,
  ) {
    return this.authService.activateBusinessSubscription(
      req.user.userId,
      dto.plan || SubscriptionPlan.BUSINESS_MONTHLY,
      dto.durationDays || 30,
    );
  }

  @Post('subscription/payment-link')
  @UseGuards(JwtAuthGuard)
  @SkipSubscriptionCheck()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Razorpay payment link for business subscription' })
  async createSubscriptionPaymentLink(
    @Request() req: any,
    @Body() dto: ActivateSubscriptionDto,
  ) {
    return this.authService.createBusinessSubscriptionPaymentLink(
      req.user.userId,
      dto.plan || SubscriptionPlan.BUSINESS_MONTHLY,
      dto.durationDays || 30,
    );
  }

  @Post('subscription/webhook/razorpay')
  @HttpCode(200)
  @ApiOperation({ summary: 'Razorpay webhook handler for subscription activation' })
  async razorpayWebhook(
    @Req() req: any,
    @Headers('x-razorpay-signature') signature?: string,
  ) {
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body || {}), 'utf8');
    return this.authService.processRazorpayWebhook(rawBody, signature);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  async healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
