# 微信公众号采集重写计划

## 目标
完全参照开源项目 Wechat-Rss 的实现方式，重写微信公众号采集功能

## 开源项目核心实现分析

### 1. 授权流程 (授权服务器.py)

```
用户访问授权页面 → 生成二维码 → 用户扫码 → 轮询检查状态 → 授权成功获取Cookie
```

**关键点：**
- 使用 `WX_API.GetCode()` 生成二维码
- 轮询检查授权状态（最多60次，每次1-2秒）
- 授权成功后保存 Cookie 和过期时间

### 2. 添加公众号流程 (werss.py /add)

```
输入文章URL → 解析获取__biz参数 → 输入公众号名称 → 保存到数据库
```

**关键点：**
- 从URL提取 `__biz` 参数
- 如果URL中没有，则请求页面从HTML中提取
- 生成 `mp_id = f"MP_WXS_{biz}"`
- 保存 `faker_id = biz`

### 3. 采集文章流程 (wx.py get_Articles)

**API端点：** `https://mp.weixin.qq.com/cgi-bin/appmsgpublish`

**请求参数：**
```python
params = {
    "sub": "list",
    "sub_action": "list_ex",
    "begin": 0,
    "count": cfg.get("count"),
    "fakeid": faker_id,
    "token": wx_cfg.get("token"),
    "lang": "zh_CN",
    "f": "json",
    "ajax": 1
}
```

**响应解析：**
```python
data = data['publish_page']['publish_list']
for i in data:
    art = i['publish_info']
    art = json.loads(art)
    art = art['appmsgex']
    art = art[0]
    # 提取字段：
    # - title
    # - cover (封面图)
    # - link (文章链接)
    # - update_time
    # - create_time
```

### 4. 搜索公众号 (base.py search_Biz)

**API端点：** `https://mp.weixin.qq.com/cgi-bin/searchbiz`

**请求参数：**
```python
params = {
    "action": "search_biz",
    "begin": offset,
    "count": limit,
    "query": kw,
    "token": self.token,
    "lang": "zh_CN",
    "f": "json",
    "ajax": "1"
}
```

**响应解析：**
```python
msg['publish_page'] = json.loads(msg['publish_page'])
# 返回搜索结果列表
```

### 5. 文章内容提取 (wx.py content_extract)

使用 BeautifulSoup 解析HTML：
- 找到 `js_content` div
- 处理图片 `data-src` 属性
- 设置图片宽度为 1080px

## 当前实现问题

### 问题1: 错误的API端点
**当前代码：**
```typescript
const url = `https://mp.weixin.qq.com/cgi-bin/appmsg?action=list_ex&...`;
```

**正确应该是：**
```typescript
const url = `https://mp.weixin.qq.com/cgi-bin/appmsgpublish?sub=list&sub_action=list_ex&...`;
```

### 问题2: 错误的响应解析
**当前代码：**
```typescript
const appMsgList = data.app_msg_list || [];
```

**正确应该是：**
```typescript
const publishList = data.publish_page?.publish_list || [];
// 然后解析 publish_info -> appmsgex
```

### 问题3: 公众号名称显示乱码
当前实现没有正确获取公众号名称，而是使用 `公众号_${biz}` 格式

## 重写计划

### 阶段1: 修复后端API (route.ts)

1. 修改 `fetchWechatArticles` 函数：
   - 更改API端点为 `appmsgpublish`
   - 更新请求参数
   - 修复响应解析逻辑

2. 添加 `searchBiz` 函数：
   - 实现公众号搜索功能
   - 返回正确的公众号名称

### 阶段2: 修复前端组件

1. 修改授权流程：
   - 简化为扫码授权
   - 移除手动输入Cookie的步骤

2. 修改添加公众号流程：
   - 通过URL解析或搜索获取公众号信息
   - 正确显示公众号名称

### 阶段3: 验证测试

1. 测试授权流程
2. 测试添加公众号
3. 测试文章采集
