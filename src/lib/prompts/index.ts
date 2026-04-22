// Prompts 模块
// 重导出所有 prompt 配置，保持向后兼容

export { articlePrompts } from './article-prompts';
export { titlePrompts } from './title-prompts';
export { aiDetectionPrompts } from './ai-detection-prompts';
export { analysisPrompts } from './analysis-prompts';

// 统一导出为 DEFAULT_PROMPTS（向后兼容）
import { articlePrompts } from './article-prompts';
import { titlePrompts } from './title-prompts';
import { aiDetectionPrompts } from './ai-detection-prompts';
import { analysisPrompts } from './analysis-prompts';

export const DEFAULT_PROMPTS: Record<string, { name: string; description: string; template: string }> = {
  ...articlePrompts,
  ...titlePrompts,
  ...aiDetectionPrompts,
  ...analysisPrompts,
};
