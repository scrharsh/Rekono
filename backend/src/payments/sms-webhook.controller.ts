import {
  Body,
  Controller,
  Headers,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  Request,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { timingSafeEqual } from 'crypto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SmsWebhookService } from './index';

interface SmsWebhookPayload {
  // SMS metadata
  smsId?: string;
  timestamp: string; // ISO 8601
  FROM: string;
  TO: string;
  body: string;

  // Gateway context (varies by provider)
  provider?: string; // 'razorpay' | 'twilio' | 'phonpe' | 'paytm'
  metadata?: Record<string, unknown>;
}

/**
 * SMS Webhook Receiver
 *
 * Accepts payment notification SMSes from multiple sources:
 * - RazorPay Payment Links
 * - PhonePe UPI notifications
 * - Paytm payment confirmations
 * - Custom bank notifications
 *
 * Parses payment details and auto-creates payment records
 * that can be auto-reconciled against sales.
 */
@ApiTags('payments/sms-webhook')
@Controller('payments/sms-webhook')
export class SmsWebhookController {
  private readonly logger = new Logger(SmsWebhookController.name);

  constructor(
    private readonly svc: SmsWebhookService,
    private readonly configService: ConfigService,
  ) {}

  private assertWebhookSecret(provider: 'razorpay' | 'phonepe', incomingSecret?: string) {
    const providerKey = provider === 'razorpay' ? 'RAZORPAY_PAYMENT_WEBHOOK_SECRET' : 'PHONEPE_WEBHOOK_SECRET';
    const expectedSecret =
      this.configService.get<string>(providerKey) || this.configService.get<string>('PAYMENT_WEBHOOK_SECRET');

    if (!expectedSecret) {
      if (this.configService.get<string>('NODE_ENV') === 'production') {
        throw new ServiceUnavailableException('Payment webhook secret not configured');
      }
      return;
    }

    if (!incomingSecret) {
      throw new UnauthorizedException('Missing webhook secret header');
    }

    const expectedBuffer = Buffer.from(expectedSecret, 'utf8');
    const incomingBuffer = Buffer.from(incomingSecret, 'utf8');
    if (
      expectedBuffer.length !== incomingBuffer.length ||
      !timingSafeEqual(expectedBuffer, incomingBuffer)
    ) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
  }

  /**
   * Receive SMS from Twilio or other SMS gateway
   * This requires authentication to route payment to correct showroom
   */
  @Post(':showroomId/receive')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Receive SMS notification for payment from Twilio or SMS gateway (authenticated)',
  })
  @ApiBody({ type: Object })
  async receiveSms(
    @Param('showroomId') showroomId: string,
    @Body() payload: SmsWebhookPayload,
    @Request() req: any,
  ) {
    try {
      const { smsId, timestamp, FROM, TO, body, provider } = payload;

      this.logger.debug(`SMS received for showroom ${showroomId}: ${FROM} → ${TO}`);

      // Parse SMS content and extract payment details
      const parsed = await this.svc.parseSmsBody(body, provider);
      if (!parsed) {
        this.logger.warn(`Failed to parse SMS: ${body.substring(0, 100)}...`);
        return { status: 'discarded', reason: 'could_not_parse' };
      }

      const { amount, transactionId, method, description, senderPhone } = parsed;

      // Auto-create payment record
      const payment = await this.svc.upsertPaymentFromSms({
        showroomId,
        smsId,
        amount,
        transactionId,
        paymentMethod: method,
        description,
        senderPhone,
        receivedAt: new Date(timestamp),
      });

      return {
        status: 'processed',
        paymentId: payment._id,
        amount: payment.amount,
        method: payment.paymentMethod,
      };
    } catch (error: any) {
      this.logger.error(`SMS webhook error: ${error.message}`);
      throw new HttpException(
        { error: 'SMS processing failed', details: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * RazorPay Webhook Integration
   * Public endpoint - uses webhook secret for verification instead of JWT
   * Include showroomId in query param: ?showroom=ABC123
   */
  @Post('razorpay')
  @Throttle({ default: { limit: 300, ttl: 60000 } })
  @ApiOperation({
    summary: 'RazorPay payment webhook (public, requires showroom ID in query)',
  })
  async handleRazorpayWebhook(
    @Query('showroom') showroomId: string,
    @Body() payload: any,
    @Headers('x-webhook-secret') webhookSecret?: string,
  ) {
    try {
      this.assertWebhookSecret('razorpay', webhookSecret);

      if (!showroomId) {
        throw new HttpException(
          { error: 'showroom query parameter required' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const { event, payload: eventPayload } = payload;

      if (event === 'payment_link.completed' || event === 'payment.authorized') {
        const paymentData = eventPayload.payment ?? eventPayload;
        const { amount, method, receipt, notes } = paymentData;

        const payment = await this.svc.upsertPaymentFromSms({
          showroomId,
          amount: amount / 100, // Razorpay returns amount in paise
          transactionId: receipt,
          paymentMethod: method || 'upi',
          description: notes?.description || 'RazorPay Payment',
          senderPhone: notes?.phone || '',
          receivedAt: new Date(),
        });

        return { status: 'processed', paymentId: payment._id };
      }

      return { status: 'ignored', reason: 'event_type_not_handled' };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`RazorPay webhook error: ${error.message}`);
      throw new HttpException(
        { error: 'RazorPay webhook failed' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * PhonePe Webhook Integration
   * Public endpoint - uses webhook secret for verification
   * Include showroomId in query param: ?showroom=ABC123
   */
  @Post('phonepe')
  @Throttle({ default: { limit: 300, ttl: 60000 } })
  @ApiOperation({
    summary: 'PhonePe payment webhook (public, requires showroom ID in query)',
  })
  async handlePhonepeWebhook(
    @Query('showroom') showroomId: string,
    @Body() payload: any,
    @Headers('x-webhook-secret') webhookSecret?: string,
  ) {
    try {
      this.assertWebhookSecret('phonepe', webhookSecret);

      if (!showroomId) {
        throw new HttpException(
          { error: 'showroom query parameter required' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const { success, code, data } = payload;

      if (success && code === 'PAYMENT_SUCCESS') {
        const { amount, transactionId, upiTransactionId, payerUPA, payerInfo } = data;

        const payment = await this.svc.upsertPaymentFromSms({
          showroomId,
          amount: amount / 100, // PhonePe returns amount in paise
          transactionId: transactionId || upiTransactionId,
          paymentMethod: 'upi',
          description: `PhonePe UPI from ${payerUPA}`,
          senderPhone: payerInfo?.mobile || '',
          receivedAt: new Date(),
        });

        return { status: 'processed', paymentId: payment._id };
      }

      return { status: 'failed', reason: 'payment_not_success' };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`PhonePe webhook error: ${error.message}`);
      throw new HttpException(
        { error: 'PhonePe webhook failed' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Health check endpoint
   */
  @Post('health')
  @SkipThrottle()
  async healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
