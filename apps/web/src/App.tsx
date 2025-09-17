import { useState } from 'react';
import { CommentCard } from '@/components/CommentCard';
import { CommentForm, type CommentFormData } from '@/components/CommentForm';

function App() {
  const [showReplyForm, setShowReplyForm] = useState<string | null>(null);

  // Sample data to demonstrate the CommentCard
  const sampleComments = [
    {
      id: '1',
      userName: 'AliceSmith',
      homePage: 'https://alice.dev',
      text: 'This is a really interesting discussion! I love how the <strong>Material Design 3</strong> theme looks with the dark mode. The card design is clean and modern.',
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      replyCount: 2,
    },
    {
      id: '2',
      userName: 'BobDev',
      text: 'Great point Alice! The <code>CommentCard</code> component is very reusable. I particularly like the <i>subtle</i> elevation and the way avatars display initials.',
      createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      isReply: true,
    },
    {
      id: '3',
      userName: 'Charlie',
      text: 'The color palette really captures that MD3 aesthetic. Looking forward to seeing more components!',
      createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    },
  ];

  const handleReply = (commentId: string) => {
    setShowReplyForm(showReplyForm === commentId ? null : commentId);
  };

  const handleCommentSubmit = (data: CommentFormData) => {
    console.log('Comment submitted:', data);
    // This will be connected to the backend API later
    setShowReplyForm(null);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Comments SPA
          </h1>
          <p className="text-muted-foreground">Material Design 3 Theme Demo</p>
        </div>

        {/* Main Comment Form */}
        <CommentForm onSubmit={handleCommentSubmit} />

        {/* Comment Cards */}
        <div className="space-y-4">
          {sampleComments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              <CommentCard {...comment} onReply={handleReply} />

              {/* Reply Form */}
              {showReplyForm === comment.id && (
                <div className="ml-8">
                  <CommentForm
                    isReply
                    parentId={comment.id}
                    onSubmit={handleCommentSubmit}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
