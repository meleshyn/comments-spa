import { Comment } from '../../db/schema';

export interface CommentWithRepliesCount extends Comment {
  repliesCount: number;
}

export interface PaginatedCommentsResponse {
  data: CommentWithRepliesCount[];
  nextCursor: string | null;
}
