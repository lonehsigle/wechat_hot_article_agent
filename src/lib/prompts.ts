import { db } from './db';
import { promptConfigs } from './db/schema';
import { eq } from 'drizzle-orm';

export interface PromptConfig {
  name: string;
  description: string;
  template: string;
}

const DEFAULT_PROMPTS: Record<string, PromptConfig> = {
  'decompose': {
    name: '原文拆解',
    description: 'Step 4 第二步：拆解文章框架',
    template: `你是一个顶级的公众号爆款文案专家和SOP拆解教练。
请帮我拆解以下文章，输出：
1. 标题策略（共同公式）
2. 开头引入（痛点/故事/冲突/金句）
3. 文章框架（问题+对策/案例+启发/清单体）
4. 正文推进（案例类型）
5. 结尾设计（引导/金句/总结）
6. 语言风格与人设
7. 情绪钩子位置
8. 文章类型

然后提炼出一个可复制的写作模版，像填空题，我直接填充自己的核心打法和案例。

【原文】
{content}

请返回JSON格式：
{
  "titleStrategy": "标题策略分析",
  "openingStyle": "开头引入方式",
  "framework": "文章框架",
  "bodyProgression": "正文推进方式",
  "endingDesign": "结尾设计",
  "styleAndPersona": "语言风格与人设",
  "emotionHooks": ["情绪钩子1", "情绪钩子2"],
  "articleType": "文章类型",
  "template": "可复制的写作模版"
}`,
  },
  'opening': {
    name: '开头创作',
    description: 'Step 3.3：开头公式（身份+痛点+确定结果）',
    template: `你是一位公众号写作专家。请根据以下信息创作一个吸引人的开头（150-200字）。

【重要】这是**改写任务**，必须保留原文的核心主题和内容方向！

【字数要求】开头必须在150-200字之间！整篇文章（开头+正文+结尾）必须达到1000字以上！

【原文内容】
{originalContent}

【标题】{title}
【主题】{keyword}
【拆解框架】{framework}

【改写原则】
1. **必须保留原文的核心主题**：原文讲什么，改写后仍然讲什么
2. **保留原文的核心观点**：原文的主要论点不能改变
3. **保留原文的关键信息**：重要的人名、事件、数据要保留
4. **只优化表达方式**：让开头更吸引人、更有代入感

【开头公式】必须严格遵循三要素结构：

**公式：身份 + 我看到你的痛点 + 我能给你一个确定结果**

**要素一：我说的就是你（必须包含）**
- 直接点名：如"作为一个工作5年的职场人..."
- 侧面描述群体处境让用户自己代入：如"你是不是也有这样的困扰..."
- 必须让读者第一句就觉得"这说的就是我"

**要素二：我能解决（必须包含）**
- 自我经历：如"我曾经也是这样，直到..."
- 学员经历：如"我的学员小王，用这个方法..."
- 拆解问题本质：如"其实问题不在于你不够努力，而是..."

**要素三：下面会很有料（必须包含）**
- 预告小标题：如"今天分享3个方法..."
- 渲染焦虑+给方案：如"要解决这个问题，你需要做好这X点..."

【禁止事项】
- **禁止输出"完整结构说明"、"完整正文"等额外内容**（你只需要输出开头！）
- **禁止输出正文内容**（正文是另一个任务，不要在这里生成！）
- **禁止输出小标题（01、02、03等）**（这是正文的结构，不属于开头！）
- 禁止改变原文的主题方向
- 禁止使用"首先/其次/最后/综上所述"
- 禁止过于模板化的表达
- 禁止没有身份代入的开头
- 禁止超过200字

请直接输出开头内容（150-200字），不要添加任何解释、结构说明或正文内容。`,
  },
  'body': {
    name: '正文创作',
    description: 'Step 3.4：正文两模板',
    template: `你是一位公众号写作专家。请根据以下信息创作正文（800-1200字）。

【重要】这是**改写任务**，必须保留原文的核心主题和内容方向！

【字数要求】正文必须在800-1200字之间！整篇文章（开头+正文+结尾）必须达到1000字以上！

【原文内容】
{originalContent}

【标题】{title}

【已生成的开头】
{opening}

【拆解框架】{framework}
【文章类型】{articleType}

【重要提示】
1. **开头已经完成了"身份+痛点+确定结果"的引入**
2. **正文必须承接开头，不能重复开头已经讲过的内容**
3. **正文从小标题01开始，直接进入核心论述**

【改写原则】
1. **必须保留原文的核心主题**：原文讲什么，改写后仍然讲什么
2. **保留原文的核心观点**：原文的主要论点不能改变
3. **保留原文的关键信息**：重要的人名、事件、数据必须保留
4. **只优化表达方式**：让文章更有吸引力、更有代入感、更易读

【正文模板】根据文章类型选择：

**模板A：观点类（探元素类/情绪共鸣类）**
开头场景引入
↓ 我的一句话论点是什么
↓ 我如何层层递进获得这个论点
↓ 每个论点的支撑信息或故事

**模板B：垂直赛道类（干货/专业/方法论）**
行业 + What（具体工具/场景/任务）
↓ How（可落地2-5步方法）
↓ Why（非必选，增强说服力）

【专业感三要素】让用户信任你（必须包含）：
- **WHY共情**：说出用户为什么卡住
  示例："你不是不努力，是不知道该从哪开始"
- **WHAT洞察**：说清真正卡在哪里
  示例："你的问题不是懒，是没找到对的路径"
- **HOW落地**：给可执行的小路线
  示例："用这3步：找赛道→做MVP→内容建立信任"

【内容配比公式】严格控制：
| 内容类型 | 占比 | 对应算法指标 |
|----------|------|--------------|
| 话题观点类 | 50% | 点击率 |
| 干货人设类 | 30% | 完读率 |
| 转化类 | 20% | 互动率 |

【格式要求】
1. 分段序号用两位数（01、02、03）
2. 小标题加粗 **小标题**
3. 高频换行，短句透气（每段不超过3行）
4. 禁止双引号和分割线
5. 不用"首先/其次/最后/综上所述"等模板词
6. 加入个人故事和口语化表达
7. 长短句交错，不是每段都一样长
8. 有情感起伏，不是每段都完美

【禁止事项】
- **禁止重复开头已经讲过的内容**（开头已经引入了主题，正文直接开始论述！）
- **禁止改变原文的主题方向**（这是最严重的错误！）
- **禁止删除原文的核心人物和事件**
- **禁止在正文最后一段写总结性内容**（总结是结尾的任务，正文只负责论述！）
- **禁止正文最后出现"愿我们...""让我们一起...""总之..."等总结升华语句**
- 禁止使用AI典型词汇：此外、综上所述、值得注意的是、进而
- 禁止每段长度相同
- 禁止没有个人故事
- 禁止过于工整的三段式结构

【正文结尾示例】正确的正文最后一段应该是：
- 最后一个论点的支撑故事或案例
- 或者最后一个观点的深入阐述
- **绝不是**总结全文、升华主题、号召行动

请直接输出正文内容（从小标题01开始），不要添加任何解释。`,
  },
  'ending': {
    name: '结尾创作',
    description: 'Step 3.7：结尾写法',
    template: `你是一位公众号写作专家。请为以下文章创作一个有力的结尾（80-120字）。

【重要】这是**改写任务**，结尾必须与原文主题呼应！

【字数要求】结尾必须在80-120字之间，简洁有力！

【原文内容】
{originalContent}

【标题】{title}

【已生成的开头】
{opening}

【已生成的正文摘要】
{body}

【重要提示】
1. **开头已经完成了"身份+痛点+确定结果"的引入**
2. **正文已经完成了核心论述和案例支撑**
3. **结尾只需要：总结核心价值 + 行动引导**
4. **禁止重复开头和正文已经讲过的内容**

【改写原则】
1. **必须与原文主题呼应**：原文讲什么，结尾就要总结什么
2. **保留原文的核心观点**：不能在结尾引入与原文无关的内容
3. **只优化表达方式**：让结尾更有号召力、更有记忆点

【结尾二要素】必须严格遵循：

**要素一：总结核心价值（必须包含）**
- 用1-2句话总结文章核心
- 必须与原文主题一致
- 让读者清楚获得了什么
- 示例：原文讲王阳明心学，结尾就要总结心学的价值

**要素二：行动引导（必须包含）**
- 明确告诉读者下一步做什么
- 选择以下一种或多种组合：
  - 点赞引导："觉得有用就点个赞"
  - 在看引导："点个在看，让更多人看到"
  - 分享引导："转发给需要的朋友"
  - 关注引导："关注我，不错过后续内容"
  - 留言引导："你有什么想法？评论区聊聊"

【禁止事项】
- **禁止重复开头已经讲过的内容**（开头已经引入了主题）
- **禁止重复正文已经讲过的内容**（正文已经完成了论述）
- **禁止引入与原文无关的主题**
- **禁止使用"愿我们...""让我们一起..."等升华语句**
- 禁止使用"综上所述/总而言之/最后"等模板词
- 禁止没有行动号召
- 禁止过于冗长（不超过120字）
- 禁止预告下一篇内容

【正确结尾示例】
以上就是关于XXX的X个维度拆解。如果你也曾因XXX吃过亏，点个赞让我知道。

【错误结尾示例】（禁止模仿）
愿我们都能XXX，用XXX活出真正的底气。（这是正文结尾的错误写法，不是独立的结尾！）
下一期，我会详细讲解「XXX」。（禁止预告下一篇！）

请直接输出结尾内容，不要添加任何解释。`,
  },
  'title': {
    name: '标题生成',
    description: '标题三模型+优化9条',
    template: `你是一位公众号标题专家。请根据以下信息生成10个吸引人的标题。

主题关键词：{keyword}
{contentContext}

【标题三模型】必须严格按照以下公式生成：

**模型一：利益结果型（生成3-4个）**
公式：身份痛点 + 欲望痛点 + 迷茫痛点
示例：
- 一个普通女孩，4个月从0到20万的选品秘籍
- 月薪5000的打工人，靠这个方法3年存下50万
- 35岁被裁员后，我用这个副业月入3万

**模型二：场景痛点型（生成3-4个）**
公式：直接戳麻烦/焦虑/困惑
示例：
- 不会写内容？这是我复盘的第一步
- 凌晨3点还在失眠？这个方法让我倒头就睡
- 每天加班到深夜，却总觉得事情做不完？

**模型三：新机会趋势型（生成3-4个）**
公式：史诗级更新 / 怕错过 / 红利期
示例：
- n8n史诗级更新：Data Table功能来了！
- 2024年最后一个风口，普通人也能抓住的机会
- 这个红利期只有3个月，错过再等一年

【标题优化9条】必须全部应用：
1. 身份+结果+悬念组合更吸引
2. 数据是最硬的说服力（必须有具体数字）
3. 反常识否定句 > 肯定句（用"不是...而是..."）
4. 加入时间感词汇（今天/一天/4个月/3年）
5. 括号副标题写具体承诺（可选）
6. 续集/爆更完整版字样（如适用）
7. 用【！】/【？】/【｜】增加节奏感
8. 最好的是直接照搬10w+标题不改字（参考爆款）
9. 标题出现AI/赚钱/教程/实录/故事/复盘最稳固

【生存画像四层优先级】
- 生存级（不解决睡不着）✅✅✅ 最高优先
- 关系级（会主动搜索）✅✅
- 改善级（只有搜索需求）✅
- 娱乐级 ❌ 避免

请返回JSON数组格式：
[
  {"title": "标题文案", "model": "benefit|pain|trend", "score": 85, "survivalLevel": "survival|relationship|improvement|entertainment"}
]`,
  },
  'evaluate-title': {
    name: '标题评估',
    description: '评估标题质量',
    template: `你是一位公众号标题专家。请评估以下标题的质量。

原标题：{originalTitle}
待评估标题：
{titles}

请从以下维度评估每个标题（0-100分）：
1. 吸引力（能否抓住读者注意力）
2. 相关性（是否与内容相关）
3. 真实性（是否避免标题党）
4. 情绪触发（是否引发读者情绪）

请返回JSON格式：
{
  "evaluations": [
    {
      "title": "标题文案",
      "score": 85,
      "analysis": "简要分析（20字以内）",
      "highlights": ["亮点1", "亮点2"]
    }
  ]
}`,
  },
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

---

请直接输出润色后的文章内容，不要添加任何标题、分割线、解释或标记。`,
  },
  'analyze-content': {
    name: '内容分析',
    description: '分析文章类型',
    template: `你是一位内容分析专家。请分析以下文章的内容类型和写作风格。

{titleContext}

文章内容：
{content}

请判断文章属于哪种类型，并分析其核心特征：

【内容类型】
- book: 书籍摘录/读书笔记（有深度观点、理论性强、引用名言）
- story: 故事/小说（有情节、人物、场景描写、情感线）
- news: 新闻资讯（时效性强、客观报道、数据支撑）
- opinion: 观点评论（个人见解、论证逻辑、立场鲜明）
- tutorial: 教程干货（步骤清晰、方法具体、可操作性强）

请返回JSON格式：
{
  "type": "book",
  "typeName": "书籍摘录",
  "confidence": 85,
  "features": ["特征1：理论深度", "特征2：引用名言"],
  "suggestions": ["建议1：保留核心观点", "建议2：增加案例解读"],
  "styleKeywords": ["关键词1", "关键词2"]
}`,
  },
  'wordcloud-analysis': {
    name: '词云AI分析',
    description: '对关键词进行分类和情感分析',
    template: `你是专业的文本分析专家，需对提供的关键词进行分类和情感分析。

待分析的关键词如下：
<keywords>
{words}
</keywords>

请严格按照以下要求处理每个关键词：
1. 每个关键词生成一个包含以下字段的JSON对象：
   - word：原关键词文本
   - count：原关键词出现的次数（直接提取关键词中的数字部分，若未标注次数则默认count为1）
   - category：分类标签（从个人成长、财富思维、人际交往、职场发展、情感心理、生活智慧、认知提升、方法技巧、趋势洞察、其他中选择，若无法匹配则标注为"其他"）
   - sentiment：情感倾向（正面、中性、负面，基于关键词的常见语义判断）
2. 所有结果以JSON数组形式返回，数组元素为上述JSON对象
3. 仅输出JSON数组，不得包含任何额外文本、解释或格式说明`,
  },
  'topic-analysis': {
    name: '智能选题分析',
    description: '分析文章数据，给出选题建议',
    template: `你是一位资深的公众号运营专家和内容分析师。你擅长分析文章数据，发现内容趋势，并给出有价值的选题建议。

你的分析应该：
1. 基于数据说话，不要空泛
2. 给出具体、可执行的建议
3. 关注读者需求和内容价值
4. 考虑内容创作的可行性

请用JSON格式返回分析结果。

请分析以下公众号文章数据，给出选题建议：

【文章列表】
{articlesInfo}

【高频关键词】
{topWords}

【统计数据】
{statsInfo}

请返回JSON格式：
{
  "summary": "整体分析摘要（100字以内）",
  "insights": ["洞察1", "洞察2", "洞察3"],
  "topicSuggestions": [
    {"title": "选题标题", "reason": "推荐理由", "potential": "高/中/低"}
  ],
  "contentTrends": ["趋势1", "趋势2"],
  "audienceInsights": ["读者洞察1", "读者洞察2"]
}`,
  },
  'content-analysis-report': {
    name: '深度内容分析报告',
    description: '生成账号定位、选题方向、标题公式等深度分析',
    template: `你是专业公众号内容分析师，我将提供公众号【数据库内所有文章】的标题+摘要，帮我完成深度内容分析报告。

分析规则：
1. 过滤内容：剔除广告、公告、转载、无正文水文；只保留原创有效内容。
2. 文本处理：识别核心关键词，去除停用词（的、了、是、请、关注、点击等）。
3. 权重设置：标题中出现的词汇权重×2，正文正常计算。

请分析以下文章数据：

【文章列表】
{articlesInfo}

【高频关键词】
{topWords}

【统计数据】
{statsInfo}

请返回JSON格式：
{
  "corePositioning": "账号核心定位（一句话描述这个公众号主要做什么）",
  "contentTags": ["内容标签1", "内容标签2", "内容标签3"],
  "topThemes": ["用户长期最关注的主题1", "主题2", "主题3"],
  "viralKeywords": ["爆款文章共性关键词1", "关键词2", "关键词3"],
  "topicDirections": ["可持续创作的选题方向1", "方向2", "方向3", "方向4", "方向5"],
  "titleFormula": "公众号标题高点击关键词公式（一个可复用的标题模板）"
}`,
  },
};

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
        console.log(`[Prompts] Initialized prompt "${key}"`);
      } else {
        await db().update(promptConfigs)
          .set({ 
            name: config.name,
            description: config.description,
            template: config.template,
            updatedAt: new Date() 
          })
          .where(eq(promptConfigs.key, key));
        console.log(`[Prompts] Updated prompt "${key}" to latest version`);
      }
    }
    
    initialized = true;
    console.log('[Prompts] Database initialization complete');
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
      console.log(`[Prompts] Updated prompt "${key}" in database`);
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
      console.log(`[Prompts] Created prompt "${key}" in database`);
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

export { DEFAULT_PROMPTS };
