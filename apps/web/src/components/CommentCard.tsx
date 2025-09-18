import { useState } from 'react';
import { MessageSquare, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { useCommentReplies } from '@/lib/queries';
import { CommentSkeleton } from '@/components/CommentSkeleton';
import { cn } from '@/lib/utils';

export interface CommentCardProps {
  /** Unique identifier for the comment */
  id: string;
  /** Username of the commenter */
  userName: string;
  /** Optional homepage URL */
  homePage?: string;
  /** The comment text content */
  text: string;
  /** When the comment was created */
  createdAt: Date;
  /** Number of replies to this comment */
  repliesCount?: number;
  /** Whether this is a nested reply */
  isReply?: boolean;
  /** Callback when reply button is clicked */
  onReply?: (commentId: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Material Design 3 inspired comment card component
 * Features a clean layout with avatar, user info, content, and actions
 */
export function CommentCard({
  id,
  userName,
  homePage,
  text,
  createdAt,
  repliesCount = 0,
  isReply = false,
  onReply,
  className,
}: CommentCardProps) {
  const [showReplies, setShowReplies] = useState(false);

  // Fetch replies when showReplies is true
  const {
    data: repliesData,
    isLoading: isLoadingReplies,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommentReplies(id, showReplies);
  // Generate initials from username for avatar fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format date in a user-friendly way
  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const handleReplyClick = () => {
    onReply?.(id);
  };

  const handleToggleReplies = () => {
    setShowReplies(!showReplies);
  };

  // Get all replies from all pages
  const allReplies = repliesData?.pages.flatMap((page) => page.data) || [];

  return (
    <>
      <Card
        className={cn(
          'transition-all duration-200 hover:shadow-md',
          // MD3 elevation for replies
          isReply && 'ml-8 mt-3',
          // MD3 surface styling
          'border-border/50 bg-card/80 backdrop-blur-sm',
          className
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <Avatar className="size-10 border-2 border-border/30">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>

            {/* User info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Username - with optional homepage link */}
                {homePage ? (
                  <a
                    href={homePage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    {userName}
                  </a>
                ) : (
                  <span className="font-semibold text-foreground">
                    {userName}
                  </span>
                )}

                {/* Timestamp */}
                <span className="text-muted-foreground text-sm">
                  {formatDate(createdAt)}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Comment text */}
          <div
            className="text-card-foreground leading-relaxed"
            // Support for HTML content from rich text editor
            dangerouslySetInnerHTML={{ __html: text }}
          />
        </CardContent>

        <CardFooter className="pt-3 border-t border-border/30">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {/* Reply button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReplyClick}
                className="text-muted-foreground hover:text-primary gap-1.5 h-8 px-2"
              >
                <MessageSquare className="size-4" />
                Reply
              </Button>

              {/* Show/Hide Replies button */}
              {repliesCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleReplies}
                  className="text-muted-foreground hover:text-primary gap-1.5 h-8 px-2"
                >
                  {showReplies ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                  {showReplies ? 'Hide' : 'Show'} {repliesCount} repl
                  {repliesCount === 1 ? 'y' : 'ies'}
                </Button>
              )}
            </div>

            {/* Placeholder for attachments */}
            <div className="text-xs text-muted-foreground">
              {/* This will be expanded when we implement file attachments */}
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Replies Section */}
      {showReplies && (
        <div className="mt-4 space-y-3">
          {/* Loading skeleton for initial load */}
          {isLoadingReplies && (
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, index) => (
                <CommentSkeleton key={index} isReply />
              ))}
            </div>
          )}

          {/* Render replies */}
          {allReplies.map((reply) => {
            const replyProps: CommentCardProps = {
              id: reply.id,
              userName: reply.userName,
              text: reply.text,
              createdAt: new Date(reply.createdAt),
              repliesCount: reply.repliesCount,
              isReply: true,
            };

            if (reply.homePage) {
              replyProps.homePage = reply.homePage;
            }

            if (onReply) {
              replyProps.onReply = onReply;
            }

            return <CommentCard key={reply.id} {...replyProps} />;
          })}

          {/* Load more replies button */}
          {hasNextPage && (
            <div className="ml-8 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="gap-2"
              >
                {isFetchingNextPage ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
                {isFetchingNextPage ? 'Loading...' : 'Load more replies'}
              </Button>
            </div>
          )}

          {/* Loading skeleton for next page */}
          {isFetchingNextPage && (
            <div className="space-y-3">
              {Array.from({ length: 2 }, (_, index) => (
                <CommentSkeleton key={`loading-${index}`} isReply />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
