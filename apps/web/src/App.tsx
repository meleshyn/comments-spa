import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { CommentCard } from '@/components/CommentCard';
import { CommentForm, type CommentFormData } from '@/components/CommentForm';
import { SortingControls } from '@/components/SortingControls';
import { CommentListSkeleton } from '@/components/CommentSkeleton';
import { Button } from '@/components/ui/button';
import { useRootComments, useAddComment } from '@/lib/queries';
import type { SortBy, SortOrder } from '@/lib/api';

function App() {
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Fetch root comments
  const {
    data: commentsData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRootComments(sortBy, sortOrder);

  // Optimistic comment mutation
  const addCommentMutation = useAddComment();

  const allComments = commentsData?.pages.flatMap((page) => page.data) || [];

  const handleCommentSubmit = async (data: CommentFormData) => {
    try {
      await addCommentMutation.mutateAsync(data);
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Comment submission failed:', error);
    }
  };

  const handleSortChange = (newSortBy: SortBy, newSortOrder: SortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    // Refetch will happen automatically due to query key change
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Main Comment Form */}
        <CommentForm
          onSubmit={handleCommentSubmit}
          isLoading={addCommentMutation.isPending}
        />

        {/* Sorting Controls */}
        <SortingControls
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortByChange={(newSortBy) => handleSortChange(newSortBy, sortOrder)}
          onSortOrderChange={(newSortOrder) =>
            handleSortChange(sortBy, newSortOrder)
          }
        />

        {/* Loading Skeleton for Initial Load */}
        {isLoading && <CommentListSkeleton />}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <p className="text-destructive mb-2">Failed to load comments</p>
            <p className="text-muted-foreground text-sm mb-4">
              Check your network connection.
            </p>
          </div>
        )}

        {/* Comment Cards */}
        {!isLoading && allComments.length > 0 && (
          <div className="space-y-4">
            {allComments.map((comment) => (
              <CommentCard
                key={comment.id}
                {...comment}
                createdAt={new Date(comment.createdAt)}
              />
            ))}

            {/* Load More Button */}
            {hasNextPage && (
              <div className="flex justify-center pt-6">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="gap-2"
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  {isFetchingNextPage ? 'Loading...' : 'Load More Comments'}
                </Button>
              </div>
            )}

            {/* Loading Skeleton for Next Page */}
            {isFetchingNextPage && (
              <div className="pt-4">
                <CommentListSkeleton count={3} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
