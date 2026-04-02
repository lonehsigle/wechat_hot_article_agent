import { NextRequest, NextResponse } from 'next/server';
import { Segment, useDefault } from 'segmentit';

const segment = new Segment();
useDefault(segment);

const STOP_WORDS = new Set([
  '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你',
  '会', '着', '没有', '看', '好', '自己', '这', '那', '什么', '他', '她', '它', '这个', '那个', '可以', '没', '啊', '呢',
  '吧', '吗', '哦', '嗯', '哈', '啦', '呀', '哪', '怎', '么', '还', '能', '让', '把', '被', '比', '更', '最', '但', '而',
  '或', '与', '及', '等', '对', '为', '以', '从', '向', '于', '给', '之', '其', '者', '所', '即', '如', '若', '虽', '则',
  '因为', '所以', '如果', '虽然', '但是', '然而', '而且', '或者', '以及', '对于', '关于', '通过', '进行', '已经', '正在',
  '将', '可能', '应该', '需要', '必须', '能够', '这些', '那些', '这样', '那样', '如此',
  '我们', '你们', '他们', '她们', '它们', '大家', '别人', '他人', '某', '每', '各', '本', '该', '此',
  '来', '起来', '出来', '进来', '回来', '过来', '上去', '下来', '进去', '回去', '过去', '开来',
  '得', '地', '过',
  '一点', '一些', '一下', '一直', '一起', '一切', '一边', '一面', '一时', '一样', '一再', '一味',
  '就是', '只是', '还是', '总是', '都是', '就有', '都有', '才是', '也是', '又有', '还有',
  '不是', '别', '莫', '勿', '休', '甭', '不用', '不要', '不会', '不能', '不可', '不敢', '不该',
  '这种', '那种', '哪种', '各种', '某种', '任何', '所有', '全部', '部分',
  '之后', '之前', '以后', '以前', '以上', '以下', '之间', '之内', '之外', '之中', '当中', '其中',
  '其实', '实际', '确实', '真的', '真是', '当然', '固然', '即使', '尽管', '哪怕',
  '比如', '例如', '譬如', '诸如', '像是', '好像', '仿佛', '似乎', '简直', '几乎', '差不多',
  '然后', '接着', '于是', '因此', '因而', '从而', '进而', '继而', '随后', '随即',
  '这里', '那里', '哪里', '这边', '那边', '哪边', '这儿', '那儿', '哪儿', '此处', '彼处',
  '现在', '当时', '此时', '彼时', '那时', '何时', '有时', '随时', '同时', '届时',
  '怎样', '怎么', '如何', '何如', '为何', '何故', '何必', '何不', '何曾', '何尝', '何须',
  '多少', '几', '几个', '几时', '几许', '几何', '若干', '多', '少', '大', '小', '长', '短', '高', '低', '远', '近',
  '第一', '第二', '第三', '首先', '其次', '再次', '最后', '最终', '最初', '起初', '开始', '结束',
  '特别', '非常', '十分', '相当', '比较', '稍微', '略微', '有些', '有点', '颇为', '甚为',
  '拼命', '一阵子', '别急', '急着',
  '点击', '名片', '关注', '公众号', '微信', '朋友圈', '转发', '点赞', '收藏', '扫码', '二维码',
  '阅读', '原文', '链接', '更多', '精彩', '推荐', '相关', '文章', '往期', '回顾',
  '本文', '来源', '作者', '简介', '版权', '声明', '免责', '商务', '合作', '联系', '方式', '投稿', '邮箱',
  '洞明说', '星标', '加', '★',
]);

const BLACK_PATTERNS = [
  /点击名片/g, /关注我们/g, /扫码关注/g, /长按识别/g, /二维码/g,
  /转发给/g, /分享给/g, /点赞.*在看/g, /点击.*阅读/g,
  /更多精彩/g, /推荐阅读/g, /相关文章/g, /往期回顾/g,
  /本文来源/g, /作者简介/g, /版权声明/g, /免责声明/g,
  /商务合作/g, /联系方式/g, /投稿邮箱/g,
];

function cleanText(text: string): string {
  let cleaned = text;
  BLACK_PATTERNS.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  return cleaned;
}

function isValidWord(word: string): boolean {
  if (word.length < 2 || word.length > 6) return false;
  if (STOP_WORDS.has(word)) return false;
  if (/^\d+$/.test(word)) return false;
  if (/^[a-zA-Z]+$/.test(word)) return false;
  if (/(.)\1{2,}/.test(word)) return false;
  if (/^[的一是不了在人有我这个]/.test(word)) return false;
  if (/[的一是不了在人有我这个]$/.test(word)) return false;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articles } = body as { 
      articles: Array<{ 
        title: string; 
        digest?: string | null; 
        content?: string | null;
      }> 
    };

    if (!articles || articles.length === 0) {
      return NextResponse.json({ error: '请提供文章数据' }, { status: 400 });
    }

    const wordCount: Record<string, number> = {};

    for (const article of articles) {
      const title = cleanText(article.title || '');
      const digest = cleanText(article.digest || '');
      const content = cleanText((article.content || '').substring(0, 1000));

      const titleWords = segment.doSegment(title, { simple: true }) as string[];
      const digestWords = segment.doSegment(digest, { simple: true }) as string[];
      const contentWords = segment.doSegment(content, { simple: true }) as string[];

      titleWords.forEach(word => {
        const w = word.trim();
        if (isValidWord(w)) {
          wordCount[w] = (wordCount[w] || 0) + 3;
        }
      });

      digestWords.forEach(word => {
        const w = word.trim();
        if (isValidWord(w)) {
          wordCount[w] = (wordCount[w] || 0) + 2;
        }
      });

      contentWords.forEach(word => {
        const w = word.trim();
        if (isValidWord(w)) {
          wordCount[w] = (wordCount[w] || 0) + 1;
        }
      });
    }

    const minCount = Math.max(2, Math.floor(articles.length * 0.1));

    const wordCloud = Object.entries(wordCount)
      .filter(([_, count]) => count >= minCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 80)
      .map(([word, count]) => ({ word, count }));

    return NextResponse.json({ 
      success: true, 
      wordCloud,
      totalWords: Object.keys(wordCount).length,
      articleCount: articles.length,
    });
  } catch (error) {
    console.error('[Segment] Error:', error);
    return NextResponse.json({ 
      error: '分词处理失败', 
      details: String(error) 
    }, { status: 500 });
  }
}
