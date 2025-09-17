import { Injectable } from '@nestjs/common';
import { isNull } from 'drizzle-orm';
import dompurify from 'isomorphic-dompurify';
import { DrizzleService } from '../db/database.service';
import { comments, type Comment, type NewComment } from '../db/schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { RecaptchaService } from './recaptcha.service';

@Injectable()
export class CommentsService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly recaptchaService: RecaptchaService,
  ) {}

  async create(createCommentDto: CreateCommentDto): Promise<Comment> {
    // Validate CAPTCHA token first - fail fast approach
    await this.recaptchaService.validate(createCommentDto.captchaToken);

    // Sanitize the text field - only allow specific HTML tags
    const sanitizedText = dompurify.sanitize(createCommentDto.text, {
      ALLOWED_TAGS: ['a', 'code', 'i', 'strong'],
    });

    const newComment: NewComment = {
      userName: createCommentDto.userName,
      email: createCommentDto.email,
      homePage: createCommentDto.homePage || null,
      text: sanitizedText,
      parentId: null, // For now, we're only creating root-level comments
    };

    const [insertedComment] = await this.drizzle.db
      .insert(comments)
      .values(newComment)
      .returning();

    if (!insertedComment) {
      throw new Error('Failed to create comment');
    }

    return insertedComment;
  }

  async findAll(): Promise<Comment[]> {
    // For now, fetch all root-level comments (parentId is null)
    // Pagination and sorting will be added later
    const allComments = await this.drizzle.db
      .select()
      .from(comments)
      .where(isNull(comments.parentId))
      .orderBy(comments.createdAt);

    return allComments;
  }
}
