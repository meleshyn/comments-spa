# useAddComment Hook - Optimistic Updates

## Overview

The `useAddComment` hook provides an instantaneous user experience when submitting comments by implementing **optimistic updates** with TanStack Query.

## How It Works

### 1. Optimistic Update Flow

```
User submits comment → Comment appears instantly → API request sent in background
                                ↓
                        Success: Comment stays (replaced with server data)
                        Error: Comment removed + error notification
```

### 2. Implementation Details

#### onMutate (Before API Call)

- **Cancel ongoing queries** to prevent race conditions
- **Generate temporary comment** with temp ID and current timestamp
- **Add to cache immediately** for instant UI feedback
- **Return previous state** for potential rollback

#### onError (If API Fails)

- **Roll back optimistic updates** using saved previous state
- **Show error notification** with descriptive message
- **Restore UI to previous state** seamlessly

#### onSuccess (If API Succeeds)

- **Show success notification**
- **Invalidate queries** to fetch fresh server data
- **Replace temporary comment** with official server response

## Usage Example

```typescript
import { useAddComment } from '@/lib/queries';

function CommentForm() {
  const addComment = useAddComment();

  const handleSubmit = async (data) => {
    try {
      await addComment.mutateAsync({
        userName: data.userName,
        email: data.email,
        text: data.text,
        captchaToken: data.captchaToken,
        // Optional fields
        homePage: data.homePage,
        parentId: data.parentId, // For replies
      });
    } catch (error) {
      // Error handling is done automatically by the hook
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button
        type="submit"
        disabled={addComment.isPending}
      >
        {addComment.isPending ? 'Posting...' : 'Post Comment'}
      </button>
    </form>
  );
}
```

## Key Features

- ✅ **Instant UI feedback** - Comments appear immediately
- ✅ **Automatic rollback** on errors
- ✅ **Toast notifications** for success/error states
- ✅ **Loading states** for form interaction
- ✅ **Reply count updates** for parent comments
- ✅ **Multi-query support** for different sort orders

## Benefits

1. **Superior UX** - No waiting for server response
2. **Error resilience** - Graceful handling of failures
3. **Data consistency** - Cache stays synchronized
4. **Performance** - Reduces perceived load time
5. **Accessibility** - Clear loading and error states
