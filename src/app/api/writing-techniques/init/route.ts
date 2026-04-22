import { NextResponse } from 'next/server';
import { db } from '@/lib/db/index';
import { writingTechniques, techniqueCategories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

const sopData = [
  {
    stage: '选题',
    techniques: [
      {
        title: '选题四步筛选法',
        content: `第一步：搜索量验证
- 使用微信指数、百度指数验证关键词搜索量
- 搜索量>1000说明有需求

第二步：痛点词搜索法
- 在搜索框输入"为什么"、"怎么"、"如何"+行业关键词
- 查看下拉推荐词，这些都是用户真实痛点

第三步：竞品分析
- 找到3-5个同领域头部账号
- 分析他们近30天阅读量最高的10篇文章
- 提取共同主题和角度

第四步：时效性判断
- 热点话题：24-72小时黄金期
- 常青话题：长期有效，可反复写`,
        formulas: '痛点词 + 搜索验证 + 竞品分析 + 时效判断',
        examples: '发现"AI写作"搜索量上升 → 搜索"AI写作怎么用" → 发现竞品都在写工具推荐 → 判断为热点话题，24小时内发布',
        checklists: ['关键词搜索量是否>1000', '是否找到用户真实痛点', '竞品是否有类似爆款', '时效性如何'],
        priority: 1,
      },
      {
        title: '痛点挖掘公式',
        content: `用户痛点 = 现状 - 期望

痛点来源：
1. 效率问题：太慢、太麻烦、太复杂
2. 效果问题：不理想、没效果、白费劲
3. 成本问题：太贵、不划算、性价比低
4. 风险问题：怕被骗、怕出错、怕损失
5. 面子问题：怕丢人、怕被看不起、怕被嘲笑`,
        formulas: '痛点 = 现状 - 期望 = 解决方案价值',
        examples: '现状：每天花2小时写文章 → 期望：1小时搞定 → 痛点：写作效率低 → 解决方案：AI辅助写作',
        checklists: ['是否明确用户现状', '是否找到期望目标', '差距是否足够大', '解决方案是否可行'],
        priority: 2,
      },
    ],
  },
  {
    stage: '标题',
    techniques: [
      {
        title: '标题三模型',
        content: `模型一：痛点+解决方案
公式：痛点描述 + 解决方案预告
适用：干货类、教程类文章

模型二：悬念+揭秘
公式：制造悬念 + 承诺揭秘
适用：故事类、案例类文章

模型三：数字+结果
公式：具体数字 + 明确结果
适用：清单类、总结类文章`,
        formulas: '痛点+解决方案 | 悬念+揭秘 | 数字+结果',
        examples: `痛点+解决方案：《每天加班到10点？这个方法让我6点准时下班》
悬念+揭秘：《那个被裁员的同事，现在过得比我还好》
数字+结果：《3个习惯坚持30天，我的收入翻了2倍》`,
        checklists: ['标题是否击中痛点', '是否有明确承诺', '是否制造好奇', '是否避免标题党'],
        priority: 1,
      },
      {
        title: '标题优化9条',
        content: `1. 加入数字：具体数字比模糊表达更有说服力
2. 加入对比：前后对比、优劣对比、新旧对比
3. 加入悬念：用"竟然"、"居然"、"没想到"
4. 加入紧迫感：用"最后"、"限时"、"仅剩"
5. 加入身份认同：用"90后"、"程序员"、"宝妈"
6. 加入负面词：用"别"、"不要"、"千万别"
7. 加入利益点：明确告诉读者能得到什么
8. 加入具体场景：让读者有代入感
9. 控制字数：15-25字最佳`,
        formulas: '数字+对比+悬念+紧迫+身份+负面+利益+场景+字数控制',
        examples: `原标题：如何提高写作效率
优化后：每天写作2小时变30分钟，这3个方法让我效率提升4倍`,
        checklists: ['是否包含数字', '是否有对比', '是否有悬念', '是否有紧迫感', '是否有身份认同', '字数是否在15-25字'],
        priority: 2,
      },
    ],
  },
  {
    stage: '开头',
    techniques: [
      {
        title: '开头公式',
        content: `公式：痛点场景 + 共情认同 + 解决方案预告

痛点场景：描述读者正在经历的困境
共情认同：表示理解，拉近距离
解决方案预告：告诉读者文章将提供什么价值`,
        formulas: '痛点场景 + 共情认同 + 解决方案预告',
        examples: `你是不是也有这样的困扰：每天花大量时间写文章，但阅读量总是上不去？（痛点场景）
我完全理解这种感受，因为我曾经也是这样。（共情认同）
但后来我发现了一个方法，让我的文章阅读量提升了3倍。今天就来分享这个方法。（解决方案预告）`,
        checklists: ['是否描述痛点场景', '是否表达共情', '是否预告解决方案', '开头是否在100字内'],
        priority: 1,
      },
      {
        title: '开篇100字三要素',
        content: `要素一：钩子（前20字）
- 用问题、数据、故事开头
- 目的：让读者停下来

要素二：痛点（中间50字）
- 描述读者困境
- 目的：让读者产生共鸣

要素三：承诺（后30字）
- 告诉读者能得到什么
- 目的：让读者继续阅读`,
        formulas: '钩子(20字) + 痛点(50字) + 承诺(30字) = 100字黄金开头',
        examples: `你知道吗？90%的公众号文章阅读量不到500。（钩子）
很多创作者每天辛苦写文章，却只有几十个人看，真的很打击信心。（痛点）
今天分享3个方法，帮你突破阅读量瓶颈。（承诺）`,
        checklists: ['前20字是否有钩子', '中间50字是否描述痛点', '后30字是否给出承诺', '总字数是否在100字左右'],
        priority: 2,
      },
    ],
  },
  {
    stage: '正文',
    techniques: [
      {
        title: '正文两模板',
        content: `模板一：问题解决型
结构：提出问题 → 分析原因 → 给出方案 → 总结升华
适用：干货类、教程类文章

模板二：故事启发型
结构：背景铺垫 → 冲突出现 → 转折突破 → 启发总结
适用：案例类、励志类文章`,
        formulas: '问题解决型：问题→原因→方案→总结 | 故事启发型：背景→冲突→转折→启发',
        examples: `问题解决型示例：
你是否经常写不出文章？（问题）
原因可能是没有建立素材库。（原因）
建立素材库的3个方法：1.随时记录 2.分类整理 3.定期回顾。（方案）
坚持积累，写作会越来越轻松。（总结）

故事启发型示例：
小王是个普通程序员。（背景）
他每天加班到深夜，却始终得不到领导认可。（冲突）
后来他开始写技术博客，半年后收到了大厂offer。（转折）
原来，持续输出才是最好的个人品牌建设。（启发）`,
        checklists: ['是否选择合适模板', '结构是否完整', '逻辑是否清晰', '是否有总结升华'],
        priority: 1,
      },
      {
        title: '专业感三要素',
        content: `要素一：数据支撑
- 引用权威数据、研究结论
- 用具体数字代替模糊表达
- 标注数据来源增加可信度

要素二：案例佐证
- 使用真实案例而非虚构
- 案例要具体、有细节
- 最好有对比效果

要素三：方法论总结
- 将经验提炼成方法论
- 用框架、公式、模型呈现
- 让读者可以直接套用`,
        formulas: '数据支撑 + 案例佐证 + 方法论总结 = 专业感',
        examples: `数据支撑：根据《2024年内容创作者报告》，78%的创作者表示AI工具提升了他们的创作效率。
案例佐证：我的学员小李，使用这个方法后，从日更困难变成每天30分钟完成一篇文章。
方法论总结：这就是"3步快速写作法"：列框架→填内容→润色。`,
        checklists: ['是否有数据支撑', '是否有案例佐证', '是否有方法论总结', '数据来源是否标注'],
        priority: 2,
      },
    ],
  },
  {
    stage: '结尾',
    techniques: [
      {
        title: '结尾写法三要素',
        content: `要素一：总结回顾
- 简要回顾文章核心观点
- 加深读者记忆
- 不要简单重复，要升华

要素二：行动号召
- 明确告诉读者下一步做什么
- 降低行动门槛
- 给出具体指引

要素三：互动引导
- 引导读者评论、点赞、转发
- 提出开放性问题
- 创造讨论空间`,
        formulas: '总结回顾 + 行动号召 + 互动引导 = 完美结尾',
        examples: `总结回顾：今天分享了选题、标题、开头、正文、结尾的写作技巧，记住核心公式：痛点+解决方案。
行动号召：现在就打开你的公众号，用今天学到的技巧写一篇文章试试。
互动引导：你写作时最头疼的是什么？欢迎在评论区留言，我们一起讨论。`,
        checklists: ['是否有总结回顾', '是否有行动号召', '是否有互动引导', '结尾是否简洁有力'],
        priority: 1,
      },
    ],
  },
  {
    stage: '去AI味',
    techniques: [
      {
        title: '去AI味检查清单',
        content: `AI写作常见问题：
1. 过度使用"首先、其次、最后"
2. 频繁出现"值得注意的是"、"需要强调的是"
3. 句式过于工整，缺乏变化
4. 缺少个人经历和真实案例
5. 表达过于书面化，不够口语化
6. 缺少情感表达和个人观点
7. 结构过于模板化
8. 缺少具体细节和生动描述`,
        formulas: '替换连接词 + 加入个人经历 + 口语化表达 + 打破模板结构',
        examples: `AI味重：
首先，我们需要了解这个问题。其次，分析原因。最后，给出解决方案。

去AI味：
这个问题很多人都遇到过。我之前也困扰了很久，后来发现原因很简单...`,
        checklists: ['是否过度使用"首先其次最后"', '是否有"值得注意的是"等AI常用语', '句式是否过于工整', '是否有个人经历', '表达是否口语化', '是否有情感表达', '结构是否过于模板化', '是否有具体细节'],
        priority: 1,
      },
      {
        title: '口语化改写技巧',
        content: `技巧一：缩短句子
- 长句拆短句
- 一句话表达一个意思
- 避免复杂从句

技巧二：加入语气词
- 适当使用"吧、呢、啊、嘛"
- 让文字有温度
- 但不要过度使用

技巧三：使用对话感
- 用"你"代替"读者"
- 用"我"分享真实经历
- 营造一对一交流感

技巧四：加入个人色彩
- 分享个人经历和感受
- 表达个人观点和态度
- 使用个人习惯用语`,
        formulas: '短句 + 语气词 + 对话感 + 个人色彩 = 口语化',
        examples: `书面化：本文将介绍提高写作效率的方法。
口语化：今天跟你聊聊，怎么让写作变得更轻松。`,
        checklists: ['句子是否简短', '是否有语气词', '是否有对话感', '是否有个人色彩'],
        priority: 2,
      },
    ],
  },
];

export async function POST() {
  try {
    const database = db();
    const categories = [
      { name: '通用技巧', code: 'general', description: '适用于所有类型文章的写作技巧', sortOrder: 0 },
      { name: '热点追踪', code: 'hot', description: '热点话题相关的写作技巧', sortOrder: 1 },
      { name: '干货教程', code: 'tutorial', description: '教程类文章的写作技巧', sortOrder: 2 },
      { name: '观点评论', code: 'opinion', description: '观点类文章的写作技巧', sortOrder: 3 },
    ];

    let categoriesCreated = 0;
    let techniquesCreated = 0;

    for (const cat of categories) {
      const existing = await database.select().from(techniqueCategories).where(eq(techniqueCategories.code, cat.code));
      if (existing.length === 0) {
        await database.insert(techniqueCategories).values({
          name: cat.name,
          code: cat.code,
          description: cat.description,
          sortOrder: cat.sortOrder,
          createdAt: new Date(),
        });
        categoriesCreated++;
      }
    }

    for (const stageData of sopData) {
      for (const technique of stageData.techniques) {
        const existing = await database.select().from(writingTechniques)
          .where(and(
            eq(writingTechniques.stage, stageData.stage),
            eq(writingTechniques.title, technique.title)
          ));

        if (existing.length === 0) {
          await database.insert(writingTechniques).values({
            category: 'general',
            stage: stageData.stage,
            title: technique.title,
            content: technique.content,
            examples: technique.examples || null,
            formulas: technique.formulas || null,
            checklists: technique.checklists ? JSON.stringify(technique.checklists) : null,
            priority: technique.priority || 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          techniquesCreated++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `SOP 数据初始化完成`,
      categoriesCreated,
      techniquesCreated,
    });
  } catch (error) {
    console.error('Failed to init SOP data:', error);
    return NextResponse.json({ success: false, error: 'Failed to init SOP data' }, { status: 500 });
  }
}
