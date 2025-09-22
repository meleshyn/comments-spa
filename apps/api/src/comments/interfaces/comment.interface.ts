import { Comment, Attachment } from '../../db/schema';

export interface CommentWithRepliesCount extends Comment {
  repliesCount: number;
  attachments: Attachment[];
}

export interface PaginatedCommentsResponse {
  data: CommentWithRepliesCount[];
  nextCursor: string | null;
}
