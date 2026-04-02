import TurndownService from 'turndown';
import { marked } from 'marked';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
  strongDelimiter: '**',
});

turndownService.addRule('wechatImage', {
  filter: 'img',
  replacement: (content, node) => {
    const img = node as Element;
    const src = img.getAttribute('data-src') || img.getAttribute('src') || '';
    const alt = img.getAttribute('alt') || '图片';
    if (!src) return '';
    return `![${alt}](${src})`;
  },
});

turndownService.addRule('wechatLink', {
  filter: 'a',
  replacement: (content, node) => {
    const link = node as Element;
    const href = link.getAttribute('href') || '';
    if (!href || href.startsWith('javascript:')) return content;
    return `[${content}](${href})`;
  },
});

turndownService.addRule('removeScript', {
  filter: 'script',
  replacement: () => '',
});

turndownService.addRule('removeStyle', {
  filter: 'style',
  replacement: () => '',
});

turndownService.addRule('wechatSection', {
  filter: 'section',
  replacement: (content) => `\n${content}\n`,
});

turndownService.addRule('wechatBlockquote', {
  filter: 'blockquote',
  replacement: (content) => {
    const lines = content.trim().split('\n');
    return lines.map((line: string) => `> ${line}`).join('\n');
  },
});

export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  
  let cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/data-tools="[^"]*"/g, '')
    .replace(/class="[^"]*"/g, '')
    .replace(/style="[^"]*"/g, (match) => {
      if (match.includes('text-align')) return match;
      return '';
    });
  
  cleanHtml = cleanHtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '</p>\n')
    .replace(/<\/div>/gi, '</div>\n')
    .replace(/<\/section>/gi, '</section>\n');
  
  try {
    let markdown = turndownService.turndown(cleanHtml);
    
    markdown = markdown
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s+|\s+$/g, '')
      .replace(/!\[\]\([^)]+\)/g, (match) => {
        const urlMatch = match.match(/\(([^)]+)\)/);
        if (urlMatch) {
          return `![图片](${urlMatch[1]})`;
        }
        return match;
      });
    
    return markdown;
  } catch (error) {
    console.error('HTML to Markdown conversion error:', error);
    return html.replace(/<[^>]*>/g, '').trim();
  }
}

export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  try {
    const html = marked.parse(markdown, {
      gfm: true,
      breaks: true,
    }) as string;
    
    return html;
  } catch (error) {
    console.error('Markdown to HTML conversion error:', error);
    return markdown;
  }
}

export function cleanWechatHtml(html: string): string {
  if (!html) return '';
  
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/data-tools="[^"]*"/g, '')
    .replace(/onclick="[^"]*"/g, '')
    .replace(/onerror="[^"]*"/g, '')
    .replace(/onload="[^"]*"/g, '');
}

export function extractImagesFromHtml(html: string): Array<{ src: string; alt: string }> {
  const images: Array<{ src: string; alt: string }> = [];
  const imgRegex = /<img[^>]+>/gi;
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    const srcMatch = match[0].match(/(?:data-src|src)="([^"]+)"/);
    const altMatch = match[0].match(/alt="([^"]*)"/);
    
    if (srcMatch && srcMatch[1] && !srcMatch[1].startsWith('data:')) {
      images.push({
        src: srcMatch[1],
        alt: altMatch ? altMatch[1] : '',
      });
    }
  }
  
  return images;
}
