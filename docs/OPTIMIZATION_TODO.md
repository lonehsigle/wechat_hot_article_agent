# 系统化优化 Todo

本文件现在只作为入口索引，不再作为可变任务状态表。

原因：长期任务如果把“需求基线、todo 勾选、执行证据”混在同一个文件里，Codex 在上下文压缩、恢复或继续执行时容易把目标和进度一起改写，导致 todo 漂移。

## 当前稳定任务流

- 需求基线：`docs/specs/systematic-optimization.spec.md`
- 固定任务清单：`docs/specs/systematic-optimization.tasks.md`
- 当前执行状态：`docs/specs/systematic-optimization.ledger.md`
- 验证证据：`docs/specs/systematic-optimization.evidence.md`
- 锁定清单：`docs/specs/systematic-optimization.manifest`

## 执行规则

1. 继续优化前先运行：

```bash
bash scripts/verify-specs.sh
```

2. 不在 `systematic-optimization.spec.md` 或 `systematic-optimization.tasks.md` 里改状态、打勾或重写验收。

3. 实现中只更新 `systematic-optimization.ledger.md` 的状态。

4. 只有 freshly verified 的命令结果才能写入 `systematic-optimization.evidence.md`。

5. 如果需求真的变化，先生成新版本 spec/tasks/manifest，再继续执行，不能静默修改旧基线。

## 当前需求定义

你要的不是普通代码整理，而是把当前程序推进到“实战可用、边界诚实、可持续优化”的状态：

- 从第一性原理检查每个功能点：用户点击后是否真的能完成业务动作，而不是只有按钮、文案或模拟数据。
- 根据外部平台真实能力补齐路线：公众号草稿、发布、统计走官方接口；抖音、小红书等热点源必须有合规数据源契约，不能把 cookie 抓取或 mock 当成稳定生产能力。
- 不考虑 macOS 本地环境噪音，但必须保证 git 里没有敏感信息，运行密钥只留在环境变量或服务端存储。
- 沿用 karpathy-guidelines 的外科式改动：先修正产品契约级谎言和隐患，再小步补齐真实能力，不做大而空的重写。
- 最终交付必须有代码实现、测试/构建/扫描证据和剩余风险说明。
