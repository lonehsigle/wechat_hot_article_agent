// src/mocks/data.ts
import type { MonitorCategory, SelectedTopic } from '@/types';

export const mockCategories: MonitorCategory[] = [
  {
    id: '1',
    name: 'Claude Code 选题监控',
    platforms: ['抖音', '小红书', '微博', 'B站'],
    keywords: ['Claude Code', 'AI编程', 'Cursor', 'Vibe Coding'],
    creators: ['老胡', '科技麦芒', '程序员子循'],
    contents: [
      { id: '1', platform: '小红书', title: 'Claude Code 实战测评，真的能替代程序员？', author: '科技麦芒', date: '2026-03-28', likes: 12580, comments: 892, shares: 2341, url: '#' },
      { id: '2', platform: 'B站', title: '【AI编程】Claude Code 完整教程，从入门到精通', author: '程序员子循', date: '2026-03-28', likes: 8960, comments: 1247, shares: 890, url: '#' },
      { id: '3', platform: '抖音', title: 'AI编程工具大比拼，Claude Code表现惊艳', author: '科技侦探', date: '2026-03-27', likes: 23400, comments: 3201, shares: 5670, url: '#' },
      { id: '4', platform: '微博', title: 'Claude Code 掀起编程革命，程序员该何去何从', author: '互联网那些事', date: '2026-03-27', likes: 15600, comments: 2100, shares: 4500, url: '#' },
      { id: '5', platform: '小红书', title: '用Claude Code一天做完了我的毕业设计', author: '码农小李', date: '2026-03-26', likes: 8900, comments: 678, shares: 1200, url: '#' },
      { id: '6', platform: 'B站', title: 'Vibe Coding 会让程序员失业吗？', author: '老胡', date: '2026-03-26', likes: 15600, comments: 2340, shares: 1890, url: '#' },
    ],
    reports: [
      {
        id: '1',
        date: '2026-03-28',
        title: 'Claude Code 选题分析报告',
        summary: '今日关于 Claude Code 的讨论热度较昨日上涨 35%，主要集中在 AI 编程工具测评和职业影响分析两个方向。',
        insights: [
          { type: 'trend', content: 'AI 编程工具类内容持续升温，用户对"替代vs辅助"话题关注度最高' },
          { type: 'hot', content: '"一天完成毕业设计"成为爆款标题，引发大量学生群体共鸣' },
          { type: 'recommendation', content: '建议关注：AI 编程工作流的实际应用场景拆解' },
        ],
        topics: [
          { id: '1', title: 'AI 编程工具平民化', description: '越来越多普通用户开始使用 AI 编程工具完成日常任务，如毕设、脚本编写等。', reason: '工具门槛降低，普通用户也能轻松上手', potential: '覆盖学生、运营、产品等非技术人群，增长空间大' },
          { id: '2', title: '程序员职业焦虑', description: '关于 AI 是否会取代程序员的讨论持续发酵，引发大量程序员群体的关注和讨论。', reason: '技术从业者对职业发展的担忧和思考', potential: '职场/职业发展类内容受众广，易引发共鸣' },
          { id: '3', title: 'Vibe Coding 概念兴起', description: '"Vibe Coding"作为新兴概念，正在获得科技圈的广泛讨论和传播。', reason: '符合当下科技圈对新概念的追捧', potential: '新概念早期红利期，值得重点布局' },
        ],
      },
      {
        id: '2',
        date: '2026-03-27',
        title: '选题洞察日报',
        summary: 'AI 编程相关内容继续保持高热度，海外爆款内容的本土化改编效果显著。',
        insights: [
          { type: 'trend', content: '海外科技内容的本土化改编成为热门内容形式' },
          { type: 'hot', content: '短视频形式的 AI 工具测评比长视频更受欢迎' },
          { type: 'recommendation', content: '建议增加对海外热门内容的跟进速度' },
        ],
        topics: [
          { id: '1', title: 'AI 编程实操教程', description: '从入门到实战的系统性教程类内容。', reason: '用户需求明确，变现路径清晰', potential: '可系列化运营，粉丝粘性高' },
        ],
      },
    ],
  },
  {
    id: '2',
    name: 'Vibe Coding 选题监控',
    platforms: ['抖音', 'B站', '小红书'],
    keywords: ['Vibe Coding', 'AI编程', 'Natural Language Programming'],
    creators: ['老胡', '硅星人家'],
    contents: [
      { id: '7', platform: 'B站', title: '什么是 Vibe Coding？一种全新的编程范式', author: '硅星人家', date: '2026-03-28', likes: 5600, comments: 445, shares: 320, url: '#' },
      { id: '8', platform: '抖音', title: '用说话的方式写代码，Vibe Coding 体验', author: '老胡', date: '2026-03-27', likes: 18900, comments: 1560, shares: 3400, url: '#' },
    ],
    reports: [],
  },
];

export const mockTopics: SelectedTopic[] = [
  { id: '1', title: 'Claude Code 实战测评，真的能替代程序员？', source: '小红书', likes: 12580, selected: false },
  { id: '2', title: 'AI编程工具大比拼，Claude Code表现惊艳', source: '抖音', likes: 23400, selected: false },
  { id: '3', title: '程序员职业焦虑：AI是否会取代程序员', source: '微博', likes: 15600, selected: false },
  { id: '4', title: 'Vibe Coding 会让程序员失业吗？', source: 'B站', likes: 15600, selected: false },
  { id: '5', title: '用Claude Code一天做完了我的毕业设计', source: '小红书', likes: 8900, selected: false },
];
