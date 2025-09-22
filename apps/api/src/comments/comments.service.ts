import { Injectable } from '@nestjs/common';
import { isNull, eq, desc, asc, and, sql, SQL } from 'drizzle-orm';
import dompurify from 'isomorphic-dompurify';
import { decode } from 'html-entities';
import { StorageService } from '../storage/storage.service';
import { RecaptchaService } from './services/recaptcha.service';
import {
  DrizzleService,
  comments,
  attachments,
  type Comment,
  type NewComment,
  type NewAttachment,
} from '../db';
import { CreateCommentDto, GetCommentsQueryDto } from './dto';
import {
  type PaginatedCommentsResponse,
  type CommentWithRepliesCount,
} from './interfaces';

@Injectable()
export class CommentsService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly recaptchaService: RecaptchaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Create a new comment with optional file attachments
   */
  async createComment(
    createCommentDto: CreateCommentDto,
    files?: Express.Multer.File[],
  ): Promise<Comment> {
    // Validate CAPTCHA token first - fail fast approach
    await this.recaptchaService.validate(createCommentDto.captchaToken);

    // Sanitize the text field - only allow specific HTML tags
    const sanitizedText = this.sanitizeCommentText(createCommentDto.text);

    const newComment: NewComment = {
      userName: createCommentDto.userName,
      email: createCommentDto.email,
      homePage: createCommentDto.homePage || null,
      text: sanitizedText,
      parentId: createCommentDto.parentId || null,
    };

    // Insert the comment first
    const [insertedComment] = await this.drizzle.db
      .insert(comments)
      .values(newComment)
      .returning();

    if (!insertedComment) {
      throw new Error('Failed to create comment');
    }

    // Process and upload files if any
    if (files && files.length > 0) {
      try {
        const processedFiles = await this.storageService.uploadFiles(files);

        // Save attachment records to database
        const attachmentRecords: NewAttachment[] = processedFiles.map(
          (file) => ({
            commentId: insertedComment.id,
            fileUrl: file.publicUrl,
            fileType: file.fileType,
          }),
        );

        if (attachmentRecords.length > 0) {
          await this.drizzle.db.insert(attachments).values(attachmentRecords);
        }
      } catch (error) {
        throw new Error('Failed to process attachments', { cause: error });
      }
    }

    return insertedComment;
  }

  /**
   * Get paginated comments with cursor-based pagination and replies count
   * Supports both root comments and replies based on parentId parameter
   * Uses SQL subquery to efficiently calculate replies count without N+1 queries
   */
  async findComments(
    query: GetCommentsQueryDto,
    parentId?: string,
  ): Promise<PaginatedCommentsResponse> {
    // Build where conditions including cursor pagination
    const whereConditions = await this.buildWhereConditions(query, parentId);

    // Execute the main query with replies count
    const results = await this.executeCommentsQuery(query, whereConditions);

    // Process pagination results
    return this.processPaginationResults(results, query.limit);
  }

  /**
   * Comments query with replies count and attachments using a single optimized query
   * Uses LEFT JOIN and aggregation to minimize database roundtrips
   */
  private async executeCommentsQuery(
    query: GetCommentsQueryDto,
    whereConditions: SQL[],
  ): Promise<CommentWithRepliesCount[]> {
    const { sortBy, sortOrder, limit } = query;

    const orderDirection = sortOrder === 'desc' ? desc : asc;

    // Single optimized query using LEFT JOINs and JSON aggregation
    const results = await this.drizzle.db
      .select({
        id: comments.id,
        userName: comments.userName,
        email: comments.email,
        homePage: comments.homePage,
        text: comments.text,
        parentId: comments.parentId,
        createdAt: comments.createdAt,
        repliesCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${comments} AS replies 
          WHERE replies.parent_id = ${comments.id}
        )`.as('repliesCount'),
        // Aggregate attachments using JSON_AGG to avoid N+1 queries
        attachments: sql<any[]>`
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', ${attachments.id},
                'commentId', ${attachments.commentId},
                'fileUrl', ${attachments.fileUrl},
                'fileType', ${attachments.fileType}
              )
            ) FILTER (WHERE ${attachments.id} IS NOT NULL),
            '[]'::json
          )
        `.as('attachments'),
      })
      .from(comments)
      .leftJoin(attachments, eq(comments.id, attachments.commentId))
      .where(and(...whereConditions))
      .groupBy(
        comments.id,
        comments.userName,
        comments.email,
        comments.homePage,
        comments.text,
        comments.parentId,
        comments.createdAt,
      )
      .orderBy(orderDirection(comments[sortBy]), orderDirection(comments.id))
      .limit(limit + 1);

    return results;
  }

  /**
   * Create where conditions for the comments query including cursor pagination
   */
  private async buildWhereConditions(
    query: GetCommentsQueryDto,
    parentId?: string,
  ): Promise<SQL[]> {
    // Base condition for parent/root comments
    const whereConditions: SQL[] = [
      parentId ? eq(comments.parentId, parentId) : isNull(comments.parentId),
    ];

    // Cursor pagination conditions if cursor is provided
    if (query.cursor) {
      const cursorCondition = await this.buildCursorCondition(query);
      if (cursorCondition) {
        whereConditions.push(cursorCondition);
      }
    }

    return whereConditions;
  }

  /**
   * Create cursor condition for pagination based on sort field and order
   */
  private async buildCursorCondition(
    query: GetCommentsQueryDto,
  ): Promise<SQL | null> {
    const { sortBy, sortOrder, cursor } = query;

    const sortField = comments[sortBy];
    const selectFields = { [sortBy]: sortField, id: comments.id };

    const cursorComment = await this.drizzle.db
      .select(selectFields)
      .from(comments)
      .where(eq(comments.id, cursor as string))
      .limit(1);

    if (cursorComment.length > 0 && cursorComment[0]) {
      const cursorValue = cursorComment[0]?.[sortBy];
      const cursorId = cursorComment[0]?.id;

      // Sort field and ID for stable pagination
      return sortOrder === 'desc'
        ? sql`(${sortField} < ${cursorValue} OR (${sortField} = ${cursorValue} AND ${comments.id} < ${cursorId}))`
        : sql`(${sortField} > ${cursorValue} OR (${sortField} = ${cursorValue} AND ${comments.id} > ${cursorId}))`;
    }

    return null;
  }

  /**
   * Process pagination results to determine next cursor and format response
   */
  private processPaginationResults(
    results: CommentWithRepliesCount[],
    limit: number,
  ): PaginatedCommentsResponse {
    const hasNextPage = results.length > limit;
    const data = hasNextPage ? results.slice(0, limit) : results;
    const nextCursor = hasNextPage ? (data[data.length - 1]?.id ?? null) : null;

    return { data, nextCursor };
  }

  /**
   * Sanitize comment text to prevent XSS attacks
   */
  private sanitizeCommentText(rawText: string): string {
    const decodedText = decode(rawText);
    return dompurify.sanitize(decodedText, {
      ALLOWED_TAGS: ['a', 'code', 'i', 'strong'],
      ALLOWED_ATTR: ['href'],
    });
  }
}
