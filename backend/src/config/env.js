import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().default('mongodb://localhost:27017/slotwise'),
  JWT_SECRET: z.string().min(8).default('change_me'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  SLOT_UNIT_MIN: z.coerce.number().int().positive().default(15),
  MIN_NOTICE_HOURS: z.coerce.number().nonnegative().default(2),
  FREE_CANCEL_HOURS: z.coerce.number().nonnegative().default(24),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  MAIL_FROM: z.string().default('')
}).superRefine((values, context) => {
  if (process.env.NODE_ENV === 'production' && (!values.SMTP_HOST || !values.MAIL_FROM)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'SMTP_HOST and MAIL_FROM are required in production' });
  }
  if (Boolean(values.SMTP_USER) !== Boolean(values.SMTP_PASS)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'SMTP_USER and SMTP_PASS must be configured together' });
  }
  if (values.SMTP_HOST && !values.MAIL_FROM) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'MAIL_FROM is required when SMTP_HOST is configured' });
  }
});

export const env = envSchema.parse(process.env);