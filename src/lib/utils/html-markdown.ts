import TurndownService from 'turndown';
import { marked } from 'marked';
import { load } from 'cheerio/slim';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
  strongDelimiter: '**',
});

turndownService.addRule('wechatImage', {
  filter: 'img',
  replacement: (_content, node) => {
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
  
  let cleanHtml = cleanWechatHtml(html)
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
    
    return cleanWechatHtml(html);
  } catch (error) {
    console.error('Markdown to HTML conversion error:', error);
    return markdown;
  }
}

export function cleanWechatHtml(html: string): string {
  if (!html) return '';

  const $ = load(html, null, false);
  $('script, style, iframe, object, embed, form, input, button, textarea, select, option, link, meta, base').remove();
  const safeDataImage = /^data:image\/(?:png|jpe?g|gif|webp|avif);base64,/i;
  const urlAttributes: Record<string, true> = {
    href: true,
    src: true,
    'data-src': true,
    'xlink:href': true,
    action: true,
    formaction: true,
    poster: true,
  };

  $('*').each((_index, element) => {
    for (const [name, value] of Object.entries($(element).attr() || {})) {
      const normalizedName = name.toLowerCase();
      if (normalizedName.startsWith('on') || normalizedName === 'srcdoc') {
        $(element).removeAttr(name);
        continue;
      }
      if (!urlAttributes[normalizedName]) continue;

      const normalizedValue = value.replace(/[\u0000-\u0020]+/g, '').toLowerCase();
      const unsafeProtocol = normalizedValue.startsWith('javascript:') || normalizedValue.startsWith('vbscript:');
      const unsafeData = normalizedValue.startsWith('data:') &&
        !((normalizedName === 'src' || normalizedName === 'data-src') && safeDataImage.test(value));
      if (unsafeProtocol || unsafeData) $(element).removeAttr(name);
    }
  });

  return $.html();
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
