# 幻想召唤研究所 Fantasy Gacha Lab · 项目文档

> 一个基于 Vue 3 + Vite + TypeScript + GSAP + tsParticles 的纯前端抽卡模拟器

## 📚 文档索引

| 文档 | 说明 |
|---|---|
| [character-image-prompts.md](./character-image-prompts.md) | 角色立绘生成提示词、主题分组和资源路径规范 |
| [gu-reverend-character-prompts.md](./gu-reverend-character-prompts.md) | 蛊真人主题角色立绘提示词和资源路径 |
| [completed.md](./completed.md) | ✅ 已完成功能详细记录（按模块分类）|
| [todo.md](./todo.md) | ⏳ 未完成功能详细记录（按优先级排序）|

---

## 📊 项目最终状态速览

**项目名称**：幻想召唤研究所 Fantasy Gacha Lab
**版本**：v0.1.0
**类型**：纯前端娱乐应用（GitHub Pages 静态部署）
**总工作量**：8 个 Tier 阶段（Tier 1 ~ Tier 2 + 部分 Tier 3 探索）

### 完成度总览

| 类别 | 完成 | 未完成 | 完成率 |
|---|---|---|---|
| 页面 | 8 / 8 | 0 / 8 | 100% |
| 核心功能 | 12 / 12 | 0 / 12 | 100% |
| 高级功能 | 8 / 8 | 0 / 8 | 100% |
| 动画效果 | 8 / 8 | 0 / 8 | 100% |
| 体验优化 | 5 / 8 | 3 / 8 | 62% |
| 部署上线 | 0 / 2 | 2 / 2 | 0% |
| 测试保障 | 0 / 2 | 2 / 2 | 0% |

### 技术栈

- **核心框架**：Vue 3.5 + Vite 8 + TypeScript 6
- **路由**：vue-router 4（hash 模式，适配 GitHub Pages）
- **状态管理**：Pinia 3
- **动画**：GSAP 3.15（核心时序）+ tsParticles 4.2（粒子）
- **音效**：Web Audio API（合成，无外部资源）
- **存储**：localStorage（13 个 key 全部持久化）

### 核心数据

- **8 个页面**：Home / Summon / Result / Collection / Records / Shop / Events / Profile
- **14 个组件**：布局 4 + 抽卡相关 6 + 弹窗 1 + Modal 3
- **0 编译错误**，**0 console 错误**
- **包体积**：75.02 KB gzip（index.js）
- **多 chunk 拆分**：ProfileView / CollectionView / ResultView 等独立 chunk

---

## 🎯 关键里程碑

| 阶段 | 完成内容 | 文件位置 |
|---|---|---|
| **Tier 1.1** | 项目搭建 + 路由 + 5 页面 + 抽卡逻辑 | `src/views/*.vue` |
| **Tier 1.2** | 翻牌动画 + 抽卡按钮波纹 + 星空背景 | `src/components/gacha/` |
| **Tier 1.3** | GSAP + tsParticles 完整集成 | `src/components/gacha/SSRBurst.vue` |
| **Tier 1.4** | 商店 + 货币流通 + 挂机引擎 | `src/views/ShopView.vue` |
| **Tier 1.5** | 每日任务 + 活动 + 免费一抽 | `src/views/EventsView.vue` + `src/data/dailyTasks.ts` |
| **Tier 2.1** | 个人中心 + 角色详情弹窗 + 音效 | `src/views/ProfileView.vue` + `src/components/gacha/CharacterModal.vue` |
| **Tier 2.2** | SSR 金色脉冲 + 保底预警强化 | `src/components/gacha/SSRGoldFlash.vue` |
| **Bug 修复** | 翻牌动画时序 bug 修复 | `src/views/ResultView.vue` |

---

## 🔗 快速链接

- [已完成功能清单 →](./completed.md)
- [待办功能清单 →](./todo.md)
- [原始项目规划文档 →](../幻想召唤研究所_抽卡模拟器项目规划.md)
- [源代码 →](../src/)
- [线上 Demo（待部署）](#)

---

**最后更新**：基于 v0.1.0 构建状态
