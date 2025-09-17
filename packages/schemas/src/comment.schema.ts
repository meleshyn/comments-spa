import { z } from 'zod';

export const createCommentSchema = z.object({
  userName: z
    .string()
    .regex(
      /^[a-zA-Z0-9]+$/,
      'Username must contain only Latin letters and numbers.'
    ),
  email: z.string().email('Invalid email format.'),
  homePage: z.string().url('Invalid URL format.').optional(),
  text: z.string().min(1, 'Text cannot be empty.'),
  captchaToken: z.string().min(1, 'CAPTCHA token is required.'),
});

export type CreateCommentDto = z.infer<typeof createCommentSchema>;
