import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CommentSkeletonProps {
  /** Whether this is a nested reply skeleton */
  isReply?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Material Design 3 skeleton placeholder for loading comments
 * Mimics the layout of the CommentCard component
 */
export function CommentSkeleton({
  isReply = false,
  className,
}: CommentSkeletonProps) {
  return (
    <Card
      className={cn(
        'animate-pulse',
        // MD3 elevation for replies
        isReply && 'ml-8 mt-3',
        // MD3 surface styling
        'border-border/50 bg-card/80 backdrop-blur-sm',
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Avatar Skeleton */}
          <Skeleton className="size-10 rounded-full border-2 border-border/30" />

          {/* User info skeleton */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              {/* Username skeleton */}
              <Skeleton className="h-4 w-20" />
              {/* Timestamp skeleton */}
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Comment text skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-border/30">
        <div className="flex items-center justify-between w-full">
          {/* Reply button skeleton */}
          <Skeleton className="h-8 w-16" />

          {/* Placeholder for attachments */}
          <div className="flex gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

/**
 * Multiple comment skeletons for initial loading
 */
export function CommentListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, index) => (
        <CommentSkeleton key={index} />
      ))}
    </div>
  );
}
