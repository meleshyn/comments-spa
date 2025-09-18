import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient, type SortBy, type SortOrder } from './api';

/**
 * Query keys for TanStack Query
 */
export const commentKeys = {
  all: ['comments'] as const,
  roots: (sortBy: SortBy, sortOrder: SortOrder) =>
    [...commentKeys.all, 'roots', sortBy, sortOrder] as const,
  replies: (parentId: string) =>
    [...commentKeys.all, 'replies', parentId] as const,
};

/**
 * Hook to fetch root comments with infinite pagination and sorting
 */
export function useRootComments(
  sortBy: SortBy = 'createdAt',
  sortOrder: SortOrder = 'desc'
) {
  return useInfiniteQuery({
    queryKey: commentKeys.roots(sortBy, sortOrder),
    queryFn: ({ pageParam }) => {
      const params: Parameters<typeof apiClient.getRootComments>[0] = {
        limit: 25,
        sortBy,
        sortOrder,
      };
      if (pageParam) {
        params.cursor = pageParam;
      }
      return apiClient.getRootComments(params);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch replies for a specific comment with infinite pagination
 */
export function useCommentReplies(commentId: string, enabled = false) {
  return useInfiniteQuery({
    queryKey: commentKeys.replies(commentId),
    queryFn: ({ pageParam }) => {
      const params: Parameters<typeof apiClient.getCommentReplies>[1] = {
        limit: 25,
      };
      if (pageParam) {
        params.cursor = pageParam;
      }
      return apiClient.getCommentReplies(commentId, params);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new comment
 */
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      userName: string;
      email: string;
      homePage?: string;
      text: string;
      parentId?: string;
      captchaToken: string;
    }) => apiClient.createComment(data),
    onSuccess: (newComment) => {
      // Invalidate and refetch relevant queries
      if (newComment.parentId) {
        // If it's a reply, invalidate the parent's replies
        queryClient.invalidateQueries({
          queryKey: commentKeys.replies(newComment.parentId),
        });
      } else {
        // If it's a root comment, invalidate all root comment queries
        queryClient.invalidateQueries({
          queryKey: commentKeys.all,
          predicate: (query) => query.queryKey.includes('roots'),
        });
      }
    },
    onError: (error) => {
      console.error('Failed to create comment:', error);
    },
  });
}
