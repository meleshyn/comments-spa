import { useState, useEffect } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { X, FileText } from 'lucide-react';
import { type Attachment } from '@/lib/api';

interface AttachmentLightboxProps {
  attachments: Attachment[];
  isOpen: boolean;
  currentIndex: number;
  onClose: () => void;
}

interface TextFileContent {
  [url: string]: string | null;
}

export function AttachmentLightbox({
  attachments,
  isOpen,
  currentIndex,
  onClose,
}: AttachmentLightboxProps) {
  const [textContents, setTextContents] = useState<TextFileContent>({});
  const [loadingText, setLoadingText] = useState<string | null>(null);

  // Fetch text file content
  const fetchTextContent = async (url: string): Promise<string> => {
    if (textContents[url] !== undefined) {
      return textContents[url] || '';
    }

    setLoadingText(url);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      const content = await response.text();
      setTextContents((prev) => ({ ...prev, [url]: content }));
      return content;
    } catch (error) {
      console.error('Failed to fetch text file:', error);
      const errorMsg = 'Failed to load file content';
      setTextContents((prev) => ({ ...prev, [url]: errorMsg }));
      return errorMsg;
    } finally {
      setLoadingText(null);
    }
  };

  // Convert attachments to lightbox slides
  const slides = attachments.map((attachment) => {
    if (attachment.fileType === 'image') {
      return {
        src: attachment.fileUrl,
        alt: `Attachment ${attachment.id}`,
      };
    } else {
      // For text files, we'll use a placeholder image and handle rendering in the custom render
      return {
        src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5URVhUPC90ZXh0Pjwvc3ZnPg==',
        alt: `Text file ${attachment.id}`,
        attachment,
      };
    }
  });

  // Custom render function for text files
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderSlide = ({ slide }: { slide: any }) => {
    if (slide.attachment) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-background">
          <div className="max-w-4xl w-full h-full p-8 overflow-hidden">
            <div className="bg-card border border-border rounded-lg h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <FileText className="size-5 text-primary" />
                <h3 className="font-semibold text-foreground">
                  Text File Content
                </h3>
                <button
                  onClick={onClose}
                  className="ml-auto p-1 hover:bg-muted rounded"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 p-4 overflow-auto">
                {loadingText === slide.attachment.fileUrl ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                  </div>
                ) : (
                  <TextFileViewer
                    url={slide.attachment.fileUrl}
                    onFetchContent={fetchTextContent}
                    cachedContent={textContents[slide.attachment.fileUrl]}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default image rendering
    return null;
  };

  return (
    <Lightbox
      open={isOpen}
      close={onClose}
      index={currentIndex}
      slides={slides}
      render={{
        slide: renderSlide,
      }}
      controller={{
        closeOnBackdropClick: true,
        closeOnPullUp: true,
        closeOnPullDown: true,
      }}
      styles={{
        container: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
        },
      }}
    />
  );
}

interface TextFileViewerProps {
  url: string;
  onFetchContent: (url: string) => Promise<string>;
  cachedContent: string | null | undefined;
}

function TextFileViewer({
  url,
  onFetchContent,
  cachedContent,
}: TextFileViewerProps) {
  const [content, setContent] = useState<string | null>(cachedContent || null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-load content when component mounts or URL changes
  useEffect(() => {
    // If we have cached content, use it
    if (cachedContent !== undefined) {
      setContent(cachedContent);
      return;
    }

    // If content is already loaded or loading, don't fetch again
    if (content !== null || isLoading) {
      return;
    }

    const loadContentEffect = async () => {
      setIsLoading(true);
      try {
        const textContent = await onFetchContent(url);
        setContent(textContent);
      } finally {
        setIsLoading(false);
      }
    };

    loadContentEffect();
  }, [url, onFetchContent, cachedContent, content, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <pre className="whitespace-pre-wrap text-sm text-foreground font-mono bg-muted/30 p-4 rounded border max-h-96 overflow-auto">
      {content || 'Failed to load content'}
    </pre>
  );
}
