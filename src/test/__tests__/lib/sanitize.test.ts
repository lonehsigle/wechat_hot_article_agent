import { describe, it, expect } from 'vitest';
import { safeSanitizeHtml, safeSanitize } from '@/lib/sanitize';

describe('sanitize', () => {
  describe('safeSanitizeHtml', () => {
    it('returns empty string for empty input', () => {
      expect(safeSanitizeHtml('')).toBe('');
    });

    it('removes script tags', () => {
      const html = '<p>safe</p><script>alert("xss")</script>';
      expect(safeSanitizeHtml(html)).toBe('<p>safe</p>');
    });

    it('removes style tags', () => {
      const html = '<style>.danger{}</style><div>ok</div>';
      expect(safeSanitizeHtml(html)).toBe('<div>ok</div>');
    });

    it('removes javascript: protocol', () => {
      const html = '<a href="javascript:alert(1)">click</a>';
      const out = safeSanitizeHtml(html);
      expect(out).not.toContain('javascript:');
      expect(out).toContain('<a href=');
      expect(out).toContain('>click</a>');
    });

    it('removes inline event handlers', () => {
      const html = '<img src="a.jpg" onload="evil()" onerror="bad()">';
      const out = safeSanitizeHtml(html);
      expect(out).toContain('<img');
      expect(out).not.toContain('onload');
      expect(out).not.toContain('onerror');
    });
  });

  describe('safeSanitize', () => {
    it('mirrors safeSanitizeHtml behavior', () => {
      const html = '<script>bad</script><div onclick="x()">text</div>';
      expect(safeSanitize(html)).not.toContain('script');
      expect(safeSanitize(html)).not.toContain('onclick');
    });

    it('returns empty string for falsy values', () => {
      expect(safeSanitize('')).toBe('');
    });
  });
});
