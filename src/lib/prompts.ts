// Prompts 配置
// 注意：实际 prompt 模板已拆分到 /src/lib/prompts/ 目录
// 此文件重新导出所有 prompt 以保持向后兼容

export { DEFAULT_PROMPTS, articlePrompts, titlePrompts, aiDetectionPrompts, analysisPrompts } from './prompts/index';

import { DEFAULT_PROMPTS } from './prompts/index';
import { db } from './db';
import { promptConfigs } from './db/schema';
import { eq } from 'drizzle-orm';

export interface PromptConfig {
  name: string;
  description: string;
  template: string;
}

let initialized = false;

export async function initializePrompts(): Promise<void> {
  if (initialized) return;
  
  try {
    const existingPrompts = await db().select().from(promptConfigs);
    const existingKeys = new Set(existingPrompts.map(p => p.key));
    
    for (const [key, config] of Object.entries(DEFAULT_PROMPTS)) {
      if (!existingKeys.has(key)) {
        await db().insert(promptConfigs).values({
          key,
          name: config.name,
          description: config.description,
          template: config.template,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        await db().update(promptConfigs)
          .set({ 
            name: config.name,
            description: config.description,
            template: config.template,
            updatedAt: new Date() 
          })
          .where(eq(promptConfigs.key, key));
      }
    }

    initialized = true;
  } catch (error) {
    console.error('[Prompts] Failed to initialize prompts:', error);
  }
}

export async function getPromptTemplate(key: string): Promise<string> {
  await initializePrompts();
  
  try {
    const result = await db().select().from(promptConfigs).where(eq(promptConfigs.key, key));
    if (result.length > 0 && result[0].template) {
      return result[0].template;
    }
  } catch (error) {
    console.error(`[Prompts] Failed to get prompt "${key}":`, error);
  }
  
  return DEFAULT_PROMPTS[key]?.template || '';
}

export function getPromptTemplateSync(key: string): string {
  return DEFAULT_PROMPTS[key]?.template || '';
}

export async function updatePromptTemplate(key: string, template: string): Promise<boolean> {
  await initializePrompts();
  
  try {
    const existing = await db().select().from(promptConfigs).where(eq(promptConfigs.key, key));
    
    if (existing.length > 0) {
      await db().update(promptConfigs)
        .set({ template, updatedAt: new Date() })
        .where(eq(promptConfigs.key, key));
      return true;
    } else if (DEFAULT_PROMPTS[key]) {
      await db().insert(promptConfigs).values({
        key,
        name: DEFAULT_PROMPTS[key].name,
        description: DEFAULT_PROMPTS[key].description,
        template,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return true;
    }
  } catch (error) {
    console.error(`[Prompts] Failed to update prompt "${key}":`, error);
  }
  
  return false;
}

export async function getAllPrompts(): Promise<Array<{ key: string; name: string; description: string; template: string }>> {
  await initializePrompts();
  
  try {
    const prompts = await db().select().from(promptConfigs);
    return prompts.map(p => ({
      key: p.key,
      name: p.name,
      description: p.description || '',
      template: p.template,
    }));
  } catch (error) {
    console.error('[Prompts] Failed to get all prompts:', error);
    return Object.entries(DEFAULT_PROMPTS).map(([key, value]) => ({
      key,
      ...value,
    }));
  }
}
