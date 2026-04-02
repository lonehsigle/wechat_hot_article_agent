import { db } from '../db';
import { wechatAccounts } from '../db/schema';
import { eq } from 'drizzle-orm';

interface WechatTokenCache {
  accessToken: string;
  expiresAt: number;
}

const tokenCache: Map<number, WechatTokenCache> = new Map();

interface WechatAccountConfig {
  id: number;
  name: string;
  appId: string;
  appSecret: string;
  authorName: string;
}

export async function getWechatAccount(accountId: number): Promise<WechatAccountConfig | null> {
  const database = db();
  const accounts = await database.select().from(wechatAccounts).where(eq(wechatAccounts.id, accountId));
  if (accounts.length === 0) return null;
  
  const account = accounts[0];
  return {
    id: account.id,
    name: account.name,
    appId: account.appId || '',
    appSecret: account.appSecret || '',
    authorName: account.authorName || '',
  };
}

export async function getAccessToken(accountId: number): Promise<string> {
  const cached = tokenCache.get(accountId);
  if (cached && cached.expiresAt > Date.now() + 60000) {
    return cached.accessToken;
  }

  const account = await getWechatAccount(accountId);
  if (!account || !account.appId || !account.appSecret) {
    throw new Error('公众号账号未配置或配置不完整');
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${account.appId}&secret=${account.appSecret}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.errcode) {
    throw new Error(`获取access_token失败: ${data.errmsg} (${data.errcode})`);
  }

  const accessToken = data.access_token;
  const expiresIn = data.expires_in || 7200;
  
  tokenCache.set(accountId, {
    accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
  });

  return accessToken;
}

export interface UploadImageResult {
  mediaId: string;
  url?: string;
}

export async function uploadImage(
  accountId: number,
  imageData: Buffer,
  filename: string,
  type: 'thumb' | 'image' = 'image'
): Promise<UploadImageResult> {
  const accessToken = await getAccessToken(accountId);
  
  const formData = new FormData();
  const uint8Array = new Uint8Array(imageData);
  const blob = new Blob([uint8Array], { type: 'image/jpeg' });
  formData.append('media', blob, filename);

  let url: string;
  
  if (type === 'thumb') {
    url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=thumb`;
  } else {
    url = `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${accessToken}`;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  
  const data = await response.json();
  
  if (data.errcode) {
    throw new Error(`上传图片失败: ${data.errmsg} (${data.errcode})`);
  }

  return {
    mediaId: data.media_id,
    url: data.url,
  };
}

export async function uploadImageFromUrl(
  accountId: number,
  imageUrl: string,
  type: 'thumb' | 'image' = 'image'
): Promise<UploadImageResult> {
  let buffer: Buffer;
  let filename: string;
  
  if (imageUrl.startsWith('data:')) {
    const matches = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      throw new Error('无效的 base64 图片格式');
    }
    const ext = matches[1] === 'png' ? 'png' : 'jpg';
    buffer = Buffer.from(matches[2], 'base64');
    filename = `image.${ext}`;
  } else {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`下载图片失败: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
    
    const urlObj = new URL(imageUrl);
    filename = urlObj.pathname.split('/').pop() || 'image.jpg';
  }
  
  return uploadImage(accountId, buffer, filename, type);
}

export interface ArticleMedia {
  thumbMediaId: string;
  author: string;
  title: string;
  content: string;
  digest: string;
  contentSourceUrl?: string;
  needOpenComment?: number;
  onlyFansCanComment?: number;
}

export interface DraftResult {
  mediaId: string;
}

export async function createDraft(
  accountId: number,
  articles: ArticleMedia[]
): Promise<DraftResult> {
  const accessToken = await getAccessToken(accountId);
  
  const articlesData = articles.map(article => {
    let digest = article.digest || '';
    if (digest.length > 120) {
      digest = digest.substring(0, 117) + '...';
    }
    
    return {
      thumb_media_id: article.thumbMediaId,
      author: article.author || '',
      title: article.title,
      content: article.content,
      digest: digest,
      content_source_url: article.contentSourceUrl || '',
      need_open_comment: article.needOpenComment || 0,
      only_fans_can_comment: article.onlyFansCanComment || 0,
    };
  });

  const url = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      articles: articlesData,
    }),
  });
  
  const data = await response.json();
  
  if (data.errcode) {
    throw new Error(`创建草稿失败: ${data.errmsg} (${data.errcode})`);
  }

  return {
    mediaId: data.media_id,
  };
}

export async function publishDraft(
  accountId: number,
  mediaId: string
): Promise<{ publishId: string; msgDataId: string }> {
  const accessToken = await getAccessToken(accountId);
  
  const url = `https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${accessToken}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      media_id: mediaId,
    }),
  });
  
  const data = await response.json();
  
  if (data.errcode) {
    throw new Error(`发布失败: ${data.errmsg} (${data.errcode})`);
  }

  return {
    publishId: data.publish_id,
    msgDataId: data.msg_data_id,
  };
}

export async function getArticleStats(
  accountId: number,
  msgDataId: string
): Promise<{
  readCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
}> {
  const accessToken = await getAccessToken(accountId);
  
  const url = `https://api.weixin.qq.com/cgi-bin/freepublish/getarticle?access_token=${accessToken}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      msg_data_id: msgDataId,
    }),
  });
  
  const data = await response.json();
  
  if (data.errcode) {
    throw new Error(`获取文章数据失败: ${data.errmsg} (${data.errcode})`);
  }

  const article = data.articles?.[0] || {};
  
  return {
    readCount: article.read_num || 0,
    likeCount: article.like_num || 0,
    commentCount: article.comment_count || 0,
    shareCount: article.share_num || 0,
  };
}

export interface LayoutStyleConfig {
  headerStyle?: string | null;
  paragraphSpacing?: string | null;
  listStyle?: string | null;
  highlightStyle?: string | null;
  emojiUsage?: string | null;
  quoteStyle?: string | null;
  imagePosition?: string | null;
  calloutStyle?: string | null;
  colorScheme?: string | null;
  fontStyle?: string | null;
}

const THEME_COLORS: Record<string, { primary: string; secondary: string; gradient: string; shadow: string }> = {
  'default': { 
    primary: '#5e72e4', 
    secondary: '#825ee4', 
    gradient: 'linear-gradient(135deg, #5e72e4, #825ee4)',
    shadow: 'rgba(94, 114, 228, 0.3)'
  },
  'warm': { 
    primary: '#f5a623', 
    secondary: '#f76b1c', 
    gradient: 'linear-gradient(135deg, #f5a623, #f76b1c)',
    shadow: 'rgba(245, 166, 35, 0.3)'
  },
  'cool': { 
    primary: '#00c6fb', 
    secondary: '#005bea', 
    gradient: 'linear-gradient(135deg, #00c6fb, #005bea)',
    shadow: 'rgba(0, 198, 251, 0.3)'
  },
  'dark': { 
    primary: '#434343', 
    secondary: '#000000', 
    gradient: 'linear-gradient(135deg, #434343, #000000)',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  'green': { 
    primary: '#11998e', 
    secondary: '#38ef7d', 
    gradient: 'linear-gradient(135deg, #11998e, #38ef7d)',
    shadow: 'rgba(17, 153, 142, 0.3)'
  },
  'pink': { 
    primary: '#ee9ca7', 
    secondary: '#ffdde1', 
    gradient: 'linear-gradient(135deg, #ee9ca7, #ffdde1)',
    shadow: 'rgba(238, 156, 167, 0.3)'
  },
};

function getThemeColors(colorScheme: string | null | undefined) {
  return THEME_COLORS[colorScheme || 'default'] || THEME_COLORS['default'];
}

function parseContentSections(content: string): { title: string; sections: { heading?: string; content: string }[] } {
  const lines = content.split('\n');
  const sections: { heading?: string; content: string }[] = [];
  let currentSection: { heading?: string; content: string } = { content: '' };
  let title = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (i === 0 && (line.startsWith('# ') || line.startsWith('<h1'))) {
      title = line.replace(/^#?\s*/, '').replace(/<[^>]+>/g, '');
      continue;
    }
    
    if (line.startsWith('## ') || line.startsWith('<h2')) {
      if (currentSection.content.trim()) {
        sections.push(currentSection);
      }
      currentSection = {
        heading: line.replace(/^##?\s*/, '').replace(/<[^>]+>/g, ''),
        content: ''
      };
    } else if (line.startsWith('### ') || line.startsWith('<h3')) {
      if (currentSection.content.trim()) {
        sections.push(currentSection);
      }
      currentSection = {
        heading: line.replace(/^###?\s*/, '').replace(/<[^>]+>/g, ''),
        content: ''
      };
    } else {
      currentSection.content += (currentSection.content ? '\n' : '') + line;
    }
  }
  
  if (currentSection.content.trim() || currentSection.heading) {
    sections.push(currentSection);
  }
  
  return { title, sections };
}

function formatParagraph(text: string, colors: { primary: string; secondary: string }): string {
  let formatted = text
    .replace(/\*\*(.+?)\*\*/g, `<span style="font-weight: 600; color: ${colors.primary};">$1</span>`)
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, `<code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 0.9em;">$1</code>`);
  
  return formatted;
}

function generateSectionHtml(
  section: { heading?: string; content: string },
  index: number,
  colors: { primary: string; secondary: string; gradient: string; shadow: string },
  layoutStyle?: LayoutStyleConfig | null
): string {
  const iconColors = [colors.primary, colors.secondary, colors.primary, colors.secondary];
  const iconColor = iconColors[index % iconColors.length];
  
  let html = '';
  
  if (section.heading) {
    html += `
    <section style="margin: 30px 0 25px; position: relative;">
      <section style="display: flex; align-items: center; margin-bottom: 15px;">
        <section style="width: 40px; height: 40px; border-radius: 50%; background: ${iconColor}; display: flex; justify-content: center; align-items: center; margin-right: 12px; box-shadow: 0 4px 10px ${colors.shadow};">
          <span style="color: white; font-size: 18px; font-weight: 600;">${index + 1}</span>
        </section>
        <h2 style="font-size: 1.5rem; font-weight: 700; color: #333; margin: 0;">${section.heading}</h2>
      </section>
      <section style="background: white; border-radius: 16px; padding: 22px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">`;
  } else {
    html += `
    <section style="margin: 25px 0;">
      <section style="background: white; border-radius: 16px; padding: 22px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">`;
  }
  
  const paragraphs = section.content.split('\n\n').filter(p => p.trim());
  
  paragraphs.forEach((para, pIndex) => {
    const formattedPara = formatParagraph(para, colors);
    
    if (formattedPara.startsWith('- ') || formattedPara.startsWith('* ')) {
      const items = formattedPara.split('\n').filter(item => item.trim());
      html += `<ul style="margin: 15px 0; padding-left: 20px; color: #444;">`;
      items.forEach(item => {
        const cleanItem = item.replace(/^[-*]\s*/, '');
        html += `<li style="margin: 8px 0; line-height: 1.7;">${cleanItem}</li>`;
      });
      html += `</ul>`;
    } else if (formattedPara.startsWith('> ')) {
      const quoteContent = formattedPara.replace(/^>\s*/, '');
      html += `
        <section style="background: rgba(94, 114, 228, 0.08); border-left: 4px solid ${colors.primary}; padding: 15px; border-radius: 0 8px 8px 0; margin: 20px 0;">
          <p style="font-size: 1.05rem; font-style: italic; color: #444; margin: 0; line-height: 1.6;">${quoteContent}</p>
        </section>`;
    } else {
      html += `<p style="font-size: 1rem; line-height: 1.75; color: #444; margin: ${pIndex === 0 ? '0' : '15px 0 0'};">${formattedPara}</p>`;
    }
  });
  
  html += `
      </section>
    </section>`;
  
  return html;
}

export function convertToWechatHtml(
  content: string, 
  images: { original: string; wechatUrl: string }[],
  layoutStyle?: LayoutStyleConfig | null
): string {
  let html = content;
  
  for (const img of images) {
    html = html.replace(new RegExp(img.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), img.wechatUrl);
  }

  const colors = getThemeColors(layoutStyle?.colorScheme);
  
  const { title, sections } = parseContentSections(html);
  
  const displayTitle = title || '精彩内容';
  
  let result = `<section style="padding: 0; margin: 0; font-family: 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif; color: #333; line-height: 1.6;">`;
  
  result += `
    <section style="background: ${colors.gradient}; padding: 20px 15px 35px; border-radius: 0px 0px 30px 30px; margin-bottom: -25px; box-shadow: ${colors.shadow} 0px 4px 15px;">
      <h1 style="color: white; font-size: 1.8rem; font-weight: 700; margin: 20px 5px 10px; letter-spacing: -0.5px; line-height: 1.3;">${displayTitle}</h1>
    </section>`;
  
  result += `
    <section style="background: white; border-radius: 20px; padding: 25px 20px; margin: 0 0 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
      <p style="font-size: 1.1rem; line-height: 1.7; color: #444; font-weight: 500; margin: 0;">
        欢迎阅读本文，我们将为您带来精彩的内容分享。
      </p>
    </section>`;
  
  sections.forEach((section, index) => {
    result += generateSectionHtml(section, index, colors, layoutStyle);
  });
  
  result += `
    <section style="margin: 25px 0 40px;">
      <section style="background: ${colors.gradient}; border-radius: 16px; padding: 25px; box-shadow: 0 5px 15px ${colors.shadow}; color: white;">
        <h2 style="font-size: 1.3rem; font-weight: 700; margin: 0 0 15px; letter-spacing: 0.3px;">感谢阅读</h2>
        <p style="font-size: 1rem; line-height: 1.75; margin: 0; opacity: 0.95;">
          如果您觉得本文对您有帮助，欢迎点赞、收藏和分享。您的支持是我们持续创作的动力！
        </p>
      </section>
    </section>`;
  
  result += `</section>`;
  
  return result;
}

export function extractImageUrls(content: string): string[] {
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const urls: string[] = [];
  let match;
  
  while ((match = imgRegex.exec(content)) !== null) {
    urls.push(match[1]);
  }
  
  const mdImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  while ((match = mdImgRegex.exec(content)) !== null) {
    urls.push(match[2]);
  }
  
  return [...new Set(urls)];
}
