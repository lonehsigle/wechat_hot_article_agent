import { describe, it, expect } from 'vitest';
import {
  evaluateTopic,
  generateTitleSuggestions,
  analyzePainPoints,
  evaluationCriteria,
  painPointKeywords,
} from '@/lib/evaluation/service';

describe('evaluation-service', () => {
  describe('evaluateTopic', () => {
    it('evaluates basic topic with default scores', () => {
      const result = evaluateTopic('测试标题');
      expect(result.title).toBe('测试标题');
      expect(result.scores.total).toBeGreaterThan(0);
      expect(result.scores.heat).toBeGreaterThanOrEqual(0);
      expect(result.scores.novelty).toBeGreaterThanOrEqual(0);
      expect(result.scores.competition).toBeGreaterThanOrEqual(0);
      expect(result.scores.fit).toBeGreaterThanOrEqual(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('boosts heat score with hot keywords and search volume', () => {
      const result = evaluateTopic('AI最新爆款揭秘', undefined, { searchVolume: 20000 });
      expect(result.scores.heat).toBe(25);
    });

    it('identifies pain point level from keywords', () => {
      const result = evaluateTopic('健康问题与职场生存');
      expect(result.painPointLevel).toBe('survival');
    });

    it('identifies title model', () => {
      const result = evaluateTopic('如何在30天内实现目标');
      expect(result.titleModel).toBe('benefit');
    });

    it('generates suggestions when scores are low', () => {
      const result = evaluateTopic('abc');
      expect(result.suggestions.some(s => s.includes('热度')) || result.suggestions.some(s => s.includes('低'))).toBeTruthy();
    });
  });

  describe('generateTitleSuggestions', () => {
    it('generates suggestions from templates', () => {
      const titles = generateTitleSuggestions('AI工具', 'benefit', 3);
      expect(titles.length).toBe(3);
      titles.forEach(t => {
        expect(typeof t).toBe('string');
        expect(t.length).toBeGreaterThan(0);
      });
    });

    it('does not exceed available templates', () => {
      const titles = generateTitleSuggestions('热点', 'trend', 10);
      expect(titles.length).toBeLessThanOrEqual(4);
    });
  });

  describe('analyzePainPoints', () => {
    it('identifies primary pain point', () => {
      const result = analyzePainPoints('健康危机与生存压力');
      expect(result.primary).toBe('survival');
      expect(result.matchedKeywords.length).toBeGreaterThan(0);
    });

    it('returns suggestions array', () => {
      const result = analyzePainPoints('工作效率提升方法');
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.primary).toBe('improvement');
    });

    it('handles empty text gracefully', () => {
      const result = analyzePainPoints('');
      expect(result.primary).toBeDefined();
      expect(result.matchedKeywords).toEqual([]);
    });
  });

  describe('constants', () => {
    it('evaluationCriteria has required keys', () => {
      expect(evaluationCriteria.heat).toBeDefined();
      expect(evaluationCriteria.novelty).toBeDefined();
      expect(evaluationCriteria.competition).toBeDefined();
      expect(evaluationCriteria.fit).toBeDefined();
    });

    it('painPointKeywords has all levels', () => {
      expect(painPointKeywords.survival).toBeDefined();
      expect(painPointKeywords.relationship).toBeDefined();
      expect(painPointKeywords.improvement).toBeDefined();
      expect(painPointKeywords.entertainment).toBeDefined();
    });
  });
});
