import { MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
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
  replyCount?: number;
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
  replyCount = 0,
  isReply = false,
  onReply,
  className,
}: CommentCardProps) {
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

  return (
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
          {/* Reply button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReplyClick}
            className="text-muted-foreground hover:text-primary gap-1.5 h-8 px-2"
          >
            <MessageSquare className="size-4" />
            Reply
            {replyCount > 0 && (
              <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                {replyCount}
              </span>
            )}
          </Button>

          {/* Placeholder for attachments */}
          <div className="text-xs text-muted-foreground">
            {/* This will be expanded when we implement file attachments */}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
