import { Module } from '@nestjs/common';
import { DatabaseModule } from '../db/database.module';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { StorageModule } from '../storage/storage.module';
import { RecaptchaModule } from '../recaptcha/recaptcha.module';

@Module({
  imports: [DatabaseModule, StorageModule, RecaptchaModule],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
