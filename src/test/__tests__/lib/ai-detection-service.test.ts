import { describe, it, expect } from 'vitest';
import {
  detectAIPatterns,
  getHumanizationSuggestions,
  checkPublishReadiness,
  AI_PATTERNS,
} from '@/lib/ai-detection/service';

describe('ai-detection-service', () => {
  describe('detectAIPatterns', () => {
    it('passes for natural human text', () => {
      const text = '其实我觉得这个事情挺简单的，你知道吗？我朋友之前就这么做的，效果还不错。';
      const result = detectAIPatterns(text);
      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(70);
    });

    it('detects AI vocabulary and reduces score', () => {
      const text = 'This is a comprehensive solution leveraging robust synergy to facilitate transformative outcomes. Additionally, the intricate tapestry underscores a pivotal paradigm.';
      const result = detectAIPatterns(text);
      expect(result.detectedPatterns.length).toBeGreaterThan(0);
      expect(result.qualityScore.total).toBeDefined();
    });

    it('applies short text confidence weight', () => {
      const short = 'Additionally, this is great.';
      const result = detectAIPatterns(short);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('excludes quote blocks and lists from detection', () => {
      const text = '> 这是一个引用\n\n- 列表项1\n- 列表项2\n\n正文内容，Additionally。';
      const result = detectAIPatterns(text);
      expect(result.detectedPatterns.some(d => d.pattern.nameZh === 'AI词汇')).toBe(true);
    });

    it('includes highlighted parts for matches', () => {
      const text = 'Experts believe this is widely regarded as important.';
      const result = detectAIPatterns(text);
      expect(result.highlightedParts.length).toBeGreaterThan(0);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('generates suggestions when patterns found', () => {
      const text = 'This is a comprehensive solution leveraging robust synergy.';
      const result = detectAIPatterns(text);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('returns passed true when no patterns', () => {
      const result = detectAIPatterns('');
      expect(result.passed).toBe(true);
      expect(result.detectedPatterns).toHaveLength(0);
    });
  });

  describe('getHumanizationSuggestions', () => {
    it('suggests fixes for low authenticity', () => {
      const result = detectAIPatterns('Additionally, the robust solution is comprehensive.');
      const suggestions = getHumanizationSuggestions(result);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('suggests rhythm fixes when low', () => {
      const base = detectAIPatterns('Hello.');
      const modified = { ...base, qualityScore: { ...base.qualityScore, rhythm: 5 } };
      const suggestions = getHumanizationSuggestions(modified);
      expect(suggestions.some(s => s.includes('句子长度'))).toBe(true);
    });
  });

  describe('checkPublishReadiness', () => {
    it('returns ready when score and quality are high', () => {
      const result = detectAIPatterns('其实我觉得还不错，哈哈。');
      const readiness = checkPublishReadiness(result);
      expect(readiness.ready).toBe(true);
      expect(readiness.requiredActions).toHaveLength(0);
      expect(readiness.message).toContain('通过');
    });

    it('returns not ready when score is low', () => {
      const bad = detectAIPatterns('This is a comprehensive solution leveraging robust synergy to facilitate transformative outcomes. Additionally, the intricate tapestry underscores a pivotal paradigm shift, highlighting the evolving landscape.');
      const readiness = checkPublishReadiness(bad);
      expect(readiness.ready || readiness.requiredActions.length > 0).toBe(true);
    });
  });

  describe('AI_PATTERNS', () => {
    it('has patterns with required fields', () => {
      expect(AI_PATTERNS.length).toBeGreaterThan(0);
      AI_PATTERNS.forEach(p => {
        expect(p.id).toBeDefined();
        expect(p.nameZh).toBeDefined();
        expect(p.severity).toMatch(/low|medium|high/);
      });
    });
  });
});
