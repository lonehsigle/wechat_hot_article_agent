import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { layoutStyles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { callLLM } from '@/lib/llm/service';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

interface StyleAnalysis {
  titleStyle: {
    type: 'question' | 'number' | 'emotional' | 'howto' | 'list' | 'story' | 'other';
    description: string;
  };
  paragraphStyle: {
    averageLength: number;
    shortSentenceRatio: number;
    structure: 'short' | 'medium' | 'long' | 'mixed';
  };
  languageStyle: {
    formality: 'formal' | 'semi-formal' | 'casual';
    emotionalTone: 'neutral' | 'positive' | 'negative' | 'mixed';
    emojiUsage: 'none' | 'rare' | 'moderate' | 'frequent';
  };
  contentStructure: {
    hasOpening: boolean;
    hasClosing: boolean;
    useList: boolean;
    useQuote: boolean;
    useBold: boolean;
    sectionCount: number;
  };
  vocabulary: {
    topWords: string[];
    catchphrases: string[];
    connectorWords: string[];
  };
  writingTechniques: {
    storytelling: boolean;
    dataCitation: boolean;
    questionHook: boolean;
    callToAction: boolean;
    contrastTechnique: boolean;
  };
}

const STYLE_ANALYSIS_PROMPT = `你是一位专业的文章风格分析师，擅长深度分析文章的写作风格、语言特点和表达技巧。

请分析以下文章的风格特征，返回JSON格式的分析结果。

【文章标题】
{title}

【文章内容】
{content}

请返回以下JSON格式：
{
  "titleStyle": {
    "type": "question|number|emotional|howto|list|story|other",
    "description": "标题风格的具体描述（10-20字）"
  },
  "paragraphStyle": {
    "averageLength": 平均段落字数(数字),
    "shortSentenceRatio": 短句占比(0-1之间的小数),
    "structure": "short|medium|long|mixed"
  },
  "languageStyle": {
    "formality": "formal|semi-formal|casual",
    "emotionalTone": "neutral|positive|negative|mixed",
    "emojiUsage": "none|rare|moderate|frequent"
  },
  "contentStructure": {
    "hasOpening": 是否有开场白(true/false),
    "hasClosing": 是否有结尾总结(true/false),
    "useList": 是否使用列表(true/false),
    "useQuote": 是否使用引用(true/false),
    "useBold": 是否使用强调(true/false),
    "sectionCount": 章节数量(数字)
  },
  "vocabulary": {
    "topWords": ["高频词1", "高频词2", "高频词3", "高频词4", "高频5"],
    "catchphrases": ["特色表达1", "特色表达2"],
    "connectorWords": ["连接词1", "连接词2"]
  },
  "writingTechniques": {
    "storytelling": 是否使用故事叙述(true/false),
    "dataCitation": 是否引用数据(true/false),
    "questionHook": 是否使用问题引导(true/false),
    "callToAction": 是否有行动号召(true/false),
    "contrastTechnique": 是否使用对比手法(true/false)
  },
  "styleSummary": "整体风格总结（50字以内）",
  "keyFeatures": ["核心特征1", "核心特征2", "核心特征3"],
  "suggestedName": "建议的风格名称（如：情感式-口语化-短段落风格）",
  "suggestedDescription": "建议的风格描述（100字以内）"
}

分析要点：
1. 标题风格：疑问式、数字式、情感式、教程式、故事式、列表式等
2. 段落结构：短段落（<50字）、中等段落（50-150字）、长段落（>150字）
3. 语言风格：正式/半正式/口语化，情感基调，表情符号使用
4. 写作技巧：故事叙述、数据支撑、问题引导、行动号召、对比论证
5. 词汇特征：高频词、特色表达、连接词使用

请确保返回的是纯JSON格式，不要有其他文字。`;

async function analyzeArticleStyleWithLLM(title: string, content: string): Promise<StyleAnalysis & { styleSummary: string; keyFeatures: string[]; suggestedName: string; suggestedDescription: string }> {
  const prompt = STYLE_ANALYSIS_PROMPT
    .replace('{title}', title)
    .replace('{content}', content.substring(0, 3000));
  
  try {
    const response = await callLLM([
      { role: 'user', content: prompt }
    ], { temperature: 0.3 });
    
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        titleStyle: parsed.titleStyle || { type: 'other', description: '常规风格' },
        paragraphStyle: parsed.paragraphStyle || { averageLength: 100, shortSentenceRatio: 0.5, structure: 'medium' },
        languageStyle: parsed.languageStyle || { formality: 'semi-formal', emotionalTone: 'neutral', emojiUsage: 'none' },
        contentStructure: parsed.contentStructure || { hasOpening: false, hasClosing: false, useList: false, useQuote: false, useBold: false, sectionCount: 1 },
        vocabulary: parsed.vocabulary || { topWords: [], catchphrases: [], connectorWords: [] },
        writingTechniques: parsed.writingTechniques || { storytelling: false, dataCitation: false, questionHook: false, callToAction: false, contrastTechnique: false },
        styleSummary: parsed.styleSummary || '常规公众号文章风格',
        keyFeatures: parsed.keyFeatures || ['结构清晰', '内容完整'],
        suggestedName: parsed.suggestedName || '常规风格',
        suggestedDescription: parsed.suggestedDescription || '适合常规公众号文章的风格',
      };
    }
  } catch (error) {
    console.error('LLM analysis error:', error);
  }
  
  return {
    titleStyle: { type: 'other', description: '常规风格' },
    paragraphStyle: { averageLength: 100, shortSentenceRatio: 0.5, structure: 'medium' },
    languageStyle: { formality: 'semi-formal', emotionalTone: 'neutral', emojiUsage: 'none' },
    contentStructure: { hasOpening: false, hasClosing: false, useList: false, useQuote: false, useBold: false, sectionCount: 1 },
    vocabulary: { topWords: [], catchphrases: [], connectorWords: [] },
    writingTechniques: { storytelling: false, dataCitation: false, questionHook: false, callToAction: false, contrastTechnique: false },
    styleSummary: '常规公众号文章风格',
    keyFeatures: ['结构清晰', '内容完整'],
    suggestedName: '常规风格',
    suggestedDescription: '适合常规公众号文章的风格',
  };
}

function mapToLayoutStyleConfig(analysis: StyleAnalysis): {
  headerStyle: string;
  paragraphSpacing: string;
  listStyle: string;
  highlightStyle: string;
  emojiUsage: string;
  quoteStyle: string;
  imagePosition: string;
  calloutStyle: string;
  colorScheme: string;
  fontStyle: string;
} {
  let headerStyle = 'bold';
  if (analysis.titleStyle.type === 'emotional' || analysis.titleStyle.type === 'story') {
    headerStyle = 'highlight';
  } else if (analysis.titleStyle.type === 'howto' || analysis.titleStyle.type === 'list') {
    headerStyle = 'underline';
  }
  
  let paragraphSpacing = 'medium';
  if (analysis.paragraphStyle.structure === 'short') {
    paragraphSpacing = 'compact';
  } else if (analysis.paragraphStyle.structure === 'long') {
    paragraphSpacing = 'loose';
  }
  
  let listStyle = 'number';
  if (analysis.contentStructure.useList) {
    listStyle = 'bullet';
  }
  
  let colorScheme = 'default';
  if (analysis.languageStyle.emotionalTone === 'positive') {
    colorScheme = 'warm';
  } else if (analysis.languageStyle.formality === 'formal') {
    colorScheme = 'cool';
  }
  
  return {
    headerStyle,
    paragraphSpacing,
    listStyle,
    highlightStyle: 'background',
    emojiUsage: analysis.languageStyle.emojiUsage,
    quoteStyle: analysis.contentStructure.useQuote ? 'block' : 'line',
    imagePosition: 'center',
    calloutStyle: 'box',
    colorScheme,
    fontStyle: analysis.languageStyle.formality === 'formal' ? 'serif' : 'sans-serif',
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, title, content, styleName, saveToDb } = body;

    if (action === 'analyze') {
      if (!title || !content) {
        return NextResponse.json({ success: false, error: '缺少标题或内容' }, { status: 400 });
      }

      const analysis = await analyzeArticleStyleWithLLM(title, content);
      
      if (saveToDb) {
        const name = styleName || analysis.suggestedName;
        const description = analysis.suggestedDescription;
        const styleConfig = mapToLayoutStyleConfig(analysis);
        
        const database = db();
        const existingStyles = await database.select().from(layoutStyles);
        const existingNames = existingStyles.map((s: { name: string }) => s.name);
        
        let finalName = name;
        let counter = 1;
        while (existingNames.includes(finalName)) {
          finalName = `${name} ${counter}`;
          counter++;
        }
        
        const [newStyle] = await database.insert(layoutStyles).values({
          name: finalName,
          description,
          ...styleConfig,
        }).returning();
        
        return NextResponse.json({
          success: true,
          analysis,
          savedStyle: newStyle,
        });
      }
      
      return NextResponse.json({
        success: true,
        analysis,
        suggestedName: analysis.suggestedName,
        suggestedDescription: analysis.suggestedDescription,
        styleConfig: mapToLayoutStyleConfig(analysis),
      });
    }

    if (action === 'list') {
      const database = db();
      const styles = await database.select().from(layoutStyles);
      return NextResponse.json({ success: true, styles });
    }

    if (action === 'delete') {
      const { styleId } = body;
      if (!styleId) {
        return NextResponse.json({ success: false, error: '缺少风格ID' }, { status: 400 });
      }
      
      const database = db();
      await database.delete(layoutStyles).where(eq(layoutStyles.id, styleId));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
  } catch (error) {
    console.error('Style analysis error:', error);
    return NextResponse.json({ success: false, error: '风格分析失败' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const database = db();
    const styles = await database.select().from(layoutStyles);
    return successResponse(styles);
  } catch (error) {
    console.error('Failed to load styles:', error);
    return errorResponse('加载风格列表失败');
  }
}
