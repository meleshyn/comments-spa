import { useState } from 'react';
import {
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  Image,
  ExternalLink,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { useCommentReplies, useAddComment } from '@/lib/queries';
import { CommentSkeleton } from '@/components/CommentSkeleton';
import { CommentForm, type CommentFormData } from '@/components/CommentForm';
import { AttachmentLightbox } from '@/components/AttachmentLightbox';
import { cn } from '@/lib/utils';
import { type Attachment } from '@/lib/api';

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
  /** File attachments */
  attachments?: Attachment[];
  /** Nesting depth for visual indentation (0 = root level) */
  depth?: number;
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
  attachments = [],
  depth = 0,
  className,
}: CommentCardProps) {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [areRepliesVisible, setAreRepliesVisible] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Fetch replies when areRepliesVisible is true
  const {
    data: repliesData,
    isLoading: isLoadingReplies,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommentReplies(id, areRepliesVisible);

  // Optimistic comment mutation for nested replies
  const addCommentMutation = useAddComment();
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
    // Toggle only the reply form visibility
    setIsFormVisible(!isFormVisible);
  };

  const handleToggleReplies = () => {
    //
    if (areRepliesVisible) {
      setIsFormVisible(false);
    }

    // Toggle only the replies visibility
    setAreRepliesVisible(!areRepliesVisible);
  };

  const handleAttachmentClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleReplyFormSubmit = async (data: CommentFormData) => {
    try {
      await addCommentMutation.mutateAsync({
        ...data,
        parentId: id,
      });

      // Close reply form on successful submission
      setIsFormVisible(false);
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Reply submission failed:', error);
    }
  };

  // Get all replies from all pages
  const allReplies = repliesData?.pages.flatMap((page) => page.data) || [];

  // Calculate dynamic indentation based on depth using style prop for reliability
  const indentationStyle = depth > 0 ? { marginLeft: `${depth * 2}rem` } : {};

  return (
    <div className="space-y-3" style={indentationStyle}>
      <Card
        className={cn(
          'transition-all duration-200 hover:shadow-md',
          // MD3 surface styling with depth-based opacity
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
                {/* Username */}
                <span className="font-semibold text-foreground">
                  {userName}
                </span>

                {/* Homepage link */}
                {homePage && (
                  <a
                    href={homePage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title={`Visit ${userName}'s homepage`}
                  >
                    <div className="flex items-center gap-1">
                      <ExternalLink className="size-4" />
                      Page
                    </div>
                  </a>
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
            dangerouslySetInnerHTML={{
              __html: text.replace(
                /<a/g,
                '<a target="_blank" rel="noopener noreferrer nofollow" class="text-primary hover:text-primary/80 underline"'
              ),
            }}
          />

          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {attachments.map((attachment, index) => (
                  <button
                    key={attachment.id}
                    onClick={() => handleAttachmentClick(index)}
                    className="relative group rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {attachment.fileType === 'image' ? (
                      <div className="aspect-video bg-muted">
                        <img
                          src={attachment.fileUrl}
                          alt="Attachment"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                        <div className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded">
                          <Image className="size-3" />
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted flex flex-col items-center justify-center p-3 group-hover:bg-muted/70 transition-colors">
                        <FileText className="size-8 text-primary mb-2" />
                        <span className="text-xs text-center text-foreground font-medium line-clamp-2">
                          Text File
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Click to view {attachments.length} attachment
                {attachments.length > 1 ? 's' : ''}
              </p>
            </div>
          )}
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
                  {areRepliesVisible ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                  {areRepliesVisible ? 'Hide' : 'Show'} {repliesCount} repl
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

      {/* Reply Form Section - Independent of replies visibility */}
      {isFormVisible && (
        <div className="mt-4 pl-4 border-l-2 border-l-primary/30">
          <CommentForm
            isReply
            parentId={id}
            onSubmit={handleReplyFormSubmit}
            isLoading={addCommentMutation.isPending}
          />
        </div>
      )}

      {/* Replies Section - Independent of form visibility */}
      {areRepliesVisible && (
        <div className="mt-4 space-y-4">
          {/* Loading skeleton for initial load */}
          {isLoadingReplies && (
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, index) => (
                <CommentSkeleton key={index} depth={depth + 1} />
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
              attachments: reply.attachments || [],
              depth: depth + 1, // Increment depth for nested replies
            };

            if (reply.homePage) {
              replyProps.homePage = reply.homePage;
            }

            return <CommentCard key={reply.id} {...replyProps} />;
          })}

          {/* Load more replies button */}
          {hasNextPage && (
            <div className="pl-4">
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
                <CommentSkeleton key={`loading-${index}`} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attachment Lightbox */}
      <AttachmentLightbox
        attachments={attachments}
        isOpen={lightboxOpen}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
