import { useRef, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ReCaptchaModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when CAPTCHA is successfully verified */
  onVerify: (token: string) => void;
  /** Callback when CAPTCHA verification fails or expires */
  onError?: () => void;
}

/**
 * Modal component that displays Google reCAPTCHA challenge
 * Provides secure verification before comment submission
 */
export function ReCaptchaModal({
  isOpen,
  onOpenChange,
  onVerify,
  onError,
}: ReCaptchaModalProps) {
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  // Get reCAPTCHA site key from environment
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  // Reset reCAPTCHA when modal opens
  useEffect(() => {
    if (isOpen && recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  }, [isOpen]);

  // Handle successful CAPTCHA verification
  const handleVerify = (token: string | null) => {
    if (token) {
      onVerify(token);
    }
  };

  // Handle CAPTCHA errors or expiration
  const handleError = () => {
    onError?.();
  };

  // Handle CAPTCHA expiration
  const handleExpired = () => {
    onError?.();
  };

  // Don't render if no site key is configured
  if (!siteKey) {
    console.warn('VITE_RECAPTCHA_SITE_KEY is not configured');
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            Security Verification
          </DialogTitle>
          <DialogDescription>
            Please complete the security check below to post your comment. This
            helps us prevent spam and keep our community safe.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-4">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={siteKey}
            onChange={handleVerify}
            onErrored={handleError}
            onExpired={handleExpired}
            theme="dark" // Match our dark theme
            size="normal"
          />
        </div>

        <p className="text-xs text-muted-foreground text-center">
          This site is protected by reCAPTCHA and the Google{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline"
          >
            Privacy Policy
          </a>{' '}
          and{' '}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline"
          >
            Terms of Service
          </a>{' '}
          apply.
        </p>
      </DialogContent>
    </Dialog>
  );
}
