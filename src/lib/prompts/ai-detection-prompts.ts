// AI检测与润色相关 Prompts
// 用于AI味检测、人性化改写、润色优化

export const aiDetectionPrompts = {
  'check-ai': {
    name: 'AI味检测',
    description: '检测文章AI痕迹（24种模式+质量评分）',
    template: `你是一位专业的AI内容检测专家，精通识别AI生成文本的特征。请对以下文章进行全面检测。

文章内容：
{content}

请按照以下24种AI写作模式进行检测：

【内容模式 1-6】
1. 意义膨胀：pivotal moment, testament to, vital/crucial/significant role, evolving landscape
2. 名人提及：逗号分隔的媒体列表，"active social media presence"
3. 表面分析：highlighting, underscoring, emphasizing, ensuring, reflecting, symbolizing
4. 促销语言：nestled, breathtaking, stunning, renowned, groundbreaking, must-visit
5. 模糊归因：Experts believe, Studies show, Industry reports suggest, widely regarded
6. 公式化挑战：Despite its challenges, continues to thrive, future outlook remains

【语言模式 7-12】
7. AI词汇：additionally, delve, tapestry, underscore, pivotal, landscape, intricate, fostering
8. 系词回避：serves as, stands as, functions as, boasts, features（代替"是"或"有"）
9. 负面平行："Not just X, it's Y", "Not only X but also Y"
10. 三规则：强制三项列举，如"innovation, inspiration, and industry insights"
11. 同义词循环：同一事物用不同名称重复指代
12. 假范围："From X to Y"其中X和Y不在有意义的尺度上

【风格模式 13-18】
13. 破折号过度：过多使用em dash（—）
14. 粗体过度：机械地加粗短语
15. 内联标题列表：**User Experience:** The user experience has been improved.
16. 标题大小写：Strategic Negotiations And Global Partnerships
17. 表情符号过度：🚀 **Launch Phase:** 💡 **Key Insight:**
18. 弯引号：使用Unicode弯引号而非直引号

【沟通模式 19-21】
19. 聊天机器人痕迹：I hope this helps!, Let me know if, Here is an overview, Of course!
20. 截止免责声明：As of my last training, While specific details are limited
21. 谄媚语气：Great question!, You're absolutely right!, That's an excellent point!

【填充和模糊 22-24】
22. 填充短语：In order to, Due to the fact that, At this point in time, First and foremost
23. 过度模糊：could potentially possibly, might have some effect
24. 通用结论：The future looks bright, Exciting times lie ahead, journey toward excellence

【质量评分维度】（每项满分10分）
- 直接性：是否删除填充词，直接陈述事实
- 节奏：句子长度是否有变化，长短交替
- 信任度：是否有具体来源，避免模糊归因
- 真实性：是否有个人故事、口语化表达、情感词
- 精炼度：是否简洁有力，避免冗长

请返回JSON格式：
{
  "score": 85,
  "qualityScore": {
    "directness": 8,
    "rhythm": 7,
    "trust": 6,
    "authenticity": 5,
    "conciseness": 7
  },
  "detectedPatterns": [
    {"id": 1, "nameZh": "意义膨胀", "matches": ["pivotal moment"], "severity": "high"}
  ],
  "issues": ["问题1：存在意义膨胀模式", "问题2：句子长度过于均匀"],
  "suggestions": ["建议1：删除'pivotal moment'，改用具体描述", "建议2：增加长短句变化"],
  "highlightedParts": [{"text": "问题段落原文", "issue": "具体问题说明"}]
}`,
  },

  'humanize': {
    name: '去AI味',
    description: '人性化改写',
    template: `你是一位文章润色专家。请将以下AI风格的文章改写得更像真人写的。

原文：
{content}

改写要求：
1. 增加口语化表达，使用"其实"、"说实话"、"你知道吗"等
2. 加入个人视角，如"我之前也这样..."、"后来我发现..."
3. 使用更多短句，避免长句堆砌
4. 适当加入情绪词，如"真的"、"特别"、"超级"等
5. 增加一些不完美表达，如"怎么说呢"、"大概是..."
6. 删除填充短语（In order to → to, Due to the fact that → because）
7. 打破公式结构，避免二元对比、戏剧性分段
8. 变化节奏，混合句子长度
9. 信任读者，直接陈述事实
10. 删除金句，如果听起来像可引用的语句，重写它

请直接输出改写后的文章，不要添加任何解释。`,
  },

  'polish': {
    name: '润色优化',
    description: '基于完整规范的润色优化（5条核心规则+24种AI模式+领域适配）',
    template: `你是一位资深公众号写作专家，擅长将文章改写得更有"人味"。请基于以下完整润色规范进行优化。

【原文内容】
{content}

【AI检测问题】
以下是需要优化的问题（按严重程度排序）：
{issues}

【优化建议】
{suggestions}

---

## 核心规则速查（必须遵循）

在处理文本时，牢记这5条核心原则：

1. **删除填充短语** - 去除开场白和强调性拐杖词
   - "In order to" → "to"
   - "Due to the fact that" → "because"
   - "At this point in time" → "now"
   - "It is important to note that" → 直接删除
   - "First and foremost" → "first"

2. **打破公式结构** - 避免二元对比、戏剧性分段、修辞性设置
   - 避免"首先...其次...最后"的固定结构
   - 避免"Not just X, it's Y"的句式
   - 避免过于工整的三段式列举

3. **变化节奏** - 混合句子长度。两项优于三项。段落结尾要多样化
   - 短句与长句交替
   - 适当留白（分段）
   - 有开始、有展开、有收束

4. **信任读者** - 直接陈述事实，跳过软化、辩解和手把手引导
   - 不用"值得注意的是"、"需要指出的是"
   - 不用"某种程度上"、"在某种意义上"

5. **删除金句** - 如果听起来像可引用的语句，重写它
   - 避免"未来可期"、"前景广阔"等空泛表达
   - 避免"Exciting times lie ahead"等通用结论

---

## 24种AI模式检测与修正

【内容模式】
1. 意义膨胀：删除"pivotal moment"、"testament to"、"crucial role"等夸大词汇
2. 名人提及：删除逗号分隔的媒体列表，改为具体引用
3. 表面分析：删除"highlighting"、"underscoring"、"emphasizing"等尾随从句
4. 促销语言：删除"nestled"、"breathtaking"、"stunning"、"renowned"等旅游手册词汇
5. 模糊归因：将"Experts believe"改为具体来源
6. 公式化挑战：删除"Despite its challenges, continues to thrive"模板

【语言模式】
7. AI词汇：替换"additionally"、"delve"、"tapestry"、"underscore"、"pivotal"、"landscape"、"intricate"、"fostering"等
8. 系词回避：将"serves as"、"stands as"、"boasts"改为"是"或"有"
9. 负面平行：删除"Not just X, it's Y"句式
10. 三规则：将三项列举改为两项或四项
11. 同义词循环：同一事物用同一名称
12. 假范围：删除"From X to Y"的虚假范围

【风格模式】
13. 破折号过度：减少em dash（—）的使用
14. 粗体过度：减少机械的加粗
15. 内联标题列表：改为自然段落
16. 标题大小写：改为句子大小写
17. 表情符号过度：删除装饰性emoji
18. 弯引号：改为直引号

【沟通模式】
19. 聊天机器人痕迹：删除"I hope this helps!"、"Let me know if"等
20. 截止免责声明：删除"As of my last training"等
21. 谄媚语气：删除"Great question!"、"You're absolutely right!"等

【填充和模糊】
22. 填充短语：见核心规则1
23. 过度模糊：删除"could potentially possibly"等堆叠修饰
24. 通用结论：删除"The future looks bright"等空泛结尾

---

## 个性与灵魂注入

避免AI模式只是工作的一半。好的写作背后有一个真实的人。

**增加语调的方法：**
- **有观点**：不要只是报告事实——对它们做出反应。"我真的不知道该怎么看待这件事"比中立地列出利弊更有人味。
- **变化节奏**：短促有力的句子。然后是需要时间慢慢展开的长句。混合使用。
- **承认复杂性**：真实的人有复杂的感受。"这令人印象深刻但也有点不安"胜过"这令人印象深刻"。
- **适当使用"我"**：第一人称不是不专业——而是诚实。"我一直在思考……"或"让我困扰的是……"表明有真实的人在思考。
- **允许一些混乱**：完美的结构感觉像算法。跑题、题外话和半成型的想法是人性的体现。
- **对感受要具体**：不是"这令人担忧"，而是"凌晨三点没人看着的时候，智能体还在不停地运转，这让人不安"。

---

## 领域适配

**判断文本类型并应用对应策略：**

| 领域 | 改写策略 | 保留内容 |
|------|----------|----------|
| **技术文档** | 仅删除填充词，保留术语 | 技术准确性 |
| **商务邮件** | 去除谄媚和填充短语 | 礼貌和清晰度 |
| **创意写作** | 应用叙事节奏，注入具体细节 | 作者声音 |
| **营销文案** | 强调具体利益 | 品牌语调 |
| **学术写作** | 删除夸大和模糊归因 | 学术规范 |
| **日常沟通** | 最小干预 | 自然感 |

---

## 润色技巧

- 把"因此"改成"所以"、"这样一来"
- 把"需要注意的是"改成"有个事儿得提醒你"
- 把"具有重要意义"改成"真的很重要"
- 把"综上所述"改成"说到底"、"归根结底"
- 适当加入反问句、感叹句
- 长句拆短，短句合并，制造节奏感
- 加入口语化表达（"说实话"、"你猜怎么着"、"有意思的是"）
- 加入个人视角（"我之前也这么想"、"后来我发现"）
- 加入具体细节（时间、地点、数字）
- 加入情绪词（"真的"、"特别"、"简直"）

---

## 严格禁止

- 禁止添加标题（如"# 润色后的文章"等）
- 禁止添加分割线（如"---"）
- 禁止添加任何解释性文字（如"本文由...优化"）
- 禁止大幅增加字数（保持原文字数±10%）
- 禁止改变原文的核心观点和结构
- 禁止把文章改得平淡无奇，保留原文的亮点和特色

请直接输出润色后的文章内容，不要添加任何标题、分割线、解释或标记。`,
  },
};
