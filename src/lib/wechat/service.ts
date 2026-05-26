import { db } from '../db';
import { wechatAccounts, publishedArticles, articleStats, articleStatsDaily } from '../db/schema';
import { eq, desc, inArray } from 'drizzle-orm';

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
  const database = db();

  // 从数据库读取缓存的 token
  const accounts = await database.select().from(wechatAccounts).where(eq(wechatAccounts.id, accountId));
  if (accounts.length === 0) {
    throw new Error('公众号账号不存在');
  }

  const account = accounts[0];

  // 检查数据库中缓存的 token 是否有效（提前 60 秒过期）
  if (account.accessToken && account.tokenExpiresAt && account.tokenExpiresAt.getTime() > Date.now() + 60000) {
    return account.accessToken;
  }

  if (!account.appId || !account.appSecret) {
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
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  // 保存到数据库
  await database
    .update(wechatAccounts)
    .set({
      accessToken,
      tokenExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(wechatAccounts.id, accountId));

  return accessToken;
}

// 常见图片扩展名到MIME类型的映射
const IMAGE_MIME_MAP: Record<string, string> = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'bmp': 'image/bmp',
  'svg': 'image/svg+xml',
  'ico': 'image/x-icon',
  'tiff': 'image/tiff',
  'tif': 'image/tiff',
  'avif': 'image/avif',
};

// 根据文件头推断 MIME 类型的辅助函数
function detectMimeByHeader(buffer: Buffer): string | undefined {
  if (buffer.length < 4) return undefined;
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }
  // GIF: 47 49 46
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return 'image/gif';
  }
  // WEBP: 52 49 46 46 ... 57 45 42 50
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return 'image/webp';
  }
  return undefined;
}

// 根据文件名和文件头综合推断 MIME 类型（增强版）
export function guessMimeType(filename: string, buffer?: Buffer): string | undefined {
  // 1. 优先通过文件扩展名判断
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeFromExt = ext ? IMAGE_MIME_MAP[ext] : undefined;

  // 2. 如果有 buffer，通过文件头验证
  if (buffer && buffer.length >= 4) {
    const mimeFromHeader = detectMimeByHeader(buffer);
    // 如果扩展名和文件头都匹配到，优先使用文件头（更准确）
    if (mimeFromHeader) {
      // 扩展名判断为 webp 但文件头是其他类型时，以文件头为准
      return mimeFromHeader;
    }
    // 文件头无法识别但有扩展名，返回扩展名推断结果
    return mimeFromExt;
  }

  return mimeFromExt;
}

// 根据MIME类型推断文件扩展名
function mimeToExt(mimeType: string): string {
  const entry = Object.entries(IMAGE_MIME_MAP).find(([, mime]) => mime === mimeType);
  if (entry) return entry[0];
  // 默认返回 jpg
  return 'jpg';
}

export interface UploadImageResult {
  mediaId: string;
  url?: string;
}

export async function uploadImage(
  accountId: number,
  imageData: Buffer,
  filename: string,
  type: 'thumb' | 'image' = 'image',
  mimeType?: string
): Promise<UploadImageResult> {
  const accessToken = await getAccessToken(accountId);

  // 根据文件扩展名推断MIME类型，如果无法判断则默认使用 image/jpeg
  const detectedMime = mimeType || guessMimeType(filename) || 'image/jpeg';
  const formData = new FormData();
  const uint8Array = new Uint8Array(imageData);
  const blob = new Blob([uint8Array], { type: detectedMime });
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
  let detectedMime: string | undefined;

  if (imageUrl.startsWith('data:')) {
    const matches = imageUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) {
      throw new Error('无效的 base64 图片格式');
    }
    // 从 data URI 中提取实际MIME类型
    detectedMime = matches[1];
    const ext = mimeToExt(detectedMime);
    buffer = Buffer.from(matches[2], 'base64');
    filename = `image.${ext}`;
  } else {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`下载图片失败: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);

    // 优先从响应的 Content-Type 获取MIME类型
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.startsWith('image/')) {
      detectedMime = contentType.split(';')[0].trim();
    }

    const urlObj = new URL(imageUrl);
    filename = urlObj.pathname.split('/').pop() || 'image.jpg';
  }

  return uploadImage(accountId, buffer, filename, type, detectedMime);
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

export interface WechatDraftArticle {
  title: string;
  author: string;
  digest: string;
  content: string;
  contentSourceUrl: string;
  thumbMediaId: string;
  url: string;
  needOpenComment: boolean;
  onlyFansCanComment: boolean;
}

export interface WechatDraftItem {
  mediaId: string;
  updateTime: Date | null;
  content: {
    newsItem: WechatDraftArticle[];
  };
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

export async function listWechatDrafts(
  accountId: number,
  options?: { offset?: number; count?: number; noContent?: boolean }
): Promise<{ totalCount: number; itemCount: number; items: WechatDraftItem[] }> {
  const accessToken = await getAccessToken(accountId);
  const url = `https://api.weixin.qq.com/cgi-bin/draft/batchget?access_token=${accessToken}`;
  const count = Math.min(Math.max(options?.count ?? 20, 1), 20);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      offset: options?.offset ?? 0,
      count,
      no_content: options?.noContent ? 1 : 0,
    }),
  });

  const data = await response.json();

  if (data.errcode) {
    throw new Error(`获取草稿列表失败: ${data.errmsg} (${data.errcode})`);
  }

  const items = Array.isArray(data.item) ? data.item : [];
  return {
    totalCount: Number(data.total_count || 0),
    itemCount: Number(data.item_count || items.length),
    items: items.map((item: Record<string, any>) => ({
      mediaId: String(item.media_id || ''),
      updateTime: item.update_time ? new Date(Number(item.update_time) * 1000) : null,
      content: {
        newsItem: Array.isArray(item.content?.news_item)
          ? item.content.news_item.map((article: Record<string, any>) => ({
              title: String(article.title || ''),
              author: String(article.author || ''),
              digest: String(article.digest || ''),
              content: String(article.content || ''),
              contentSourceUrl: String(article.content_source_url || ''),
              thumbMediaId: String(article.thumb_media_id || ''),
              url: String(article.url || ''),
              needOpenComment: Number(article.need_open_comment || 0) === 1,
              onlyFansCanComment: Number(article.only_fans_can_comment || 0) === 1,
            }))
          : [],
      },
    })),
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

export interface PublishStatusResult {
  publishId: string;
  publishStatus: string;
  publishStatusName: string;
  articleUrl?: string;
  msgDataId?: string;
  failReason?: string;
  raw: Record<string, any>;
}

function normalizePublishStatus(status: number | string | undefined): { code: string; name: string; localStatus: string } {
  const value = String(status ?? '');
  const map: Record<string, { code: string; name: string; localStatus: string }> = {
    '0': { code: 'publishing', name: '发布中', localStatus: 'pending' },
    '1': { code: 'publish_success', name: '发布成功', localStatus: 'published' },
    '2': { code: 'publish_failed', name: '发布失败', localStatus: 'failed' },
    publish_success: { code: 'publish_success', name: '发布成功', localStatus: 'published' },
    publish_failed: { code: 'publish_failed', name: '发布失败', localStatus: 'failed' },
  };
  return map[value] || { code: value || 'unknown', name: '未知状态', localStatus: 'pending' };
}

export function toLocalPublishStatus(status: string): string {
  return normalizePublishStatus(status).localStatus;
}

export async function getPublishStatus(accountId: number, publishId: string): Promise<PublishStatusResult> {
  const accessToken = await getAccessToken(accountId);
  const response = await fetch(`https://api.weixin.qq.com/cgi-bin/freepublish/get?access_token=${accessToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publish_id: publishId }),
  });
  const data = await response.json();

  if (data.errcode) {
    throw new Error(`查询发布状态失败: ${data.errmsg} (${data.errcode})`);
  }

  const status = normalizePublishStatus(data.publish_status);
  const firstArticle = Array.isArray(data.article_detail?.item)
    ? data.article_detail.item[0]
    : Array.isArray(data.article_detail?.news_item)
      ? data.article_detail.news_item[0]
      : undefined;

  return {
    publishId,
    publishStatus: status.code,
    publishStatusName: status.name,
    articleUrl: firstArticle?.article_url || firstArticle?.url || data.article_url,
    msgDataId: data.msg_data_id ? String(data.msg_data_id) : undefined,
    failReason: data.fail_idx !== undefined ? `fail_idx=${data.fail_idx}` : data.fail_reason,
    raw: data,
  };
}

export async function listPublishedArticlesFromWechat(
  accountId: number,
  options?: { offset?: number; count?: number; noContent?: boolean }
) {
  const accessToken = await getAccessToken(accountId);
  const count = Math.min(Math.max(options?.count ?? 20, 1), 20);
  const response = await fetch(`https://api.weixin.qq.com/cgi-bin/freepublish/batchget?access_token=${accessToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      offset: options?.offset ?? 0,
      count,
      no_content: options?.noContent ? 1 : 0,
    }),
  });
  const data = await response.json();

  if (data.errcode) {
    throw new Error(`获取已发布列表失败: ${data.errmsg} (${data.errcode})`);
  }

  const items = Array.isArray(data.item) ? data.item : [];
  return {
    totalCount: Number(data.total_count || 0),
    itemCount: Number(data.item_count || items.length),
    items: items.map((item: Record<string, any>) => {
      const firstArticle = Array.isArray(item.content?.news_item) ? item.content.news_item[0] : {};
      return {
        articleUrl: String(firstArticle?.url || item.article_url || ''),
        title: String(firstArticle?.title || item.title || ''),
        msgDataId: item.msg_data_id ? String(item.msg_data_id) : undefined,
        publishId: item.publish_id ? String(item.publish_id) : undefined,
        publishTime: item.update_time ? new Date(Number(item.update_time) * 1000) : null,
        raw: item,
      };
    }),
  };
}

export async function syncPublishedArticlesFromWechat(accountId: number) {
  const database = db();
  const result = await listPublishedArticlesFromWechat(accountId, { count: 20, noContent: false });
  const items: Array<Record<string, unknown>> = [];
  let failed = 0;

  for (const item of result.items) {
    try {
      if (!item.articleUrl && !item.msgDataId) {
        failed += 1;
        continue;
      }

      const [inserted] = await database.insert(publishedArticles).values({
        title: item.title || '微信已发布文章',
        content: '',
        wechatAccountId: accountId,
        publishStatus: 'published',
        publishTime: item.publishTime,
        wechatPublishId: item.publishId,
        wechatMsgDataId: item.msgDataId,
        wechatMediaId: item.msgDataId,
        wechatArticleUrl: item.articleUrl,
        articleUrl: item.articleUrl,
        publishDetail: JSON.stringify(item.raw || {}),
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      items.push(inserted || item);
    } catch (error) {
      failed += 1;
    }
  }

  return {
    success: failed === 0,
    synced: items.length,
    failed,
    items,
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

async function callDatacube(accountId: number, endpoint: string, beginDate: string, endDate: string) {
  const accessToken = await getAccessToken(accountId);
  const response = await fetch(`https://api.weixin.qq.com/datacube/${endpoint}?access_token=${accessToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ begin_date: beginDate, end_date: endDate }),
  });
  const data = await response.json();
  if (data.errcode) {
    throw new Error(`datacube ${endpoint} 失败: ${data.errmsg} (${data.errcode})`);
  }
  return data;
}

export interface DatacubeSyncResult {
  success: boolean;
  synced: number;
  failed: number;
  skipped: number;
  details: Array<{
    articleId: number;
    msgDataId: string;
    status: 'synced' | 'failed' | 'skipped' | 'no_data';
    message?: string;
  }>;
}

export async function syncDatacubeDailyStats(options: {
  date: string;
  articleIds?: number[];
  force?: boolean;
}): Promise<DatacubeSyncResult> {
  const database = db();
  const result: DatacubeSyncResult = { success: true, synced: 0, failed: 0, skipped: 0, details: [] };

  let articlesQuery = database
    .select()
    .from(publishedArticles)
    .where(eq(publishedArticles.publishStatus, 'published'));

  if (options.articleIds?.length) {
    articlesQuery = database
      .select()
      .from(publishedArticles)
      .where(inArray(publishedArticles.id, options.articleIds));
  }

  const articles = await articlesQuery;
  for (const article of articles) {
    const msgDataId = article.wechatMsgDataId || article.wechatMediaId || '';
    if (!article.wechatAccountId || !msgDataId) {
      result.skipped += 1;
      result.details.push({
        articleId: article.id,
        msgDataId,
        status: 'skipped',
        message: 'Missing wechatAccountId or msgDataId',
      });
      continue;
    }

    try {
      const [summary, userRead, total] = await Promise.all([
        callDatacube(article.wechatAccountId, 'getarticlesummary', options.date, options.date),
        callDatacube(article.wechatAccountId, 'getuserread', options.date, options.date),
        callDatacube(article.wechatAccountId, 'getarticletotal', options.date, options.date),
      ]);

      const summaryList = Array.isArray(summary.list) ? summary.list : [];
      const totalList = Array.isArray(total.list) ? total.list : [];
      const userReadList = Array.isArray(userRead.list) ? userRead.list : [];
      const matched = [...summaryList, ...totalList].find((item: Record<string, any>) =>
        String(item.msgid || item.msg_data_id || item.ref_date || '') === msgDataId ||
        String(item.title || '') === String(article.title || '')
      ) || summaryList[0] || totalList[0] || null;

      if (!matched) {
        result.skipped += 1;
        result.details.push({
          articleId: article.id,
          msgDataId,
          status: 'no_data',
          message: '微信 datacube 未返回该文章统计；低阅读量内容可能不返回统计。',
        });
        continue;
      }

      await database.insert(articleStatsDaily).values({
        articleId: article.id,
        date: options.date,
        totalRead: Number(matched.int_page_read_count || matched.total_read || matched.read_count || 0),
        totalLike: Number(matched.like_count || matched.old_like_num || 0),
        totalComment: Number(matched.comment_count || 0),
        totalShare: Number(matched.share_count || 0),
        totalCollect: Number(matched.add_to_fav_count || matched.collect_count || 0),
        dailyReadGrowth: Number(matched.int_page_read_count || matched.total_read || matched.read_count || 0),
        dailyLikeGrowth: Number(matched.like_count || matched.old_like_num || 0),
        dailyCommentGrowth: Number(matched.comment_count || 0),
        dailyShareGrowth: Number(matched.share_count || 0),
        sourceBreakdown: JSON.stringify(userReadList),
        rawSummary: JSON.stringify({ summary, total }),
        syncStatus: 'synced',
        syncMessage: 'datacube synced',
      });

      result.synced += 1;
      result.details.push({ articleId: article.id, msgDataId, status: 'synced' });
    } catch (error) {
      result.failed += 1;
      result.success = false;
      result.details.push({
        articleId: article.id,
        msgDataId,
        status: 'failed',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export interface SyncStatsResult {
  success: boolean;
  synced: number;
  failed: number;
  skipped: number;
  error?: string;
  details: Array<{
    articleId: number;
    msgDataId: string;
    status: 'synced' | 'failed' | 'skipped';
    error?: string;
    readCount?: number;
    likeCount?: number;
  }>;
}

/**
 * 批量同步所有已发布文章的统计数据
 * @param options.articleIds 可选，只同步指定文章ID列表
 * @param options.force 是否强制同步（忽略30分钟检查）
 */
export async function syncAllArticleStats(options?: {
  articleIds?: number[];
  force?: boolean;
}): Promise<SyncStatsResult> {
  const database = db();
  const result: SyncStatsResult = {
    success: true,
    synced: 0,
    failed: 0,
    skipped: 0,
    details: [],
  };

  try {
    // 查询需要同步的文章：已发布且有 msgDataId 的文章
    let articlesQuery = database
      .select()
      .from(publishedArticles)
      .where(eq(publishedArticles.publishStatus, 'published'));

    if (options?.articleIds && options.articleIds.length > 0) {
      articlesQuery = database
        .select()
        .from(publishedArticles)
        .where(inArray(publishedArticles.id, options.articleIds));
    }

    const articles = await articlesQuery;

    if (articles.length === 0) {
      return result;
    }

    // 检查最近一次同步时间，如果30分钟内已同步则跳过（除非force=true）
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    let articlesToSync = articles;

    if (!options?.force) {
      const latestStats = await database
        .select()
        .from(articleStats)
        .orderBy(desc(articleStats.recordTime))
        .limit(1);

      if (latestStats.length > 0 && latestStats[0].recordTime >= thirtyMinutesAgo) {
        // 已存在30分钟内的同步记录，仅同步没有统计记录的文章
        const existingStatArticleIds = await database
          .select({ articleId: articleStats.articleId })
          .from(articleStats);

        const existingIds = new Set(existingStatArticleIds.map(s => s.articleId));
        articlesToSync = articles.filter(a => !existingIds.has(a.id));
        result.skipped = articles.length - articlesToSync.length;
      }
    }

    for (const article of articlesToSync) {
      if (!article.wechatAccountId || !article.wechatMediaId) {
        result.skipped += 1;
        result.details.push({
          articleId: article.id,
          msgDataId: article.wechatMediaId || '',
          status: 'skipped',
          error: 'Missing wechatAccountId or wechatMediaId',
        });
        continue;
      }

      try {
        const stats = await getArticleStats(article.wechatAccountId, article.wechatMediaId);

        await database.insert(articleStats).values({
          articleId: article.id,
          recordTime: new Date(),
          readCount: stats.readCount,
          likeCount: stats.likeCount,
          commentCount: stats.commentCount,
          shareCount: stats.shareCount,
        });

        // 同时更新 publishedArticles 表中的最新统计
        await database
          .update(publishedArticles)
          .set({
            readCount: stats.readCount,
            likeCount: stats.likeCount,
            commentCount: stats.commentCount,
            shareCount: stats.shareCount,
            updatedAt: new Date(),
          })
          .where(eq(publishedArticles.id, article.id));

        result.synced += 1;
        result.details.push({
          articleId: article.id,
          msgDataId: article.wechatMediaId,
          status: 'synced',
          readCount: stats.readCount,
          likeCount: stats.likeCount,
        });
      } catch (error) {
        result.failed += 1;
        result.details.push({
          articleId: article.id,
          msgDataId: article.wechatMediaId || '',
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        });
        console.error(`[syncAllArticleStats] Failed to sync article ${article.id}:`, error);
      }
    }

    return result;
  } catch (error) {
    result.success = false;
    result.error = error instanceof Error ? error.message : String(error);
    console.error('[syncAllArticleStats] Error:', error);
    return result;
  }
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
  _layoutStyle?: LayoutStyleConfig | null
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
  
  result = optimizeForWechat(result);
  
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

export function divToSection(html: string): string {
  let result = html;
  result = result.replace(/<div([^>]*)>/gi, '<section$1>');
  result = result.replace(/<\/div>/gi, '</section>');
  return result;
}

export function injectTextIndent(html: string): string {
  const processParagraph = (pHtml: string): string => {
    if (pHtml.includes('text-indent')) {
      return pHtml;
    }
    const styleMatch = pHtml.match(/<p\s+style="([^"]*)"/i);
    if (styleMatch) {
      const existingStyle = styleMatch[1];
      if (existingStyle.trim()) {
        return pHtml.replace(
          /<p\s+style="([^"]*)"/i,
          '<p style="text-indent: 2em; $1"'
        );
      } else {
        return pHtml.replace(
          /<p\s+style=""/i,
          '<p style="text-indent: 2em;"'
        );
      }
    }
    return pHtml.replace(/<p>/gi, '<p style="text-indent: 2em;">');
  };
  let result = html;
  result = result.replace(/<p[^>]*>[\s\S]*?<\/p>/gi, (match) => processParagraph(match));
  return result;
}

export function compressHtml(html: string): string {
  let result = html;
  result = result.replace(/>\s+</g, '><');
  result = result.replace(/\n/g, '');
  result = result.replace(/\s{2,}/g, ' ');
  result = result.replace(/\s+>/g, '>');
  result = result.replace(/<\s+/g, '<');
  return result.trim();
}

export function optimizeForWechat(html: string): string {
  let result = html;
  result = divToSection(result);
  result = injectTextIndent(result);
  result = compressHtml(result);
  return result;
}
