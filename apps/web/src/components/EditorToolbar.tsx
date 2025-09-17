import { Bold, Code, FileUp, Italic, Link } from 'lucide-react';
import type { Editor } from '@tiptap/react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EditorToolbarProps {
  /** The Tiptap editor instance */
  editor: Editor | null;
  /** Additional CSS classes */
  className?: string;
  /** Callback when file attachment is requested */
  onFileAttach?: () => void;
}

/**
 * Material Design 3 toolbar for the Tiptap editor
 * Provides formatting buttons with proper MD3 styling
 */
export function EditorToolbar({
  editor,
  className,
  onFileAttach,
}: EditorToolbarProps) {
  if (!editor) {
    return null;
  }

  const handleLinkToggle = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1 p-2 border-b border-border/30 bg-muted/30',
        className
      )}
    >
      {/* Bold Button */}
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          'size-8 hover:bg-accent/50',
          editor.isActive('bold') && 'bg-primary/10 text-primary'
        )}
        title="Bold (Ctrl+B)"
      >
        <Bold className="size-4" />
      </Button>

      {/* Italic Button */}
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          'size-8 hover:bg-accent/50',
          editor.isActive('italic') && 'bg-primary/10 text-primary'
        )}
        title="Italic (Ctrl+I)"
      >
        <Italic className="size-4" />
      </Button>

      {/* Code Button */}
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={cn(
          'size-8 hover:bg-accent/50',
          editor.isActive('code') && 'bg-primary/10 text-primary'
        )}
        title="Inline Code (Ctrl+`)"
      >
        <Code className="size-4" />
      </Button>

      {/* Link Button */}
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={handleLinkToggle}
        className={cn(
          'size-8 hover:bg-accent/50',
          editor.isActive('link') && 'bg-primary/10 text-primary'
        )}
        title="Add Link (Ctrl+K)"
      >
        <Link className="size-4" />
      </Button>

      {/* Divider */}
      <div className="w-px h-6 bg-border/50 mx-1" />

      {/* File Attachment Button */}
      <Button
        variant="ghost"
        size="icon"
        type="button"
        onClick={onFileAttach}
        className="size-8 hover:bg-accent/50"
        title="Attach File"
      >
        <FileUp className="size-4" />
      </Button>
    </div>
  );
}
