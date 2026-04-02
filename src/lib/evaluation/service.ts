export interface TopicEvaluation {
  id: string;
  title: string;
  description?: string;
  scores: {
    heat: number;
    novelty: number;
    competition: number;
    fit: number;
    total: number;
  };
  painPointLevel: 'survival' | 'relationship' | 'improvement' | 'entertainment';
  titleModel: 'benefit' | 'scenario' | 'trend';
  suggestions: string[];
  createdAt: Date;
}

export interface EvaluationCriteria {
  heat: {
    label: string;
    description: string;
    maxScore: number;
  };
  novelty: {
    label: string;
    description: string;
    maxScore: number;
  };
  competition: {
    label: string;
    description: string;
    maxScore: number;
  };
  fit: {
    label: string;
    description: string;
    maxScore: number;
  };
}

export const evaluationCriteria: EvaluationCriteria = {
  heat: {
    label: '热度',
    description: '话题的讨论热度和搜索量',
    maxScore: 25,
  },
  novelty: {
    label: '新颖度',
    description: '话题的新鲜程度和独特性',
    maxScore: 25,
  },
  competition: {
    label: '竞争度',
    description: '内容竞争激烈程度（分数越高越好，表示竞争越小）',
    maxScore: 25,
  },
  fit: {
    label: '调性匹配',
    description: '与账号定位和受众的匹配程度',
    maxScore: 25,
  },
};

export const painPointLevels = {
  survival: {
    label: '生存级痛点',
    description: '直接影响用户生存、健康、安全的需求',
    examples: ['健康问题', '财务危机', '职业生存', '安全威胁'],
    weight: 4,
  },
  relationship: {
    label: '关系级痛点',
    description: '影响用户社交关系、地位、认可的需求',
    examples: ['职场关系', '家庭矛盾', '社交焦虑', '身份认同'],
    weight: 3,
  },
  improvement: {
    label: '改善级痛点',
    description: '帮助用户提升效率、效果、体验的需求',
    examples: ['工作效率', '学习提升', '生活质量', '技能进阶'],
    weight: 2,
  },
  entertainment: {
    label: '娱乐级痛点',
    description: '满足用户娱乐、消遣、好奇的需求',
    examples: ['趣味内容', '八卦热点', '猎奇故事', '轻松段子'],
    weight: 1,
  },
};

export const titleModels = {
  benefit: {
    label: '利益型标题',
    description: '强调用户能获得的具体利益',
    templates: [
      '如何在{时间}内实现{目标}',
      '{数字}个方法帮你解决{问题}',
      '掌握这个技巧，{效果}',
      '不用{付出}也能{收益}',
    ],
  },
  scenario: {
    label: '场景型标题',
    description: '构建具体场景引发用户共鸣',
    templates: [
      '当你{场景}时，{解决方案}',
      '{人群}必看：{场景}的{数字}个真相',
      '从{起点}到{终点}，{过程}',
      '那些{场景}的人，后来都怎样了',
    ],
  },
  trend: {
    label: '趋势型标题',
    description: '借助热点或趋势吸引关注',
    templates: [
      '{热点}背后：{洞察}',
      '为什么{现象}越来越{趋势}',
      '{时间}最火的{领域}，都在做这件事',
      '读懂{趋势}，你就读懂了{领域}',
    ],
  },
};

export function evaluateTopic(
  title: string,
  description?: string,
  context?: {
    searchVolume?: number;
    recentArticles?: number;
    avgLikes?: number;
    accountTopics?: string[];
  }
): TopicEvaluation {
  const scores = {
    heat: evaluateHeat(title, context?.searchVolume),
    novelty: evaluateNovelty(title, description),
    competition: evaluateCompetition(context?.recentArticles, context?.avgLikes),
    fit: evaluateFit(title, context?.accountTopics),
    total: 0,
  };
  
  scores.total = scores.heat + scores.novelty + scores.competition + scores.fit;
  
  const painPointLevel = identifyPainPointLevel(title, description);
  const titleModel = identifyTitleModel(title);
  const suggestions = generateSuggestions(scores, painPointLevel, titleModel);
  
  return {
    id: generateId(),
    title,
    description,
    scores,
    painPointLevel: painPointLevel.level,
    titleModel,
    suggestions,
    createdAt: new Date(),
  };
}

function evaluateHeat(title: string, searchVolume?: number): number {
  let score = 10;
  
  const hotKeywords = ['AI', 'GPT', 'Claude', 'Cursor', '最新', '爆款', '揭秘', '必看', '干货'];
  const titleLower = title.toLowerCase();
  
  for (const keyword of hotKeywords) {
    if (titleLower.includes(keyword.toLowerCase())) {
      score += 3;
    }
  }
  
  if (searchVolume) {
    if (searchVolume > 10000) score += 10;
    else if (searchVolume > 5000) score += 7;
    else if (searchVolume > 1000) score += 5;
    else if (searchVolume > 100) score += 2;
  }
  
  return Math.min(score, 25);
}

function evaluateNovelty(title: string, description?: string): number {
  let score = 10;
  
  const commonPhrases = ['如何', '怎么', '为什么', '什么是', '教程', '入门'];
  let commonCount = 0;
  
  for (const phrase of commonPhrases) {
    if (title.includes(phrase)) commonCount++;
  }
  
  score -= commonCount * 2;
  
  const novelKeywords = ['首次', '独家', '揭秘', '新发现', '颠覆', '革命性', '前所未有'];
  for (const keyword of novelKeywords) {
    if (title.includes(keyword) || (description && description.includes(keyword))) {
      score += 5;
    }
  }
  
  if (/\d{4}年|\d{2}月|最新|今日|本周/.test(title)) {
    score += 3;
  }
  
  return Math.max(0, Math.min(score, 25));
}

function evaluateCompetition(recentArticles?: number, avgLikes?: number): number {
  let score = 15;
  
  if (recentArticles !== undefined) {
    if (recentArticles < 10) score += 10;
    else if (recentArticles < 50) score += 5;
    else if (recentArticles < 100) score += 0;
    else score -= 5;
  }
  
  if (avgLikes !== undefined) {
    if (avgLikes < 100) score += 5;
    else if (avgLikes < 500) score += 3;
    else if (avgLikes < 1000) score += 0;
    else score -= 3;
  }
  
  return Math.max(0, Math.min(score, 25));
}

function evaluateFit(title: string, accountTopics?: string[]): number {
  let score = 15;
  
  if (accountTopics && accountTopics.length > 0) {
    const titleLower = title.toLowerCase();
    let matchCount = 0;
    
    for (const topic of accountTopics) {
      if (titleLower.includes(topic.toLowerCase())) {
        matchCount++;
      }
    }
    
    score += matchCount * 3;
  }
  
  return Math.min(score, 25);
}

function identifyPainPointLevel(
  title: string,
  description?: string
): { level: TopicEvaluation['painPointLevel']; confidence: number } {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  const survivalKeywords = ['生存', '健康', '安全', '危机', '救命', '必须', '紧急', '致命'];
  const relationshipKeywords = ['关系', '社交', '职场', '家庭', '认可', '地位', '面子'];
  const improvementKeywords = ['提升', '效率', '优化', '进阶', '学习', '成长', '改善'];
  const entertainmentKeywords = ['有趣', '搞笑', '娱乐', '八卦', '猎奇', '轻松', '段子'];
  
  let survivalScore = 0;
  let relationshipScore = 0;
  let improvementScore = 0;
  let entertainmentScore = 0;
  
  for (const keyword of survivalKeywords) {
    if (text.includes(keyword)) survivalScore += 2;
  }
  
  for (const keyword of relationshipKeywords) {
    if (text.includes(keyword)) relationshipScore += 2;
  }
  
  for (const keyword of improvementKeywords) {
    if (text.includes(keyword)) improvementScore += 2;
  }
  
  for (const keyword of entertainmentKeywords) {
    if (text.includes(keyword)) entertainmentScore += 2;
  }
  
  const maxScore = Math.max(survivalScore, relationshipScore, improvementScore, entertainmentScore);
  
  if (maxScore === 0) {
    return { level: 'improvement', confidence: 0.5 };
  }
  
  if (survivalScore === maxScore) return { level: 'survival', confidence: survivalScore / 10 };
  if (relationshipScore === maxScore) return { level: 'relationship', confidence: relationshipScore / 10 };
  if (improvementScore === maxScore) return { level: 'improvement', confidence: improvementScore / 10 };
  return { level: 'entertainment', confidence: entertainmentScore / 10 };
}

function identifyTitleModel(title: string): TopicEvaluation['titleModel'] {
  const benefitPatterns = [/如何/, /方法/, /技巧/, /实现/, /获得/, /解决/];
  const scenarioPatterns = [/当你/, /如果/, /从.*到/, /那些.*的人/];
  const trendPatterns = [/趋势/, /背后/, /为什么.*越来越/, /读懂/];
  
  let benefitScore = 0;
  let scenarioScore = 0;
  let trendScore = 0;
  
  for (const pattern of benefitPatterns) {
    if (pattern.test(title)) benefitScore++;
  }
  
  for (const pattern of scenarioPatterns) {
    if (pattern.test(title)) scenarioScore++;
  }
  
  for (const pattern of trendPatterns) {
    if (pattern.test(title)) trendScore++;
  }
  
  const maxScore = Math.max(benefitScore, scenarioScore, trendScore);
  
  if (maxScore === 0) return 'benefit';
  
  if (benefitScore === maxScore) return 'benefit';
  if (scenarioScore === maxScore) return 'scenario';
  return 'trend';
}

function generateSuggestions(
  scores: TopicEvaluation['scores'],
  painPoint: { level: TopicEvaluation['painPointLevel']; confidence: number },
  titleModel: TopicEvaluation['titleModel']
): string[] {
  const suggestions: string[] = [];
  
  if (scores.heat < 15) {
    suggestions.push('💡 热度较低，建议结合当前热点话题或使用热门关键词');
  }
  
  if (scores.novelty < 15) {
    suggestions.push('💡 新颖度不足，建议添加独特视角或最新数据');
  }
  
  if (scores.competition < 15) {
    suggestions.push('💡 竞争激烈，建议寻找细分切入点或差异化表达');
  }
  
  if (scores.fit < 15) {
    suggestions.push('💡 与账号定位匹配度不高，建议调整选题方向');
  }
  
  if (painPoint.level === 'entertainment') {
    suggestions.push('⚠️ 属于娱乐级痛点，传播力强但用户粘性较弱');
  } else if (painPoint.level === 'survival') {
    suggestions.push('✅ 属于生存级痛点，用户需求强烈，建议深入挖掘');
  }
  
  if (titleModel === 'benefit') {
    suggestions.push('📝 当前为利益型标题，可尝试添加具体数字增强说服力');
  } else if (titleModel === 'scenario') {
    suggestions.push('📝 当前为场景型标题，可尝试添加情感共鸣点');
  } else {
    suggestions.push('📝 当前为趋势型标题，可尝试添加紧迫感词汇');
  }
  
  return suggestions;
}

function generateId(): string {
  return `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateTitleSuggestions(
  topic: string,
  model: TopicEvaluation['titleModel'],
  count: number = 3
): string[] {
  const templates = titleModels[model].templates;
  const suggestions: string[] = [];
  
  const placeholders: Record<string, string[]> = {
    '{时间}': ['一周', '一个月', '30天', '3个月'],
    '{目标}': ['涨粉1000', '收入翻倍', '效率提升50%', '掌握新技能'],
    '{数字}': ['3', '5', '7', '10'],
    '{问题}': ['时间不够用', '效率低下', '收入瓶颈', '技能焦虑'],
    '{效果}': ['效率翻倍', '收入提升', '粉丝暴涨', '认知升级'],
    '{付出}': ['花钱', '加班', '报班', '熬夜'],
    '{收益}': ['获得成功', '实现目标', '看到效果', '拿到结果'],
    '{场景}': ['面对选择', '感到迷茫', '想要改变', '遇到瓶颈'],
    '{解决方案}': ['试试这个方法', '看看这个思路', '这样做就对了'],
    '{人群}': ['职场人', '创业者', '学生党', '宝妈'],
    '{起点}': ['小白', '零基础', '入门'],
    '{终点}': ['高手', '专家', '大神'],
    '{过程}': ['只需这几步', '关键是这几点', '路径是这样的'],
    '{热点}': ['AI革命', '经济下行', '职场内卷'],
    '{洞察}': ['藏着这些机会', '意味着这些变化', '透露出这些信号'],
    '{现象}': ['年轻人', '打工人', '创业者'],
    '{趋势}': ['焦虑', '躺平', '内卷'],
    '{领域}': ['未来', '行业', '时代'],
  };
  
  for (let i = 0; i < count && i < templates.length; i++) {
    let title = templates[i];
    
    for (const [placeholder, values] of Object.entries(placeholders)) {
      if (title.includes(placeholder)) {
        title = title.replace(placeholder, values[Math.floor(Math.random() * values.length)]);
      }
    }
    
    title = title.replace(/{[^}]+}/g, topic);
    suggestions.push(title);
  }
  
  return suggestions;
}

export const painPointKeywords = {
  survival: {
    label: '生存级痛点',
    keywords: [
      '生存', '健康', '安全', '危机', '救命', '必须', '紧急', '致命',
      '疾病', '死亡', '破产', '失业', '负债', '压力', '焦虑症', '抑郁',
      '失眠', '过劳', '猝死', '癌症', '疫情', '灾难', '意外', '风险',
    ],
    questions: [
      '这个问题会威胁到用户的生存吗？',
      '用户是否面临健康或安全风险？',
      '这个问题是否紧急且必须解决？',
    ],
    examples: [
      '如何在经济下行期保住工作',
      '35岁危机：职场人的生存困境',
      '年轻人为什么不敢体检',
    ],
  },
  relationship: {
    label: '关系级痛点',
    keywords: [
      '关系', '社交', '职场', '家庭', '认可', '地位', '面子',
      '孤独', '被忽视', '被误解', '被排挤', '被歧视', '被否定',
      '亲子', '婚姻', '恋爱', '朋友', '同事', '领导', '客户',
    ],
    questions: [
      '这个问题影响用户的社会关系吗？',
      '用户是否担心被他人评判？',
      '这个问题涉及身份认同或社会地位吗？',
    ],
    examples: [
      '如何在职场中建立有效人脉',
      '为什么你总是被同事边缘化',
      '中年人的社交困境：朋友越来越少',
    ],
  },
  improvement: {
    label: '改善级痛点',
    keywords: [
      '提升', '效率', '优化', '进阶', '学习', '成长', '改善',
      '更好', '更快', '更省', '更简单', '更有效', '更专业',
      '技能', '方法', '技巧', '工具', '资源', '机会',
    ],
    questions: [
      '这个问题能帮助用户变得更好吗？',
      '用户是否想要提升某方面的能力？',
      '这个问题涉及效率或效果优化吗？',
    ],
    examples: [
      '如何用AI工具提升工作效率10倍',
      '从零开始学习编程的完整路线',
      '普通人如何实现财务自由',
    ],
  },
  entertainment: {
    label: '娱乐级痛点',
    keywords: [
      '有趣', '搞笑', '娱乐', '八卦', '猎奇', '轻松', '段子',
      '明星', '网红', '热点', '八卦', '吃瓜', '围观', '吐槽',
      '治愈', '解压', '放松', '消遣', '打发时间',
    ],
    questions: [
      '这个内容主要是为了娱乐吗？',
      '用户是否在寻求放松和解压？',
      '这个内容能引发好奇或讨论吗？',
    ],
    examples: [
      '那些年我们追过的网红，现在都怎样了',
      '全网最火的10个搞笑段子',
      '明星八卦：谁和谁在一起了',
    ],
  },
};

export function analyzePainPoints(title: string, description?: string): {
  primary: keyof typeof painPointKeywords;
  secondary?: keyof typeof painPointKeywords;
  matchedKeywords: string[];
  suggestions: string[];
} {
  const text = `${title} ${description || ''}`.toLowerCase();
  const matchedKeywords: string[] = [];
  const scores: Record<keyof typeof painPointKeywords, number> = {
    survival: 0,
    relationship: 0,
    improvement: 0,
    entertainment: 0,
  };
  
  for (const [level, data] of Object.entries(painPointKeywords)) {
    for (const keyword of data.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        scores[level as keyof typeof painPointKeywords] += 1;
        matchedKeywords.push(keyword);
      }
    }
  }
  
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const primary = sorted[0][0] as keyof typeof painPointKeywords;
  const secondary = sorted[1][1] > 0 ? sorted[1][0] as keyof typeof painPointKeywords : undefined;
  
  const suggestions: string[] = [];
  const primaryData = painPointKeywords[primary];
  
  suggestions.push(`📌 痛点层级：${primaryData.label}`);
  
  if (matchedKeywords.length > 0) {
    suggestions.push(`🔍 匹配关键词：${matchedKeywords.slice(0, 5).join('、')}`);
  }
  
  if (primaryData.questions.length > 0) {
    suggestions.push(`💡 思考问题：${primaryData.questions[0]}`);
  }
  
  if (primaryData.examples.length > 0) {
    suggestions.push(`📝 参考案例：${primaryData.examples[0]}`);
  }
  
  return {
    primary,
    secondary,
    matchedKeywords,
    suggestions,
  };
}
