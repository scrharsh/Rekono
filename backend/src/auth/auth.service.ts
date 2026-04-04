import {
  Injectable,
  UnauthorizedException,
  HttpException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createHmac, timingSafeEqual } from 'crypto';
import * as bcrypt from 'bcrypt';
import { SubscriptionPlan, SubscriptionStatus, User } from '../schemas/user.schema';
import { RegisterDto, SelfRegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

type SubscriptionSnapshot = {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  required: boolean;
  activatedAt?: Date;
  expiresAt?: Date;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private getPlanAmountInPaise(plan: SubscriptionPlan): number {
    if (plan === SubscriptionPlan.BUSINESS_YEARLY) {
      return Number(this.configService.get('RAZORPAY_BUSINESS_YEARLY_AMOUNT_PAISE') || 1999900);
    }

    return Number(this.configService.get('RAZORPAY_BUSINESS_MONTHLY_AMOUNT_PAISE') || 199900);
  }

  private getRazorpayAuthHeader(): string {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      throw new HttpException('Razorpay is not configured', 500);
    }

    return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
  }

  private parsePlan(plan?: string): SubscriptionPlan {
    if (plan === SubscriptionPlan.BUSINESS_YEARLY) {
      return SubscriptionPlan.BUSINESS_YEARLY;
    }

    if (plan === SubscriptionPlan.FREE_CA) {
      return SubscriptionPlan.FREE_CA;
    }

    return SubscriptionPlan.BUSINESS_MONTHLY;
  }

  private getDefaultSubscriptionForRole(role: string): SubscriptionSnapshot {
    if (role === 'ca') {
      return {
        plan: SubscriptionPlan.FREE_CA,
        status: SubscriptionStatus.ACTIVE,
        required: false,
        activatedAt: new Date(),
      };
    }

    if (role === 'admin') {
      return {
        plan: SubscriptionPlan.BUSINESS_MONTHLY,
        status: SubscriptionStatus.ACTIVE,
        required: false,
        activatedAt: new Date(),
      };
    }

    return {
      plan: SubscriptionPlan.BUSINESS_MONTHLY,
      status: SubscriptionStatus.INACTIVE,
      required: true,
    };
  }

  private getSubscriptionSnapshot(user: Pick<User, 'role' | 'subscription'>): SubscriptionSnapshot {
    const defaults = this.getDefaultSubscriptionForRole(user.role);
    const sub = user.subscription;

    const snapshot: SubscriptionSnapshot = {
      plan: sub?.plan || defaults.plan,
      status: sub?.status || defaults.status,
      required: sub?.required ?? defaults.required,
      activatedAt: sub?.activatedAt || defaults.activatedAt,
      expiresAt: sub?.expiresAt,
    };

    if (
      snapshot.required &&
      snapshot.status === SubscriptionStatus.ACTIVE &&
      snapshot.expiresAt &&
      new Date(snapshot.expiresAt).getTime() <= Date.now()
    ) {
      return {
        ...snapshot,
        status: SubscriptionStatus.INACTIVE,
      };
    }

    return snapshot;
  }

  private toAuthResponse(user: User & { _id: any }): {
    access_token: string;
    user: {
      id: any;
      username: string;
      role: string;
      showroomIds: any[];
      subscription: SubscriptionSnapshot;
    };
  } {
    const showroomIds = (user.showroomIds || []).map((id: any) => id.toString());
    const subscription = this.getSubscriptionSnapshot(user);

    const payload = {
      sub: user._id.toString(),
      username: user.username,
      role: user.role,
      showroomIds,
      subscription,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        showroomIds,
        subscription,
      },
    };
  }

  private ensureSubscriptionActive(subscription: SubscriptionSnapshot): void {
    if (subscription.required && subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new HttpException(
        {
          code: 'SUBSCRIPTION_REQUIRED',
          message: 'Active business subscription required to use Rekono.',
          subscription,
        },
        402,
      );
    }
  }

  async selfRegister(dto: SelfRegisterDto) {
    const existing = await this.userModel.findOne({ username: dto.username });
    if (existing) throw new ConflictException('Username already taken');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = new this.userModel({
      username: dto.username,
      password: hashedPassword,
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      role: dto.role,
      showroomIds: [],
      subscription: this.getDefaultSubscriptionForRole(dto.role),
    });
    await user.save();

    return this.toAuthResponse(user as User & { _id: any });
  }

  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = new this.userModel({
      username: registerDto.username,
      password: hashedPassword,
      role: registerDto.role,
      showroomIds: registerDto.showroomIds || [],
      subscription: this.getDefaultSubscriptionForRole(registerDto.role),
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

    let shouldPersist = false;

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = undefined;
      shouldPersist = true;
    }

    const currentSubscription = this.getSubscriptionSnapshot(
      user as unknown as Pick<User, 'role' | 'subscription'>,
    );

    // First successful login for business users starts a one-month free trial.
    if (
      user.role === 'staff' &&
      currentSubscription.required &&
      currentSubscription.status !== SubscriptionStatus.ACTIVE &&
      !currentSubscription.activatedAt
    ) {
      const trialDays = Number(this.configService.get('BUSINESS_TRIAL_DAYS') || 30);
      const activatedAt = new Date();
      const expiresAt = new Date(
        activatedAt.getTime() + Math.max(1, trialDays) * 24 * 60 * 60 * 1000,
      );

      user.subscription = {
        plan: SubscriptionPlan.BUSINESS_MONTHLY,
        status: SubscriptionStatus.ACTIVE,
        required: true,
        activatedAt,
        expiresAt,
      } as any;

      shouldPersist = true;
    }

    if (shouldPersist) {
      await user.save();
    }

    return this.toAuthResponse(user as User & { _id: any });
  }

  async validateUser(userId: string) {
    return this.userModel.findById(userId).select('-password');
  }

  async ensureSubscribedUser(userId: string) {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const subscription = this.getSubscriptionSnapshot(
      user as unknown as Pick<User, 'role' | 'subscription'>,
    );

    if (
      user.subscription?.status === SubscriptionStatus.ACTIVE &&
      subscription.status !== SubscriptionStatus.ACTIVE
    ) {
      user.subscription.status = subscription.status as any;
      await user.save();
    }

    this.ensureSubscriptionActive(subscription);

    return {
      user,
      subscription,
    };
  }

  async getSubscriptionStatus(userId: string) {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const subscription = this.getSubscriptionSnapshot(
      user as unknown as Pick<User, 'role' | 'subscription'>,
    );

    if (
      user.subscription?.status === SubscriptionStatus.ACTIVE &&
      subscription.status !== SubscriptionStatus.ACTIVE
    ) {
      user.subscription.status = subscription.status as any;
      await user.save();
    }

    return subscription;
  }

  async activateBusinessSubscription(
    userId: string,
    plan: SubscriptionPlan = SubscriptionPlan.BUSINESS_MONTHLY,
    durationDays = 30,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.role === 'ca') {
      user.subscription = {
        plan: SubscriptionPlan.FREE_CA,
        status: SubscriptionStatus.ACTIVE,
        required: false,
        activatedAt: new Date(),
      } as any;
      await user.save();
      return this.getSubscriptionSnapshot(user as unknown as Pick<User, 'role' | 'subscription'>);
    }

    const activatedAt = new Date();
    const expiresAt = new Date(
      activatedAt.getTime() + Math.max(1, durationDays) * 24 * 60 * 60 * 1000,
    );

    user.subscription = {
      plan,
      status: SubscriptionStatus.ACTIVE,
      required: true,
      activatedAt,
      expiresAt,
    } as any;

    await user.save();
    return this.getSubscriptionSnapshot(user as unknown as Pick<User, 'role' | 'subscription'>);
  }

  async createBusinessSubscriptionPaymentLink(
    userId: string,
    plan: SubscriptionPlan = SubscriptionPlan.BUSINESS_MONTHLY,
    durationDays = 30,
  ) {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.role === 'ca') {
      return {
        free: true,
        message: 'CA workspace is free for now.',
        subscription: this.getSubscriptionSnapshot(
          user as unknown as Pick<User, 'role' | 'subscription'>,
        ),
      };
    }

    const existingSubscription = this.getSubscriptionSnapshot(
      user as unknown as Pick<User, 'role' | 'subscription'>,
    );

    if (
      user.subscription?.status === SubscriptionStatus.ACTIVE &&
      existingSubscription.status !== SubscriptionStatus.ACTIVE
    ) {
      user.subscription.status = existingSubscription.status as any;
      await user.save();
    }

    const selectedPlan =
      plan === SubscriptionPlan.BUSINESS_YEARLY
        ? SubscriptionPlan.BUSINESS_YEARLY
        : SubscriptionPlan.BUSINESS_MONTHLY;

    const amount = this.getPlanAmountInPaise(selectedPlan);
    const callbackUrl = this.configService.get<string>('RAZORPAY_CALLBACK_URL');

    const payload: Record<string, unknown> = {
      amount,
      currency: 'INR',
      accept_partial: false,
      description:
        selectedPlan === SubscriptionPlan.BUSINESS_YEARLY
          ? 'Rekono Business Yearly Subscription'
          : 'Rekono Business Monthly Subscription',
      customer: {
        name: user.fullName || user.username,
        email: user.email,
        contact: user.phone,
      },
      notify: {
        sms: Boolean(user.phone),
        email: Boolean(user.email),
      },
      reminder_enable: true,
      notes: {
        userId: user._id.toString(),
        plan: selectedPlan,
        durationDays: String(durationDays),
        source: 'rekono_subscription',
      },
    };

    if (callbackUrl) {
      payload.callback_url = callbackUrl;
      payload.callback_method = 'get';
    }

    const response = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        Authorization: this.getRazorpayAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as Record<string, any>;
    if (!response.ok) {
      throw new HttpException(
        data?.error?.description || data?.error?.reason || 'Unable to create Razorpay payment link',
        502,
      );
    }

    return {
      paymentLinkId: data.id,
      paymentUrl: data.short_url || data.shortUrl,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      plan: selectedPlan,
      durationDays,
    };
  }

  async processRazorpayWebhook(rawBody: Buffer, signature: string | undefined) {
    const webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new HttpException('Razorpay webhook secret missing', 500);
    }

    if (!signature) {
      throw new HttpException('Missing webhook signature', 401);
    }

    const digest = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    const expected = Buffer.from(digest, 'utf8');
    const provided = Buffer.from(signature, 'utf8');
    const valid = expected.length === provided.length && timingSafeEqual(expected, provided);

    if (!valid) {
      throw new HttpException('Invalid webhook signature', 401);
    }

    const payload = JSON.parse(rawBody.toString('utf8')) as Record<string, any>;
    const eventType = String(payload.event || '');

    if (eventType !== 'payment_link.paid') {
      return { received: true, ignored: true, event: eventType };
    }

    const notes =
      payload?.payload?.payment_link?.entity?.notes ||
      payload?.payload?.payment?.entity?.notes ||
      {};
    const userId = String(notes.userId || '');
    if (!userId) {
      return { received: true, ignored: true, reason: 'Missing userId note' };
    }

    const plan = this.parsePlan(String(notes.plan || SubscriptionPlan.BUSINESS_MONTHLY));
    const durationDays = Number(notes.durationDays || 30);
    const subscription = await this.activateBusinessSubscription(userId, plan, durationDays);

    return {
      received: true,
      activated: true,
      userId,
      subscription,
    };
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

    return this.toAuthResponse(user as User & { _id: any });
  }
}
