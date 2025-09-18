import { Injectable } from '@nestjs/common';
import { isNull, eq, desc, asc, and, sql, SQL } from 'drizzle-orm';
import dompurify from 'isomorphic-dompurify';
import { RecaptchaService } from './services/recaptcha.service';
import { DrizzleService, comments, type Comment, type NewComment } from '../db';
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
  ) {}

  /**
   * Create a new comment
   */
  async createComment(createCommentDto: CreateCommentDto): Promise<Comment> {
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

    const [insertedComment] = await this.drizzle.db
      .insert(comments)
      .values(newComment)
      .returning();

    if (!insertedComment) {
      throw new Error('Failed to create comment');
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
   * Comments query with replies count subquery
   */
  private async executeCommentsQuery(
    query: GetCommentsQueryDto,
    whereConditions: SQL[],
  ): Promise<CommentWithRepliesCount[]> {
    const { sortBy, sortOrder, limit } = query;

    const orderDirection = sortOrder === 'desc' ? desc : asc;

    return this.drizzle.db
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
          WHERE replies.parent_id = comments.id
        )`.as('repliesCount'),
      })
      .from(comments)
      .where(and(...whereConditions))
      .orderBy(orderDirection(comments[sortBy]), orderDirection(comments.id)) // Secondary sort by ID for stability
      .limit(limit + 1);
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
      const cursorValue = cursorComment[0][sortBy];
      const cursorId = cursorComment[0].id;

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
    return dompurify.sanitize(rawText, {
      ALLOWED_TAGS: ['a', 'code', 'i', 'strong'],
    });
  }
}
