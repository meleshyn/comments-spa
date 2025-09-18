import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto, GetCommentsQueryDto } from './dto';
import type { PaginatedCommentsResponse } from './interfaces';
import type { Comment } from '../db/schema';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCommentDto: CreateCommentDto): Promise<Comment> {
    return this.commentsService.createComment(createCommentDto);
  }

  @Get()
  async findAll(
    @Query() query: GetCommentsQueryDto,
  ): Promise<PaginatedCommentsResponse> {
    return this.commentsService.findComments(query);
  }

  @Get(':id/replies')
  async findReplies(
    @Param('id', ParseUUIDPipe) parentId: string,
    @Query() query: GetCommentsQueryDto,
  ): Promise<PaginatedCommentsResponse> {
    return this.commentsService.findComments(query, parentId);
  }
}
