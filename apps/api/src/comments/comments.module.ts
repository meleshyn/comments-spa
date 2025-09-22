import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from '../db/database.module';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { StorageModule } from '../storage/storage.module';
import { RecaptchaService } from './services/recaptcha.service';

@Module({
  imports: [DatabaseModule, HttpModule, StorageModule],
  controllers: [CommentsController],
  providers: [CommentsService, RecaptchaService],
  exports: [CommentsService],
})
export class CommentsModule {}
