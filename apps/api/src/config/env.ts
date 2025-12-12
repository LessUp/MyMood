import { z } from 'zod';

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    MONGODB_URI: z.string().default('mongodb://localhost:27017/moodflow'),
    CORS_ORIGIN: z.string().optional(),

    JWT_SECRET: z.string().optional(),
    JWT_REFRESH_SECRET: z.string().optional(),
    JWT_EXPIRES_IN: z.string().optional(),
    JWT_REFRESH_EXPIRES_IN: z.string().optional(),

    WX_APP_ID: z.string().optional(),
    WX_APP_SECRET: z.string().optional()
  })
  .superRefine((val, ctx) => {
    if (val.NODE_ENV === 'production') {
      if (!val.JWT_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'JWT_SECRET_NOT_CONFIGURED',
          path: ['JWT_SECRET']
        });
      }
      if (!val.JWT_REFRESH_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'JWT_REFRESH_SECRET_NOT_CONFIGURED',
          path: ['JWT_REFRESH_SECRET']
        });
      }
    }
  });

export const env = EnvSchema.parse(process.env);
