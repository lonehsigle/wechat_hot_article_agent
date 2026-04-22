import { db, getPool } from './index';
import { encrypt } from './crypto';
import { monitorCategories, contents, reports, insights, topics, wechatAccounts, llmConfigs, cacheRecords, publishedArticles, articleStats, articleStatsDaily, writingTechniques, techniqueCategories } from './schema.pg';
import { eq, desc, lt, asc, and } from 'drizzle-orm';

export async function getMonitorCategories() {
  const database = db();
  return await database.select().from(monitorCategories).orderBy(desc(monitorCategories.createdAt));
}

export async function getMonitorCategoryById(id: number) {
  const database = db();
  const result = await database.select().from(monitorCategories).where(eq(monitorCategories.id, id));
  return result[0] || null;
}

export async function createMonitorCategory(data: { name: string; platforms?: string[] | null; keywords?: string[] | null; creators?: string[] | null }) {
  const database = db();
  const now = new Date();
  const result = await database.insert(monitorCategories).values({
    name: data.name,
    platforms: data.platforms ? JSON.stringify(data.platforms) : null,
    keywords: data.keywords ? JSON.stringify(data.keywords) : null,
    creators: data.creators ? JSON.stringify(data.creators) : null,
    createdAt: now,
    updatedAt: now,
  }).returning();
  return result[0];
}

export async function updateMonitorCategory(id: number, data: Partial<{ name: string; platforms: string[] | null; keywords: string[] | null; creators: string[] | null }>) {
  const database = db();
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.platforms !== undefined) updateData.platforms = data.platforms ? JSON.stringify(data.platforms) : null;
  if (data.keywords !== undefined) updateData.keywords = data.keywords ? JSON.stringify(data.keywords) : null;
  if (data.creators !== undefined) updateData.creators = data.creators ? JSON.stringify(data.creators) : null;
  const result = await database.update(monitorCategories).set(updateData).where(eq(monitorCategories.id, id)).returning();
  return result[0] || null;
}

export async function deleteMonitorCategory(id: number) {
  const database = db();
  const result = await database.delete(monitorCategories).where(eq(monitorCategories.id, id)).returning();
  return result.length > 0;
}

export async function getContentsByCategory(categoryId: number) {
  const database = db();
  return await database.select().from(contents).where(eq(contents.categoryId, categoryId)).orderBy(desc(contents.fetchedAt));
}

export async function createContent(data: { categoryId?: number | null; platform: string; title: string; author: string; date: string; likes?: number; comments?: number; shares?: number; url: string }) {
  const database = db();
  const result = await database.insert(contents).values({
    categoryId: data.categoryId ?? null,
    platform: data.platform,
    title: data.title,
    author: data.author,
    date: data.date,
    likes: data.likes ?? 0,
    comments: data.comments ?? 0,
    shares: data.shares ?? 0,
    url: data.url,
    fetchedAt: new Date(),
  }).returning();
  return result[0];
}

export async function getReportsByCategory(categoryId: number) {
  const database = db();
  return await database.select().from(reports).where(eq(reports.categoryId, categoryId)).orderBy(desc(reports.createdAt));
}

export async function createReport(data: { categoryId?: number | null; date: string; title: string; summary: string }) {
  const database = db();
  const result = await database.insert(reports).values({
    categoryId: data.categoryId ?? null,
    date: data.date,
    title: data.title,
    summary: data.summary,
    createdAt: new Date(),
  }).returning();
  return result[0];
}

export async function getInsightsByReport(reportId: number) {
  const database = db();
  return await database.select().from(insights).where(eq(insights.reportId, reportId));
}

export async function createInsight(data: { reportId: number; type: string; content: string }) {
  const database = db();
  const result = await database.insert(insights).values({
    reportId: data.reportId,
    type: data.type,
    content: data.content,
    createdAt: new Date(),
  }).returning();
  return result[0];
}

export async function getTopicsByReport(reportId: number) {
  const database = db();
  return await database.select().from(topics).where(eq(topics.reportId, reportId));
}

export async function createTopic(data: { reportId: number; title: string; description: string; reason: string; potential: string }) {
  const database = db();
  const result = await database.insert(topics).values({
    reportId: data.reportId,
    title: data.title,
    description: data.description,
    reason: data.reason,
    potential: data.potential,
    createdAt: new Date(),
  }).returning();
  return result[0];
}

export async function getWechatAccounts() {
  const database = db();
  const result = await database.select().from(wechatAccounts).orderBy(desc(wechatAccounts.createdAt));
  return result;
}

export async function getWechatAccountById(id: number) {
  const database = db();
  const result = await database.select().from(wechatAccounts).where(eq(wechatAccounts.id, id));
  return result[0] || null;
}

export async function getDefaultWechatAccount() {
  const database = db();
  const result = await database.select().from(wechatAccounts).where(eq(wechatAccounts.isDefault, true));
  return result[0] || null;
}

export async function createWechatAccount(data: { name: string; appId?: string; appSecret?: string; authorName?: string; isDefault?: boolean; targetAudience?: string; readerPersona?: string }) {
  const database = db();
  const now = new Date();
  const result = await database.insert(wechatAccounts).values({
    name: data.name,
    appId: data.appId ?? '',
    appSecret: data.appSecret ?? '',
    authorName: data.authorName ?? '',
    isDefault: data.isDefault ?? false,
    targetAudience: data.targetAudience ?? '',
    readerPersona: data.readerPersona ?? '',
    createdAt: now,
    updatedAt: now,
  }).returning();
  return result[0];
}

export async function updateWechatAccount(id: number, data: Partial<{ name: string; appId: string; appSecret: string; authorName: string; isDefault: boolean; targetAudience: string; readerPersona: string }>) {
  const database = db();
  const result = await database.update(wechatAccounts).set({
    ...data,
    updatedAt: new Date(),
  }).where(eq(wechatAccounts.id, id)).returning();
  return result[0] || null;
}

export async function deleteWechatAccount(id: number) {
  const database = db();
  const result = await database.delete(wechatAccounts).where(eq(wechatAccounts.id, id)).returning();
  return result.length > 0;
}

export async function setDefaultWechatAccount(id: number) {
  const database = db();
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // 修复：添加 WHERE 子句，只更新非目标账号
    await client.query('UPDATE wechat_accounts SET is_default = false WHERE id != $1', [id]);
    await client.query('UPDATE wechat_accounts SET is_default = true, updated_at = NOW() WHERE id = $1', [id]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('设置默认微信账号失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getLLMConfig(): Promise<{
  provider: string;
  apiKey: string;
  model: string;
  baseUrl: string | null;
} | null> {
  const database = db();
  const result = await database.select().from(llmConfigs).limit(1);
  if (result[0]) {
    return {
      provider: result[0].provider,
      apiKey: result[0].apiKey,
      model: result[0].model,
      baseUrl: result[0].baseUrl,
    };
  }
  return null;
}

export async function saveLLMConfig(data: { provider: string; apiKey?: string; model: string; baseUrl?: string | null }) {
  const database = db();
  const existing = await getLLMConfig();
  const now = new Date();

  const updateData: Record<string, string | number | boolean | Date | null> = {
    provider: data.provider,
    model: data.model,
    baseUrl: data.baseUrl ?? null,
    updatedAt: now,
  };

  if (data.apiKey) {
    updateData.apiKey = encrypt(data.apiKey);
  }

  if (existing) {
    await database.update(llmConfigs).set(updateData);
  } else {
    if (!data.apiKey) {
      throw new Error('首次配置必须提供 API Key');
    }
    await database.insert(llmConfigs).values({
      provider: data.provider,
      apiKey: encrypt(data.apiKey),
      model: data.model,
      baseUrl: data.baseUrl ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  const database = db();
  const result = await database.select().from(cacheRecords).where(eq(cacheRecords.cacheKey, key));
  if (result[0]) {
    if (result[0].expiresAt > new Date()) {
      return result[0].cacheData as T;
    }
    await database.delete(cacheRecords).where(eq(cacheRecords.id, result[0].id));
  }
  return null;
}

export async function setCache<T>(key: string, data: T, expiresInSeconds: number) {
  const database = db();
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  const existing = await database.select().from(cacheRecords).where(eq(cacheRecords.cacheKey, key));
  
  const cacheData = typeof data === 'string' ? data : JSON.stringify(data);
  if (existing[0]) {
    await database.update(cacheRecords).set({
      cacheData,
      fetchedAt: new Date(),
      expiresAt,
    }).where(eq(cacheRecords.id, existing[0].id));
  } else {
    await database.insert(cacheRecords).values({
      cacheKey: key,
      cacheData,
      fetchedAt: new Date(),
      expiresAt,
    });
  }
}

export async function clearExpiredCache() {
  const database = db();
  await database.delete(cacheRecords).where(lt(cacheRecords.expiresAt, new Date()));
}

export async function getPublishedArticles(limit = 50) {
  const database = db();
  const result = await database.select().from(publishedArticles).orderBy(desc(publishedArticles.createdAt)).limit(limit);
  return result;
}

export async function getPublishedArticleById(id: number) {
  const database = db();
  const result = await database.select().from(publishedArticles).where(eq(publishedArticles.id, id));
  return result[0] || null;
}

export async function createPublishedArticle(data: { title: string; content?: string; coverImage?: string; images?: string[] | null; wechatAccountId?: number | null; topicId?: number | null; publishStatus?: string; publishTime?: Date | null; wechatMediaId?: string; wechatArticleUrl?: string }) {
  const database = db();
  const now = new Date();
  const result = await database.insert(publishedArticles).values({
    title: data.title,
    content: data.content ?? '',
    coverImage: data.coverImage ?? '',
    images: data.images ? JSON.stringify(data.images) : null,
    wechatAccountId: data.wechatAccountId ?? null,
    topicId: data.topicId ?? null,
    publishStatus: data.publishStatus ?? 'draft',
    publishTime: data.publishTime ?? null,
    wechatMediaId: data.wechatMediaId ?? null,
    wechatArticleUrl: data.wechatArticleUrl ?? null,
    createdAt: now,
    updatedAt: now,
  }).returning();
  return result[0];
}

export async function updatePublishedArticle(id: number, data: Partial<{ title: string; content: string; coverImage: string; images: string[] | null; publishStatus: string; publishTime: Date | null; wechatMediaId: string; wechatArticleUrl: string }>) {
  const database = db();
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
  if (data.images !== undefined) updateData.images = data.images ? JSON.stringify(data.images) : null;
  if (data.publishStatus !== undefined) updateData.publishStatus = data.publishStatus;
  if (data.publishTime !== undefined) updateData.publishTime = data.publishTime;
  if (data.wechatMediaId !== undefined) updateData.wechatMediaId = data.wechatMediaId;
  if (data.wechatArticleUrl !== undefined) updateData.wechatArticleUrl = data.wechatArticleUrl;
  const result = await database.update(publishedArticles).set(updateData).where(eq(publishedArticles.id, id)).returning();
  return result[0] || null;
}

export async function getArticleStats(articleId: number) {
  const database = db();
  return await database.select().from(articleStats).where(eq(articleStats.articleId, articleId)).orderBy(desc(articleStats.recordTime));
}

export async function createArticleStats(data: { articleId: number; readCount?: number; likeCount?: number; commentCount?: number; shareCount?: number; collectCount?: number; readGrowth?: number; likeGrowth?: number; commentGrowth?: number; shareGrowth?: number }) {
  const database = db();
  const result = await database.insert(articleStats).values({
    articleId: data.articleId,
    recordTime: new Date(),
    readCount: data.readCount ?? 0,
    likeCount: data.likeCount ?? 0,
    commentCount: data.commentCount ?? 0,
    shareCount: data.shareCount ?? 0,
    collectCount: data.collectCount ?? 0,
    readGrowth: data.readGrowth ?? 0,
    likeGrowth: data.likeGrowth ?? 0,
    commentGrowth: data.commentGrowth ?? 0,
    shareGrowth: data.shareGrowth ?? 0,
  }).returning();
  return result[0];
}

export async function getArticleStatsDaily(articleId: number) {
  const database = db();
  return await database.select().from(articleStatsDaily).where(eq(articleStatsDaily.articleId, articleId)).orderBy(desc(articleStatsDaily.date));
}

export async function getTechniqueCategories() {
  const database = db();
  return await database.select().from(techniqueCategories).orderBy(asc(techniqueCategories.sortOrder));
}

export async function createTechniqueCategory(data: { name: string; code: string; description?: string; sortOrder?: number }) {
  const database = db();
  const result = await database.insert(techniqueCategories).values({
    name: data.name,
    code: data.code,
    description: data.description ?? null,
    sortOrder: data.sortOrder ?? 0,
    createdAt: new Date(),
  }).returning();
  return result[0];
}

export async function getWritingTechniques(category?: string, stage?: string) {
  const database = db();
  if (category && stage) {
    return await database.select().from(writingTechniques)
      .where(and(eq(writingTechniques.category, category), eq(writingTechniques.stage, stage)))
      .orderBy(asc(writingTechniques.priority));
  } else if (category) {
    return await database.select().from(writingTechniques)
      .where(eq(writingTechniques.category, category))
      .orderBy(asc(writingTechniques.priority));
  }
  return await database.select().from(writingTechniques)
    .orderBy(asc(writingTechniques.category), asc(writingTechniques.priority));
}

export async function getWritingTechniqueById(id: number) {
  const database = db();
  const result = await database.select().from(writingTechniques).where(eq(writingTechniques.id, id));
  return result[0] || null;
}

export async function createWritingTechnique(data: { category: string; stage: string; title: string; content: string; examples?: string; formulas?: string; checklists?: string[]; priority?: number; isActive?: boolean }) {
  const database = db();
  const now = new Date();
  const result = await database.insert(writingTechniques).values({
    category: data.category,
    stage: data.stage,
    title: data.title,
    content: data.content,
    examples: data.examples ?? null,
    formulas: data.formulas ?? null,
    checklists: data.checklists ? JSON.stringify(data.checklists) : null,
    priority: data.priority ?? 0,
    isActive: data.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  }).returning();
  return result[0];
}

export async function updateWritingTechnique(id: number, data: Partial<{ category: string; stage: string; title: string; content: string; examples: string; formulas: string; checklists: string[]; priority: number; isActive: boolean }>) {
  const database = db();
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.category !== undefined) updateData.category = data.category;
  if (data.stage !== undefined) updateData.stage = data.stage;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.examples !== undefined) updateData.examples = data.examples;
  if (data.formulas !== undefined) updateData.formulas = data.formulas;
  if (data.checklists !== undefined) updateData.checklists = data.checklists ? JSON.stringify(data.checklists) : null;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  const result = await database.update(writingTechniques).set(updateData).where(eq(writingTechniques.id, id)).returning();
  return result[0] || null;
}

export async function deleteWritingTechnique(id: number) {
  const database = db();
  const result = await database.delete(writingTechniques).where(eq(writingTechniques.id, id)).returning();
  return result.length > 0;
}

export async function getTechniquesByStage(stage: string) {
  const database = db();
  return await database.select().from(writingTechniques)
    .where(and(eq(writingTechniques.stage, stage), eq(writingTechniques.isActive, true)))
    .orderBy(asc(writingTechniques.priority));
}

export async function getTechniquesForPrompt(stage: string) {
  const techniques = await getTechniquesByStage(stage);
  return techniques.map((t: { title: string; content: string; formulas: string | null; examples: string | null; checklists: string | null }) => ({
    title: t.title,
    content: t.content,
    formulas: t.formulas,
    examples: t.examples,
    checklists: t.checklists ? JSON.parse(t.checklists) as string[] : null,
  }));
}
