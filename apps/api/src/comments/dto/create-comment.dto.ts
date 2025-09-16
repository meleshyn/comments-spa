import { createZodDto } from 'nestjs-zod';
import { createCommentSchema } from '@acme/schemas';

export class CreateCommentDto extends createZodDto(createCommentSchema) {}
