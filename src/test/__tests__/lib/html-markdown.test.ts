import { describe, it, expect } from 'vitest';
import { htmlToMarkdown, markdownToHtml, cleanWechatHtml, extractImagesFromHtml } from '@/lib/utils/html-markdown';

describe('html-markdown - htmlToMarkdown', () => {
  it('converts simple HTML to markdown', () => {
    const html = '<h1>Title</h1><p>Paragraph</p>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('# Title');
    expect(md).toContain('Paragraph');
  });

  it('converts images to markdown', () => {
    const html = '<img src="http://img.com/1.jpg" alt="desc" />';
    const md = htmlToMarkdown(html);
    expect(md).toContain('![desc](http://img.com/1.jpg)');
  });

  it('converts links to markdown', () => {
    const html = '<a href="http://example.com">link</a>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('[link](http://example.com)');
  });

  it('strips scripts and styles', () => {
    const html = '<script>alert(1)</script><style>.x{}</style><p>Safe</p>';
    const md = htmlToMarkdown(html);
    expect(md).not.toContain('alert');
    expect(md).not.toContain('.x{}');
    expect(md).toContain('Safe');
  });

  it('handles empty input', () => {
    expect(htmlToMarkdown('')).toBe('');
  });

  it('preserves text-align styles', () => {
    const html = '<p style="text-align: center">Centered</p>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('Centered');
  });
});

describe('html-markdown - markdownToHtml', () => {
  it('converts markdown to HTML', () => {
    const md = '# Title\n\nParagraph';
    const html = markdownToHtml(md);
    expect(html).toContain('<h1');
    expect(html).toContain('Title');
    expect(html).toContain('<p>');
  });

  it('handles empty input', () => {
    expect(markdownToHtml('')).toBe('');
  });

  it('handles bold and italic', () => {
    const md = '**bold** and *italic*';
    const html = markdownToHtml(md);
    expect(html).toContain('<strong>');
    expect(html).toContain('<em>');
  });
});

describe('html-markdown - cleanWechatHtml', () => {
  it('removes scripts and event handlers', () => {
    const html = '<p onclick="evil()" onerror="err()">Safe</p>';
    const cleaned = cleanWechatHtml(html);
    expect(cleaned).not.toContain('onclick');
    expect(cleaned).not.toContain('onerror');
    expect(cleaned).toContain('Safe');
  });

  it('handles empty input', () => {
    expect(cleanWechatHtml('')).toBe('');
  });
});

describe('html-markdown - extractImagesFromHtml', () => {
  it('extracts image URLs', () => {
    const html = '<img src="http://a.com/1.jpg" alt="A"><img data-src="http://a.com/2.jpg">';
    const images = extractImagesFromHtml(html);
    expect(images).toHaveLength(2);
    expect(images[0].src).toBe('http://a.com/1.jpg');
    expect(images[1].src).toBe('http://a.com/2.jpg');
  });

  it('skips data URLs', () => {
    const html = '<img src="data:image/png;base64,abc">';
    const images = extractImagesFromHtml(html);
    expect(images).toHaveLength(0);
  });

  it('handles no images', () => {
    const images = extractImagesFromHtml('<p>text</p>');
    expect(images).toHaveLength(0);
  });
});
