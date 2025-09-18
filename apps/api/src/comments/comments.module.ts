import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from '../db/database.module';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { RecaptchaService } from './services/recaptcha.service';

@Module({
  imports: [DatabaseModule, HttpModule],
  controllers: [CommentsController],
  providers: [CommentsService, RecaptchaService],
  exports: [CommentsService],
})
export class CommentsModule {}
