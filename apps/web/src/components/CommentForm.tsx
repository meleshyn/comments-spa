import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { EditorToolbar } from '@/components/EditorToolbar';
import { ReCaptchaModal } from '@/components/ReCaptchaModal';
import { cn } from '@/lib/utils';

interface CommentFormProps {
  /** Callback when form is submitted */
  onSubmit?: (data: CommentFormData) => void;
  /** Whether this is a reply to another comment */
  isReply?: boolean;
  /** Parent comment ID if this is a reply */
  parentId?: string;
  /** Whether the form is currently submitting */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export interface CommentFormData {
  userName: string;
  email: string;
  homePage?: string;
  text: string;
  parentId?: string;
  captchaToken: string;
}

/**
 * Material Design 3 comment form with Tiptap rich text editor
 * Provides all required fields and formatting options
 */
export function CommentForm({
  onSubmit,
  isReply = false,
  parentId,
  isLoading = false,
  className,
}: CommentFormProps) {
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [homePage, setHomePage] = useState('');

  // CAPTCHA modal state
  const [isCaptchaModalOpen, setIsCaptchaModalOpen] = useState(false);
  const [pendingData, setPendingData] = useState<Omit<
    CommentFormData,
    'captchaToken'
  > | null>(null);

  // Initialize Tiptap editor with minimal configuration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable extensions we don't need for security and simplicity
        heading: false,
        horizontalRule: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        codeBlock: false,
        hardBreak: false,
        strike: false,
        // Keep only: bold, italic, code (inline), and basic text formatting
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: cn(
          // MD3 text field styling
          'prose prose-sm max-w-none',
          'min-h-[120px] p-3 rounded-lg',
          'bg-input border border-border',
          'focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20',
          'text-foreground placeholder:text-muted-foreground',
          'outline-none transition-all duration-200'
        ),
        'data-placeholder': 'Write your comment here...',
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editor) return;

    const text = editor.getHTML();

    // Basic validation
    if (!userName.trim() || !email.trim() || !text.trim()) {
      return;
    }

    // Prepare form data (without captcha token)
    const formData: Omit<CommentFormData, 'captchaToken'> = {
      userName: userName.trim(),
      email: email.trim(),
      text: text.trim(),
    };

    // Only add optional fields if they have values
    if (homePage.trim()) {
      formData.homePage = homePage.trim();
    }

    if (parentId) {
      formData.parentId = parentId;
    }

    // Store pending data and open CAPTCHA modal
    setPendingData(formData);
    setIsCaptchaModalOpen(true);
  };

  const handleFileAttach = () => {
    // TODO: Implement file attachment functionality
    console.log('File attachment clicked');
  };

  // Handle successful CAPTCHA verification
  const handleCaptchaVerify = (captchaToken: string) => {
    if (!pendingData) return;

    // Combine pending data with CAPTCHA token
    const completeFormData: CommentFormData = {
      ...pendingData,
      captchaToken,
    };

    // Submit the form data
    onSubmit?.(completeFormData);

    // Close modal and reset state
    setIsCaptchaModalOpen(false);
    setPendingData(null);

    // Reset form fields
    setUserName('');
    setEmail('');
    setHomePage('');
    editor?.commands.clearContent();
  };

  // Handle CAPTCHA errors or modal close
  const handleCaptchaError = () => {
    // Just close the modal, keep the form data intact
    setIsCaptchaModalOpen(false);
    setPendingData(null);
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <h3 className="text-lg font-semibold text-foreground">
          {isReply ? 'Reply to Comment' : 'Add Comment'}
        </h3>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* User Information Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="userName"
                className="text-sm font-medium text-foreground"
              >
                Username *
              </label>
              <Input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your username"
                required
                disabled={isLoading}
                className="bg-input border-border focus:border-ring"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email *
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={isLoading}
                className="bg-input border-border focus:border-ring"
              />
            </div>
          </div>

          {/* Optional Homepage Field */}
          <div className="space-y-2">
            <label
              htmlFor="homePage"
              className="text-sm font-medium text-foreground"
            >
              Homepage (optional)
            </label>
            <Input
              id="homePage"
              type="url"
              value={homePage}
              onChange={(e) => setHomePage(e.target.value)}
              placeholder="https://your-website.com"
              disabled={isLoading}
              className="bg-input border-border focus:border-ring"
            />
          </div>

          {/* Rich Text Editor */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Comment *
            </label>
            <div className="border border-border rounded-lg overflow-hidden bg-input">
              <EditorToolbar editor={editor} onFileAttach={handleFileAttach} />
              <EditorContent
                onChange={() => {
                  if (editor) {
                    editor.commands.setContent(editor.getHTML());
                  }
                }}
                editor={editor}
                className="min-h-[120px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:p-3"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              You can use <strong>bold</strong>, <em>italic</em>,{' '}
              <code>code</code>, and links in your comment.
            </p>
          </div>
        </CardContent>

        <CardFooter className="pt-4 border-t border-border/30">
          <div className="flex justify-between items-center w-full">
            <p className="text-xs text-muted-foreground">* Required fields</p>
            <Button
              type="submit"
              className="gap-2"
              disabled={
                isLoading ||
                !userName.trim() ||
                !email.trim() ||
                !editor?.getText().trim()
              }
            >
              {isLoading ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  {isReply ? 'Reply' : 'Post Comment'}
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </form>

      {/* reCAPTCHA Modal */}
      <ReCaptchaModal
        isOpen={isCaptchaModalOpen}
        onOpenChange={setIsCaptchaModalOpen}
        onVerify={handleCaptchaVerify}
        onError={handleCaptchaError}
      />
    </Card>
  );
}
