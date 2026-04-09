# 开发文档

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

