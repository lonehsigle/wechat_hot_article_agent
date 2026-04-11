# 开发文档

## 版本: 1.2.0
## 更新日期: 2026-04-11

### 新增功能
1. **多用户管理功能**: 新增完整的用户认证系统
   - 用户注册/登录/登出功能
   - 基于 Cookie 的会话管理（7天有效期）
   - 用户表和会话表存储用户数据
   - 密码使用 SHA256 加密存储

2. **展示导航首页**: 新增产品展示首页
   - 产品功能特性展示
   - 核心功能介绍卡片
   - 数据统计展示
   - 登录/注册弹窗

3. **路由保护**: 应用界面需要登录后才能访问
   - 首页自动检测登录状态
   - 已登录用户自动跳转到应用界面
   - 未登录用户显示展示导航页

### 数据库变更
1. **新增 users 表**: 存储用户账号信息
   - id, username, email, password_hash
   - display_name, avatar, role
   - is_active, last_login_at
   - created_at, updated_at

2. **新增 user_sessions 表**: 存储用户会话
   - id, user_id, token
   - user_agent, ip_address
   - expires_at, created_at

### API 变更
1. **新增 /api/auth 路由**: 用户认证接口
   - POST action=register: 用户注册
   - POST action=login: 用户登录
   - POST action=logout: 用户登出
   - GET: 检查登录状态

---

## 版本: 1.1.0
## 更新日期: 2025-04-09

### 新增功能
1. **MiniMax 搜索集成**: 新增 MiniMax 搜索功能，支持通过 Chat API 进行网络搜索
   - MiniMax 搜索使用 Chat API + web_search 工具实现智能搜索
   - 支持通过环境变量配置 API Key（`MINIMAX_API_key`, `MINIMAX_GROUP_ID`）
   - 搜索优先级：Tavily > 天工 > MiniMax > 维基百科 > Bing > DuckDuckGo > 百度 > Google

### 修复 Bug
1. **API 路由配置修复**: 修复 hot雷达 API 路由中正确传递 MiniMax API Key 配置
2. **搜索服务日志优化**: 巻加搜索配置日志，显示当前配置的 API Key 热度

3. **前端错误处理改进**: 修复热门选题搜索前端错误处理， 显示空数据时正确提示错误信息

4. **环境变量示例更新**: 更新 `.env.local.example` 添加 MiniMax 相关配置

5. **开发文档更新**: 更新接口文档、数据库文档、代码注释等

---

## 版本: 1.0.1 → 1.1.0
## 更新日期: 2025-04-09

### 新增功能
1. **MiniMax 搜索集成**: 新增 MiniMax 搜索功能，支持通过 Chat API 进行网络搜索
   - MiniMax 搜索使用 Chat API + web_search 工具实现智能搜索
   - 支持通过环境变量配置 API Key（`MINIMAX_API_KEY`, `MINIMAX_GROUP_ID`)
)
   - 搜索优先级: Tavily > 天工 > MiniMax > 维基百科 > Bing > DuckDuckGo > 百度 > Google

### 修复 Bug
1. **API 路由配置修复**: 修复热雷达 API 路由中正确传递 MiniMax API Key 配置
2. **搜索服务日志优化**: 添加搜索配置日志，显示当前配置的 API Key 烘度
3. **前端错误处理改进**: 修复热门选题搜索前端错误处理, 显示空数据时正确提示错误信息
4. **环境变量示例更新**: 更新 `.env.local.example` 添加 MiniMax 相关配置
5. **开发文档更新**: 更新接口文档、数据库文档、代码注释等

