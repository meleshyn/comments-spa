import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  apiClient,
  type SortBy,
  type SortOrder,
  type Comment,
  type CommentsResponse,
  type Attachment,
} from './api';
import type { CreateCommentDto } from '@acme/schemas';

/**
 * API Error Response Types
 */
interface ValidationError {
  validation: string;
  code: string;
  message: string;
  path: string[];
}

interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errors?: ValidationError[];
}

/**
 * Formats API validation errors into a user-friendly message
 */
function formatValidationErrors(errors: ValidationError[]): string {
  if (!errors || errors.length === 0) {
    return 'Validation failed. Please check your input and try again.';
  }

  // Group errors by field for better readability
  const errorsByField = errors.reduce(
    (acc, error) => {
      const fieldName: string =
        error.path && error.path.length > 0 ? error.path[0]! : 'unknown';
      if (!acc[fieldName]) {
        acc[fieldName] = [];
      }
      acc[fieldName]!.push(error.message);
      return acc;
    },
    {} as Record<string, string[]>
  );

  // Convert field names to user-friendly labels
  const fieldLabels: Record<string, string> = {
    userName: 'Username',
    email: 'Email',
    homePage: 'Homepage',
    text: 'Comment',
    captchaToken: 'CAPTCHA',
  };

  // Format errors into a readable list
  const formattedErrors = Object.entries(errorsByField).map(
    ([field, messages]) => {
      const label = fieldLabels[field] || field;
      return `${label}: ${messages.join(', ')}`;
    }
  );

  return formattedErrors.join('\n');
}

/**
 * Extracts and formats error message from an API error
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    try {
      // Try to parse the error message as JSON (in case it contains the API error response)
      const errorData = JSON.parse(error.message) as ApiErrorResponse;
      if (errorData.errors && errorData.errors.length > 0) {
        return formatValidationErrors(errorData.errors);
      }
      return errorData.message || error.message;
    } catch {
      // If parsing fails, check if the error message looks like a structured response
      if (
        error.message.includes('statusCode') ||
        error.message.includes('errors')
      ) {
        return 'Validation failed. Please check your input and try again.';
      }
      return error.message;
    }
  }

  return 'Failed to post comment. Please try again.';
}

/**
 * Recursively finds and updates a comment's repliesCount in a nested comment structure
 */
function updateCommentRepliesCount(
  comments: Comment[],
  targetId: string,
  increment: number = 1
): Comment[] {
  return comments.map((comment) => {
    if (comment.id === targetId) {
      // Found the target comment, update its repliesCount
      return {
        ...comment,
        repliesCount: Math.max(0, comment.repliesCount + increment),
      };
    }
    // Not the target comment, return as-is (no nested search needed since we're using separate queries for replies)
    return comment;
  });
}

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
 * Hook to add a new comment with optimistic updates for instant UI feedback
 *
 * This hook provides an optimistic update strategy:
 * 1. Instantly adds the comment to the UI (optimistic update)
 * 2. Sends the request to the server in the background
 * 3. On success: invalidates queries to get the official server data
 * 4. On error: rolls back the optimistic update and shows error message
 */
export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      data: Omit<CreateCommentDto, 'captchaToken'> & {
        captchaToken: string;
        files?: File[];
      }
    ) =>
      apiClient.createComment({
        userName: data.userName,
        email: data.email,
        text: data.text,
        captchaToken: data.captchaToken,
        ...(data.homePage && { homePage: data.homePage }),
        ...(data.parentId && { parentId: data.parentId }),
        ...(data.files && { files: data.files }),
      }),

    onMutate: async (newComment) => {
      // Generate temporary ID for optimistic update
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create optimistic attachments for instant preview
      const optimisticAttachments: Attachment[] = newComment.files
        ? newComment.files.map((file, index) => ({
            id: `temp-attachment-${tempId}-${index}`,
            commentId: tempId,
            fileUrl: file.type.startsWith('image/')
              ? URL.createObjectURL(file)
              : `temp-file://${file.name}`, // Placeholder for text files
            fileType: file.type.startsWith('image/')
              ? ('image' as const)
              : ('text' as const),
          }))
        : [];

      // Create optimistic comment object
      const optimisticComment: Comment = {
        id: tempId,
        userName: newComment.userName,
        email: newComment.email,
        text: newComment.text,
        createdAt: new Date().toISOString(),
        repliesCount: 0,
        attachments: optimisticAttachments,
        ...(newComment.homePage && { homePage: newComment.homePage }),
        ...(newComment.parentId && { parentId: newComment.parentId }),
      };

      if (newComment.parentId) {
        // Handle reply optimistic update
        const repliesQueryKey = commentKeys.replies(newComment.parentId);

        // Cancel any outgoing refetches for replies
        await queryClient.cancelQueries({ queryKey: repliesQueryKey });

        // Snapshot the previous value
        const previousReplies =
          queryClient.getQueryData<InfiniteData<CommentsResponse>>(
            repliesQueryKey
          );

        // Optimistically update the replies cache
        queryClient.setQueryData<InfiniteData<CommentsResponse>>(
          repliesQueryKey,
          (old) => {
            if (!old) {
              return {
                pages: [{ data: [optimisticComment] }],
                pageParams: [undefined],
              };
            }

            // Add the new comment to the first page
            return {
              ...old,
              pages: old.pages.map((page, index) =>
                index === 0
                  ? { ...page, data: [optimisticComment, ...page.data] }
                  : page
              ),
            };
          }
        );

        // Also update the parent comment's reply count in root comments
        const allRootQueryKeys = queryClient.getQueriesData({
          queryKey: commentKeys.all,
          predicate: (query) => query.queryKey.includes('roots'),
        });

        allRootQueryKeys.forEach(([queryKey, data]) => {
          if (data && typeof data === 'object' && 'pages' in data) {
            const infiniteData = data as InfiniteData<CommentsResponse>;
            queryClient.setQueryData(queryKey, {
              ...infiniteData,
              pages: infiniteData.pages.map((page) => ({
                ...page,
                data: updateCommentRepliesCount(
                  page.data,
                  newComment.parentId!,
                  1
                ),
              })),
            });
          }
        });

        return {
          previousReplies,
          isReply: true,
          parentId: newComment.parentId,
        };
      } else {
        // Handle root comment optimistic update
        const allRootQueryKeys = queryClient.getQueriesData({
          queryKey: commentKeys.all,
          predicate: (query) => query.queryKey.includes('roots'),
        });

        // Cancel any outgoing refetches for root comments
        await Promise.all(
          allRootQueryKeys.map(([queryKey]) =>
            queryClient.cancelQueries({ queryKey })
          )
        );

        // Snapshot previous values for all root queries
        const previousQueries = new Map();
        allRootQueryKeys.forEach(([queryKey, data]) => {
          previousQueries.set(queryKey, data);
        });

        // Optimistically update all root comment queries
        allRootQueryKeys.forEach(([queryKey, data]) => {
          if (data && typeof data === 'object' && 'pages' in data) {
            const infiniteData = data as InfiniteData<CommentsResponse>;
            queryClient.setQueryData(queryKey, {
              ...infiniteData,
              pages: infiniteData.pages.map((page, index) =>
                index === 0
                  ? { ...page, data: [optimisticComment, ...page.data] }
                  : page
              ),
            });
          }
        });

        return { previousQueries, isReply: false };
      }
    },

    onError: (error, _newComment, context) => {
      // Roll back optimistic updates on error
      if (context?.isReply && context.parentId) {
        // Restore previous replies data
        const repliesQueryKey = commentKeys.replies(context.parentId);
        queryClient.setQueryData(repliesQueryKey, context.previousReplies);

        // Restore parent comment's reply count
        const allRootQueryKeys = queryClient.getQueriesData({
          queryKey: commentKeys.all,
          predicate: (query) => query.queryKey.includes('roots'),
        });

        allRootQueryKeys.forEach(([queryKey, data]) => {
          if (data && typeof data === 'object' && 'pages' in data) {
            const infiniteData = data as InfiniteData<CommentsResponse>;
            queryClient.setQueryData(queryKey, {
              ...infiniteData,
              pages: infiniteData.pages.map((page) => ({
                ...page,
                data: updateCommentRepliesCount(
                  page.data,
                  context.parentId!,
                  -1
                ),
              })),
            });
          }
        });
      } else if (context?.previousQueries) {
        // Restore all previous root comment queries
        context.previousQueries.forEach((data, queryKey) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Show error notification with detailed validation errors
      const errorMessage = getErrorMessage(error);

      toast.error('Comment Failed', {
        description: errorMessage,
        duration: 5000,
      });
    },

    onSuccess: (serverComment, _variables, context) => {
      // Show success notification
      toast.success('Comment Posted!', {
        description: context?.isReply
          ? 'Your reply has been added.'
          : 'Your comment has been posted.',
        duration: 3000,
      });

      if (serverComment.parentId) {
        // For replies, we need to update the parent comment's repliesCount in all relevant caches

        // 1. Invalidate the parent's replies to get fresh data
        queryClient.invalidateQueries({
          queryKey: commentKeys.replies(serverComment.parentId),
        });

        // 2. Update parent comment's repliesCount in all cached queries
        const allCachedQueries = queryClient.getQueriesData({
          queryKey: commentKeys.all,
        });

        allCachedQueries.forEach(([queryKey, data]) => {
          if (data && typeof data === 'object' && 'pages' in data) {
            const infiniteData = data as InfiniteData<CommentsResponse>;

            // Update the parent comment's repliesCount in this query
            const updatedData = {
              ...infiniteData,
              pages: infiniteData.pages.map((page) => ({
                ...page,
                data: updateCommentRepliesCount(
                  page.data,
                  serverComment.parentId!,
                  1
                ),
              })),
            };

            // Only update if we actually found and modified the parent comment
            const hasChanges =
              JSON.stringify(updatedData) !== JSON.stringify(infiniteData);
            if (hasChanges) {
              queryClient.setQueryData(queryKey, updatedData);
            }
          }
        });

        // 3. Also invalidate root comments to ensure consistency
        queryClient.invalidateQueries({
          queryKey: commentKeys.all,
          predicate: (query) => query.queryKey.includes('roots'),
        });
      } else {
        // For root comments, invalidate all root comment queries
        queryClient.invalidateQueries({
          queryKey: commentKeys.all,
          predicate: (query) => query.queryKey.includes('roots'),
        });
      }
    },
  });
}
