import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { Env } from '../../config/env.schema';

interface RecaptchaResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

@Injectable()
export class RecaptchaService {
  private readonly secretKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<Env>,
  ) {
    this.secretKey = this.configService.get<string>('RECAPTCHA_SECRET_KEY')!;
  }

  async validate(token: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<RecaptchaResponse>(
          'https://www.google.com/recaptcha/api/siteverify',
          null,
          {
            params: {
              secret: this.secretKey,
              response: token,
            },
          },
        ),
      );

      if (!response.data.success) {
        const errorCodes = response.data['error-codes'] || [];
        console.warn('reCAPTCHA validation failed:', errorCodes);
        throw new BadRequestException('Invalid CAPTCHA.');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('reCAPTCHA validation error:', error);
      throw new BadRequestException('Failed to validate CAPTCHA.');
    }
  }
}
