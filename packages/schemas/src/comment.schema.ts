import { z } from 'zod';

// Schema for creating a comment
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
  parentId: z.string().uuid('Invalid parent ID format.').optional(),
  captchaToken: z.string().min(1, 'CAPTCHA token is required.'),
});

export type CreateCommentDto = z.infer<typeof createCommentSchema>;

// Schema for getting comments with pagination
export const getCommentsQuerySchema = z.object({
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(Number)
    .refine((val) => val >= 1 && val <= 100, 'Limit must be between 1 and 100')
    .default('25'),
  cursor: z.string().uuid('Invalid cursor format').optional(),
  sortBy: z.enum(['userName', 'email', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type GetCommentsQueryDto = z.infer<typeof getCommentsQuerySchema>;
