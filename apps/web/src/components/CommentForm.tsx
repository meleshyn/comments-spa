import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
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
import { cn } from '@/lib/utils';

interface CommentFormProps {
  /** Callback when form is submitted */
  onSubmit?: (data: CommentFormData) => void;
  /** Whether this is a reply to another comment */
  isReply?: boolean;
  /** Parent comment ID if this is a reply */
  parentId?: string;
  /** Additional CSS classes */
  className?: string;
}

export interface CommentFormData {
  userName: string;
  email: string;
  homePage?: string;
  text: string;
  parentId?: string;
}

/**
 * Material Design 3 comment form with Tiptap rich text editor
 * Provides all required fields and formatting options
 */
export function CommentForm({
  onSubmit,
  isReply = false,
  parentId,
  className,
}: CommentFormProps) {
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [homePage, setHomePage] = useState('');

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
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary hover:text-primary/80 underline',
        },
      }),
    ],
    content: '',
    editorProps: {
      handleKeyDown: (view, event) => {
        // Keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
          switch (event.key) {
            case 'k':
              event.preventDefault();
              // Trigger link dialog
              {
                const toolbar = document.querySelector(
                  '[title="Add Link (Ctrl+K)"]'
                ) as HTMLButtonElement;
                toolbar?.click();
                return true;
              }
            case 'Enter':
              // Submit form on Ctrl+Enter
              if (userName.trim() && email.trim() && editor?.getText().trim()) {
                event.preventDefault();
                const form = view.dom.closest('form');
                form?.requestSubmit();
                return true;
              }
              break;
          }
        }
        return false;
      },
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

    const formData: CommentFormData = {
      userName: userName.trim(),
      email: email.trim(),
      text,
    };

    // Only add optional fields if they have values
    if (homePage.trim()) {
      formData.homePage = homePage.trim();
    }

    if (parentId) {
      formData.parentId = parentId;
    }

    onSubmit?.(formData);

    // Reset form
    setUserName('');
    setEmail('');
    setHomePage('');
    editor.commands.clearContent();
  };

  const handleFileAttach = () => {
    // TODO: Implement file attachment functionality
    console.log('File attachment clicked');
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
                editor={editor}
                className="min-h-[120px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:p-3"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              You can use <strong>bold</strong>, <em>italic</em>,{' '}
              <code>code</code>, and links in your comment. Press{' '}
              <kbd className="px-1 py-0.5 bg-muted text-muted-foreground rounded text-xs">
                Ctrl+Enter
              </kbd>{' '}
              to submit.
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
                !userName.trim() || !email.trim() || !editor?.getText().trim()
              }
            >
              <Send className="size-4" />
              {isReply ? 'Reply' : 'Post Comment'}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
