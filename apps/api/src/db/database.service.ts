import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { Env } from '../config/env.schema';
import * as schema from './schema';

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private pool!: Pool;
  public db!: ReturnType<typeof drizzle>;
  private readonly logger = new Logger(DrizzleService.name);

  constructor(private readonly configService: ConfigService<Env>) {}

  async onModuleInit(): Promise<void> {
    const dbConfig = {
      host: this.configService.get<string>('DB_HOST'),
      port: this.configService.get<number>('DB_PORT'),
      user: this.configService.get<string>('DB_USER'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_NAME'),
    };

    this.pool = new Pool(dbConfig);
    this.db = drizzle(this.pool, { schema });

    // Test the connection
    try {
      await this.pool.query('SELECT 1');
      this.logger.log('Database connection established successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.logger.log('Database connection closed');
    }
  }

  getDb() {
    return this.db;
  }
}
