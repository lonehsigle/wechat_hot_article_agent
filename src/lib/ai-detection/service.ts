export interface AIPattern {
  id: number;
  name: string;
  nameZh: string;
  category: 'content' | 'language' | 'style' | 'communication' | 'filler';
  description: string;
  signals: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface QualityScore {
  directness: number;
  rhythm: number;
  trust: number;
  authenticity: number;
  conciseness: number;
  total: number;
}

export interface AICheckResult {
  score: number;
  qualityScore: QualityScore;
  detectedPatterns: Array<{
    pattern: AIPattern;
    matches: string[];
    count: number;
  }>;
  issues: string[];
  suggestions: string[];
  highlightedParts: Array<{
    text: string;
    issue: string;
    patternId: number;
  }>;
  passed: boolean;
}

export const AI_PATTERNS: AIPattern[] = [
  {
    id: 1,
    name: 'significance_inflation',
    nameZh: '意义膨胀',
    category: 'content',
    description: 'LLM夸大普通事物的重要性，使用关于遗产、演变和更广泛趋势的说法',
    signals: ['pivotal moment', 'testament to', 'vital role', 'crucial role', 'significant role', 'evolving landscape', 'setting the stage for', 'indelible mark', 'deeply rooted', 'shaping the future', '关键时刻', '重要意义', '深远影响', '里程碑'],
    severity: 'high',
  },
  {
    id: 2,
    name: 'notability_name_dropping',
    nameZh: '名人提及',
    category: 'content',
    description: '列出媒体名称来声称重要性，而没有提供具体主张或背景',
    signals: ['cited in', 'featured in', 'mentioned in', 'active social media presence', 'written by a leading expert', '被引用', '被报道', '活跃的社交媒体'],
    severity: 'medium',
  },
  {
    id: 3,
    name: 'superficial_ing_analyses',
    nameZh: '表面分析',
    category: 'content',
    description: 'AI在句子末尾添加现在分词短语来假装分析深度',
    signals: ['highlighting', 'underscoring', 'emphasizing', 'ensuring', 'reflecting', 'symbolizing', 'contributing to', 'cultivating', 'fostering', 'encompassing', 'showcasing', '从而', '进而', '进一步'],
    severity: 'medium',
  },
  {
    id: 4,
    name: 'promotional_language',
    nameZh: '促销语言',
    category: 'content',
    description: '旅游手册式的语言，听起来像广告文案而非中性描述',
    signals: ['nestled', 'breathtaking', 'stunning', 'renowned', 'groundbreaking', 'must-visit', 'in the heart of', 'rich cultural heritage', 'world-class', 'unparalleled', '令人惊叹', '世界级', '必去', '绝美'],
    severity: 'medium',
  },
  {
    id: 5,
    name: 'vague_attributions',
    nameZh: '模糊归因',
    category: 'content',
    description: '将主张归因于未具名的专家、研究或报告而非具体来源',
    signals: ['Experts believe', 'Industry reports suggest', 'Studies show', 'Observers have noted', 'widely regarded', '专家认为', '研究表明', '据报道', '众所周知'],
    severity: 'high',
  },
  {
    id: 6,
    name: 'formulaic_challenges',
    nameZh: '公式化挑战',
    category: 'content',
    description: '套话式的"尽管有挑战"部分，遵循可预测的模板',
    signals: ['Despite its challenges', 'continues to thrive', 'future outlook remains', 'challenges typical of', '尽管面临挑战', '仍然蓬勃发展', '未来展望'],
    severity: 'medium',
  },
  {
    id: 7,
    name: 'ai_vocabulary',
    nameZh: 'AI词汇',
    category: 'language',
    description: '在AI生成文本中出现频率远高于人类写作的词汇',
    signals: ['additionally', 'delve', 'tapestry', 'testament', 'underscore', 'pivotal', 'landscape', 'intricate', 'intricacies', 'showcasing', 'fostering', 'garner', 'interplay', 'enduring', 'vibrant', 'crucial', 'enhance', 'furthermore', 'moreover', 'notably', 'comprehensive', 'multifaceted', 'nuanced', 'paradigm', 'transformative', 'leveraging', 'synergy', 'holistic', 'robust', 'streamline', 'utilize', 'facilitate', 'elucidate', 'encompassing', 'cornerstone', 'reimagine', 'empower', 'harness', 'navigate', 'realm', 'poised', 'myriad', '此外', '综上所述', '总而言之', '值得注意的是'],
    severity: 'high',
  },
  {
    id: 8,
    name: 'copula_avoidance',
    nameZh: '系词回避',
    category: 'language',
    description: '使用复杂的结构代替简单的"是"或"有"',
    signals: ['serves as', 'stands as', 'functions as', 'boasts', 'features', '作为', '具有', '拥有'],
    severity: 'low',
  },
  {
    id: 9,
    name: 'negative_parallelisms',
    nameZh: '负面平行',
    category: 'language',
    description: '"不只是X，而是Y"和"不仅X而且Y"——过度使用的修辞框架',
    signals: ['not just', 'it\'s', 'not merely', 'not only', 'but also', '不只是', '不仅仅是', '不仅', '而且'],
    severity: 'medium',
  },
  {
    id: 10,
    name: 'rule_of_three',
    nameZh: '三规则',
    category: 'language',
    description: '强迫将想法分成三组以听起来全面',
    signals: ['innovation, inspiration, and industry insights', '三个', '三个方面', '三个步骤', '三个要点'],
    severity: 'low',
  },
  {
    id: 11,
    name: 'synonym_cycling',
    nameZh: '同义词循环',
    category: 'language',
    description: '在连续的句子中用不同的名称指代同一事物',
    signals: [],
    severity: 'low',
  },
  {
    id: 12,
    name: 'false_ranges',
    nameZh: '假范围',
    category: 'language',
    description: '"从X到Y"，其中X和Y不在有意义的尺度上',
    signals: ['from', 'to', '从', '到'],
    severity: 'low',
  },
  {
    id: 13,
    name: 'em_dash_overuse',
    nameZh: '破折号过度',
    category: 'style',
    description: 'LLM使用破折号比人类多，模仿有力的销售写作',
    signals: ['—', '——'],
    severity: 'low',
  },
  {
    id: 14,
    name: 'boldface_overuse',
    nameZh: '粗体过度',
    category: 'style',
    description: '在整个文本中机械地强调粗体短语',
    signals: ['**', '**'],
    severity: 'low',
  },
  {
    id: 15,
    name: 'inline_header_lists',
    nameZh: '内联标题列表',
    category: 'style',
    description: '列表项以粗体标题和冒号开头，通常重复标题词',
    signals: [':'],
    severity: 'low',
  },
  {
    id: 16,
    name: 'title_case_headings',
    nameZh: '标题大小写',
    category: 'style',
    description: '在标题中每个主要单词都大写',
    signals: [],
    severity: 'low',
  },
  {
    id: 17,
    name: 'emoji_overuse',
    nameZh: '表情符号过度',
    category: 'style',
    description: '在专业文本中用表情符号装饰标题或项目符号',
    signals: ['🚀', '💡', '✨', '🎯', '📈', '🔥', '💪', '👍', '❤️', '🎉'],
    severity: 'low',
  },
  {
    id: 18,
    name: 'curly_quotes',
    nameZh: '弯引号',
    category: 'style',
    description: 'ChatGPT使用Unicode弯引号而不是直引号',
    signals: ['\u201c', '\u201d', '\u2018', '\u2019'],
    severity: 'low',
  },
  {
    id: 19,
    name: 'chatbot_artifacts',
    nameZh: '聊天机器人痕迹',
    category: 'communication',
    description: '粘贴到内容中的聊天机器人对话残留短语',
    signals: ['I hope this helps!', 'Let me know if', 'Here is an overview', 'Of course!', 'Certainly!', 'I\'d be happy to', '希望这有帮助', '如果您需要', '当然', '我很乐意'],
    severity: 'high',
  },
  {
    id: 20,
    name: 'cutoff_disclaimers',
    nameZh: '截止免责声明',
    category: 'communication',
    description: '文本中残留的AI知识截止免责声明',
    signals: ['As of my last training', 'While specific details are limited', 'Based on available information', '截至我最后的训练', '具体细节有限', '根据现有信息'],
    severity: 'high',
  },
  {
    id: 21,
    name: 'sycophantic_tone',
    nameZh: '谄媚语气',
    category: 'communication',
    description: '过度积极、讨好他人的语言',
    signals: ['Great question!', 'You\'re absolutely right!', 'That\'s an excellent point!', '好问题！', '您说得对！', '这是一个很好的观点！'],
    severity: 'medium',
  },
  {
    id: 22,
    name: 'filler_phrases',
    nameZh: '填充短语',
    category: 'filler',
    description: '可以缩短的冗长短语',
    signals: ['In order to', 'Due to the fact that', 'At this point in time', 'In the event that', 'Has the ability to', 'It is important to note that', 'When it comes to', 'For the purpose of', 'First and foremost', '为了', '由于', '在此时', '如果', '能够', '值得注意的是', '关于', '首先'],
    severity: 'medium',
  },
  {
    id: 23,
    name: 'excessive_hedging',
    nameZh: '过度模糊',
    category: 'filler',
    description: '堆叠限定词而不是做出承诺',
    signals: ['could potentially possibly', 'might have some effect', '可能可能', '或许会有'],
    severity: 'medium',
  },
  {
    id: 24,
    name: 'generic_conclusions',
    nameZh: '通用结论',
    category: 'filler',
    description: '什么都没说的模糊积极结尾',
    signals: ['The future looks bright', 'Exciting times lie ahead', 'journey toward excellence', 'poised for growth', 'the possibilities are endless', '未来一片光明', '激动人心的时刻', '追求卓越的旅程', '无限可能'],
    severity: 'medium',
  },
];

export function detectAIPatterns(content: string): AICheckResult {
  const detectedPatterns: Array<{
    pattern: AIPattern;
    matches: string[];
    count: number;
  }> = [];

  const highlightedParts: Array<{
    text: string;
    issue: string;
    patternId: number;
  }> = [];

  const issues: string[] = [];
  const suggestions: string[] = [];

  for (const pattern of AI_PATTERNS) {
    const matches: string[] = [];
    
    for (const signal of pattern.signals) {
      const regex = new RegExp(signal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const found = content.match(regex);
      if (found) {
        matches.push(...found);
      }
    }

    if (matches.length > 0) {
      detectedPatterns.push({
        pattern,
        matches: [...new Set(matches)],
        count: matches.length,
      });

      const uniqueMatches = [...new Set(matches)];
      for (const match of uniqueMatches.slice(0, 3)) {
        highlightedParts.push({
          text: match,
          issue: `${pattern.nameZh}：${pattern.description}`,
          patternId: pattern.id,
        });
      }

      if (pattern.severity === 'high') {
        issues.push(`发现"${pattern.nameZh}"问题（${matches.length}处）：${pattern.description}`);
      }
    }
  }

  const highSeverityCount = detectedPatterns.filter(d => d.pattern.severity === 'high').length;
  const mediumSeverityCount = detectedPatterns.filter(d => d.pattern.severity === 'medium').length;
  const lowSeverityCount = detectedPatterns.filter(d => d.pattern.severity === 'low').length;

  const highSeverityMatches = detectedPatterns
    .filter(d => d.pattern.severity === 'high')
    .reduce((sum, d) => sum + d.count, 0);
  const mediumSeverityMatches = detectedPatterns
    .filter(d => d.pattern.severity === 'medium')
    .reduce((sum, d) => sum + d.count, 0);
  const lowSeverityMatches = detectedPatterns
    .filter(d => d.pattern.severity === 'low')
    .reduce((sum, d) => sum + d.count, 0);

  let aiScore = 100;
  aiScore -= highSeverityMatches * 8;
  aiScore -= mediumSeverityMatches * 4;
  aiScore -= lowSeverityMatches * 2;
  aiScore = Math.max(0, Math.min(100, aiScore));

  const qualityScore = calculateQualityScore(content, detectedPatterns);
  
  const finalScore = aiScore;

  if (detectedPatterns.length === 0) {
    suggestions.push('文章看起来很自然，没有明显的AI痕迹');
  } else {
    if (highSeverityCount > 0) {
      suggestions.push('建议重点修改高严重性问题：删除模糊归因、意义膨胀等AI典型表达');
    }
    if (mediumSeverityCount > 0) {
      suggestions.push('建议优化中等严重性问题：使用更具体的表达替代模板化语言');
    }
    suggestions.push('增加个人故事和口语化表达，让文章更有"人味"');
    suggestions.push('变化句子长度，避免每段都一样长');
    suggestions.push('删除填充短语，直接陈述事实');
  }

  const passed = finalScore >= 80;

  return {
    score: finalScore,
    qualityScore,
    detectedPatterns,
    issues,
    suggestions,
    highlightedParts,
    passed,
  };
}

function calculateQualityScore(
  content: string,
  detectedPatterns: Array<{ pattern: AIPattern; matches: string[]; count: number }>
): QualityScore {
  const sentences = content.split(/[。！？.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);

  let directness = 10;
  let rhythm = 10;
  let trust = 10;
  let authenticity = 10;
  let conciseness = 10;

  const fillerPatterns = detectedPatterns.filter(d => d.pattern.category === 'filler');
  directness -= Math.min(10, fillerPatterns.length * 3);

  if (sentences.length > 5) {
    const lengths = sentences.map(s => s.length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
    
    if (variance < 100) {
      rhythm -= 3;
    }
    if (variance < 50) {
      rhythm -= 3;
    }
  }

  const vaguePatterns = detectedPatterns.filter(d => 
    d.pattern.id === 5 || d.pattern.id === 20 || d.pattern.id === 23
  );
  trust -= Math.min(10, vaguePatterns.length * 4);

  const hasPersonalStory = /我|我们|我的|我们的|曾经|那时候|记得|回忆/.test(content);
  const hasEmotionWords = /真的|特别|超级|非常|太|好|感动|崩溃|惊喜|无语|心疼/.test(content);
  const hasColloquial = /其实|说实话|怎么说呢|你知道吗|简单来说|说白了/.test(content);
  
  if (!hasPersonalStory) authenticity -= 3;
  if (!hasEmotionWords) authenticity -= 2;
  if (!hasColloquial) authenticity -= 2;

  const avgSentenceLength = content.length / Math.max(1, sentences.length);
  if (avgSentenceLength > 50) {
    conciseness -= 3;
  }
  if (avgSentenceLength > 80) {
    conciseness -= 3;
  }

  const contentPatterns = detectedPatterns.filter(d => d.pattern.category === 'content');
  conciseness -= Math.min(5, contentPatterns.length * 2);

  directness = Math.max(0, Math.min(10, directness));
  rhythm = Math.max(0, Math.min(10, rhythm));
  trust = Math.max(0, Math.min(10, trust));
  authenticity = Math.max(0, Math.min(10, authenticity));
  conciseness = Math.max(0, Math.min(10, conciseness));

  const total = Math.round((directness + rhythm + trust + authenticity + conciseness) * 2);

  return {
    directness,
    rhythm,
    trust,
    authenticity,
    conciseness,
    total,
  };
}

export function getHumanizationSuggestions(result: AICheckResult): string[] {
  const suggestions: string[] = [];

  if (result.qualityScore.authenticity < 7) {
    suggestions.push('增加个人故事：分享你自己的经历或观察');
    suggestions.push('使用口语化表达：如"其实"、"说实话"、"你知道吗"');
  }

  if (result.qualityScore.rhythm < 7) {
    suggestions.push('变化句子长度：短句和长句交替使用');
    suggestions.push('适当留白：分段让读者有喘息空间');
  }

  if (result.qualityScore.directness < 7) {
    suggestions.push('删除填充短语：直接陈述事实');
    suggestions.push('简化表达：用"因为"代替"由于...的原因"');
  }

  if (result.qualityScore.trust < 7) {
    suggestions.push('使用具体来源：引用具体的研究、数据或专家');
    suggestions.push('避免模糊表达：用具体数字代替"很多"、"一些"');
  }

  if (result.qualityScore.conciseness < 7) {
    suggestions.push('精简句子：删除不必要的修饰词');
    suggestions.push('一句话只说一件事');
  }

  const highSeverityPatterns = result.detectedPatterns.filter(d => d.pattern.severity === 'high');
  for (const dp of highSeverityPatterns) {
    suggestions.push(`解决"${dp.pattern.nameZh}"：${dp.pattern.description}`);
  }

  return [...new Set(suggestions)];
}

export function checkPublishReadiness(result: AICheckResult): {
  ready: boolean;
  message: string;
  requiredActions: string[];
} {
  const requiredActions: string[] = [];

  if (result.score < 80) {
    requiredActions.push(`AI味评分${result.score}分，需要达到80分以上（分数越高=AI味越低）`);
  }

  if (result.qualityScore.authenticity < 6) {
    requiredActions.push('真实性评分过低，需要增加个人故事和口语化表达');
  }

  const highSeverityCount = result.detectedPatterns.filter(d => d.pattern.severity === 'high').length;
  if (highSeverityCount > 0) {
    requiredActions.push(`存在${highSeverityCount}个高严重性问题需要修复`);
  }

  const ready = requiredActions.length === 0;

  let message = '';
  if (ready) {
    message = '文章已通过质量检查，可以发布';
  } else {
    message = `文章未通过质量检查，需要修复${requiredActions.length}个问题`;
  }

  return {
    ready,
    message,
    requiredActions,
  };
}
