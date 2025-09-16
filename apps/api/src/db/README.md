# Database Setup

This directory contains the database schema and configuration for the comments SPA.

## Files

- `schema.ts` - Drizzle ORM schema definitions for comments and attachments tables
- `database.module.ts` - NestJS module for database configuration
- `database.service.ts` - Service providing database connection and Drizzle instance
- `migrations/` - Generated SQL migration files
- `index.ts` - Barrel export file

## Database Schema

### Comments Table

- `id` (UUID, Primary Key)
- `user_name` (VARCHAR(255), NOT NULL)
- `email` (VARCHAR(255), NOT NULL)
- `home_page` (VARCHAR(500), NULLABLE)
- `text` (TEXT, NOT NULL)
- `parent_id` (UUID, NULLABLE, FK to comments.id) - For nested comments
- `created_at` (TIMESTAMP WITH TIMEZONE, NOT NULL, DEFAULT NOW)

### Attachments Table

- `id` (UUID, Primary Key)
- `comment_id` (UUID, NOT NULL, FK to comments.id)
- `file_url` (VARCHAR(500), NOT NULL)
- `file_type` (ENUM: 'image' | 'text', NOT NULL)

## Usage

```typescript
import { DrizzleService } from './db/database.service';

@Injectable()
export class SomeService {
  constructor(private drizzle: DrizzleService) {}

  async getComments() {
    return this.drizzle.db.select().from(comments);
  }
}
```

## Environment Variables

Required environment variables:

- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_USER` - Database username (default: postgres)
- `DB_PASSWORD` - Database password (default: postgres)
- `DB_NAME` - Database name (default: comments_spa)

## Commands

- `pnpm run db:generate` - Generate migration files
- `pnpm run db:migrate` - Run migrations
- `pnpm run db:push` - Push schema changes directly
- `pnpm run db:studio` - Open Drizzle Studio
