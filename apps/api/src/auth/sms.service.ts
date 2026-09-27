import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ConfigService,
} from '@nestjs/config';

type SmsIrResponse = {
  status?: number;
  message?: string;
};

@Injectable()
export class SmsService {
  constructor(
    private readonly config:
      ConfigService,
  ) {}

  async sendOtp(
    mobile: string,
    code: string,
  ): Promise<void> {
    const apiKey =
      this.config.get<string>(
        'SMSIR_API_KEY',
      );

    const baseUrl =
      this.config.get<string>(
        'SMSIR_BASE_URL',
      ) ??
      'https://api.sms.ir/v1';

    const templateId =
      Number(
        this.config.get<string>(
          'SMSIR_TEMPLATE_ID',
        ),
      );

    const parameterName =
      this.config.get<string>(
        'SMSIR_PARAMETER_NAME',
      ) ?? 'CODE';

    if (
      !apiKey ||
      !Number.isInteger(templateId)
    ) {
      throw new ServiceUnavailableException({
        code: 'SMS_NOT_CONFIGURED',
        message:
          'سرویس پیامک تنظیم نشده است.',
      });
    }

    const response =
      await fetch(
        `${baseUrl}/send/verify`,
        {
          method: 'POST',
          headers: {
            Accept:
              'application/json',
            'Content-Type':
              'application/json',
            'X-API-KEY':
              apiKey,
          },
          body: JSON.stringify({
            mobile,
            templateId,
            parameters: [
              {
                name:
                  parameterName,
                value: code,
              },
            ],
          }),
          signal:
            AbortSignal.timeout(
              10_000,
            ),
        },
      );

    let result:
      SmsIrResponse | null = null;

    try {
      result =
        (await response.json()) as
          SmsIrResponse;
    } catch {
      result = null;
    }

    if (
      !response.ok ||
      (
        typeof result?.status ===
          'number' &&
        result.status !== 1
      )
    ) {
      throw new ServiceUnavailableException({
        code: 'SMS_SEND_FAILED',
        message:
          'ارسال پیامک انجام نشد.',
      });
    }
  }
}