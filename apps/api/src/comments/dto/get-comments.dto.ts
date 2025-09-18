import { createZodDto } from 'nestjs-zod';
import { getCommentsQuerySchema } from '@acme/schemas';

export class GetCommentsQueryDto extends createZodDto(getCommentsQuerySchema) {}
