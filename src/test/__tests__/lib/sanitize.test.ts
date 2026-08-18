import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '@/lib/sanitize';

describe('sanitize', () => {
  describe('sanitizeHtml', () => {
    it('returns empty string for empty input', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    it('removes script tags', () => {
      const html = '<p>safe</p><script>alert("xss")</script>';
      expect(sanitizeHtml(html)).toBe('<p>safe</p>');
    });

    it('removes style tags', () => {
      const html = '<style>.danger{}</style><div>ok</div>';
      expect(sanitizeHtml(html)).toBe('<div>ok</div>');
    });

    it('removes javascript: protocol', () => {
      const html = '<a href="javascript:alert(1)">click</a>';
      const out = sanitizeHtml(html);
      expect(out).not.toContain('javascript:');
      expect(out).toContain('click');
    });

    it('removes inline event handlers', () => {
      const html = '<img src="a.jpg" onload="evil()" onerror="bad()">';
      const out = sanitizeHtml(html);
      expect(out).toContain('<img');
      expect(out).not.toContain('onload');
      expect(out).not.toContain('onerror');
    });
  });

  it('handles malformed SVG event-handler payloads', () => {
    const output = sanitizeHtml('<svg><g/onload=alert(1)//<p>safe</p>');

    expect(output).not.toContain('onload');
    expect(output).not.toContain('alert');
  });
});
