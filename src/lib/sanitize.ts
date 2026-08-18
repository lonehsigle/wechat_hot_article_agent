import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  if (!html || typeof window === 'undefined') return '';
  try {
    return DOMPurify.sanitize(html);
  } catch (error) {
    console.error('HTML sanitization failed:', error);
    return '';
  }
}
