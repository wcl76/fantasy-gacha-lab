# ⏳ 未完成功能详细记录

> 按优先级排序的所有未完成功能，含文件位置、依赖、实现建议

---

## 📊 待办总览

| 优先级 | 类别 | 功能 | 工作量 | 价值 |
|---|---|---|---|---|
| ⭐⭐⭐ | 部署 | **GitHub Pages 实际部署** | 小（1h）| 高 — 项目可公开访问 |
| ⭐⭐⭐ | 体验 | **响应式移动端深度优化** | 中（2h）| 高 — 触达更多用户 |
| ⭐⭐ | 体验 | **抽卡结果分享图** | 中（2h）| 中 — 社交传播 |
| ⭐⭐ | 体验 | **背景音乐** | 中（2h）| 中 — 沉浸感 |
| ⭐ | 测试 | **单元测试（gacha 概率算法）** | 中（2h）| 中 — 质量保障 |
| ⭐ | 测试 | **TypeScript 严格模式清理** | 小（30min）| 低 — 维护性 |
| ⭐ | 资源 | **角色立绘替换** | 大（需图）| 高 — 视觉完成品 |
| ⭐ | 资源 | **音效资源化（MP3 文件）** | 中 | 低（已用 Web Audio 合成）|
| ⭐ | 体验 | **任务奖励提示强化** | 小 | 中 |
| ⭐ | 体验 | **成就解锁动画** | 小 | 中 |
| ⭐ | 体验 | **离线收益提示 modal** | 小 | 中 |
| ⭐ | 高级 | **PWA 离线访问** | 中 | 中 |
| ⭐ | 高级 | **多语言支持 i18n** | 中 | 低 |
| ⭐ | 高级 | **角色详情页路由** | 小 | 中 |
| ⭐ | 高级 | **更多角色 / 卡池** | 大（需内容）| 中 |
| ⭐ | 数据 | **数据导入/导出** | 小 | 中 |

---

## 🚀 Tier 1：部署上线

### 1.1 GitHub Pages 部署

**目标**：让项目能公开访问

**当前状态**：
- ✅ `package.json` 有 `homepage` 字段
- ✅ `vite.config.ts` 配置 `base: '/fantasy-gacha-lab/'`
- ✅ `package.json` 有 `deploy` 脚本（`gh-pages -d dist`）
- ✅ `gh-pages` 包已安装
- ❌ **没有实际部署**

**实现步骤**：
1. 创建 GitHub 仓库 `fantasy-gacha-lab`（如果还没有）
2. 初始化 git 仓库并推送到 GitHub
3. 配置 GitHub Pages 源为 `gh-pages` 分支
4. 运行 `npm run deploy`

**或更现代的方案**：GitHub Actions 自动部署
- 创建 `.github/workflows/deploy.yml`
- 触发：push 到 main 分支
- 步骤：npm ci → npm run build → 部署到 Pages

**文件位置**：
- `.github/workflows/deploy.yml`（新建）
- `package.json`（homepage 字段需修改为实际 URL）

**验证**：
- 访问 `https://<username>.github.io/fantasy-gacha-lab/` 看到完整应用
- 抽卡、商店、活动、个人中心等所有功能正常

---

## 🎨 Tier 2：体验优化

### 2.1 响应式移动端深度优化

**当前状态**：
- ✅ 基础响应式：@media (max-width: 1000px / 700px / 500px) 切换列数
- ⚠️ 召唤页抽卡按钮在手机上可能过窄
- ⚠️ 角色详情弹窗在手机上需要全屏化
- ⚠️ 商店页 3 列在平板变 2 列
- ❌ 没有 touch 友好的交互（点击区域最小 44px）
- ❌ 没有 viewport meta 优化（虽然有，但需要验证）

**实现建议**：
1. **基础优化**（优先）：
   - 顶部导航：在 < 800px 时变成汉堡菜单
   - 抽卡按钮：手机上 stacking（垂直排列）
   - 角色详情：全屏 modal（去掉 max-width: 760px）
   - 表格：横向滚动
2. **触摸优化**：
   - 所有按钮最小 44×44px
   - 滑动手势支持（如角色卡滑动查看详情）
3. **性能优化**：
   - 移动端关闭部分动画（tsParticles 流星）
   - 图片懒加载

**文件位置**：
- 所有 view 组件的 `<style scoped>` 块
- `src/components/layout/AppHeader.vue`（导航汉堡菜单）

**验证**：
- iPhone 12 模拟器：所有页面正常显示
- 触摸：所有按钮 ≥ 44px

---

### 2.2 抽卡结果分享图

**目标**：抽完卡后能生成图片分享到社交平台

**当前状态**：
- ❌ 完全未做

**实现方案**：使用 `html2canvas` 库（~50KB）

**功能**：
- ResultView 加一个「分享」按钮（已有，但只 alert）
- 点击后用 html2canvas 把结果区域转成 canvas
- 导出为 PNG，自动下载
- 文案模板：「我在幻想召唤研究所抽到了 N 个 SSR！」

**实现步骤**：
1. `npm install html2canvas`
2. ResultView 加「保存图片」按钮
3. 点击后：
   - 创建隐藏的分享卡片 DOM（标题 + 10 张小卡 + 统计 + 二维码）
   - `html2canvas(shareCard)` 转 canvas
   - `canvas.toDataURL()` → `<a download>`
4. 分享卡片样式：
   - 顶部：「幻想召唤研究所」logo
   - 中部：10 张小卡缩略图
   - 底部：统计（SSR/SR/R 数量 + 日期 + 抽卡次数）
   - 背景：深色 + 金色装饰

**文件位置**：
- `src/components/gacha/ShareCard.vue`（新建）
- `src/views/ResultView.vue`（集成）

**验证**：
- 抽完卡后点击「分享」
- 下载 PNG 文件
- 分享到微信/QQ/微博能正常显示

---

### 2.3 背景音乐

**目标**：增强沉浸感

**当前状态**：
- ❌ 完全未做
- ✅ 已有音效系统（`src/utils/sound.ts` 用 Web Audio 合成）

**实现方案**（两种）：

**方案 A：Web Audio 合成 ambient music**
- 加 `playBGM(type)` 函数，合成简单的循环音
- 例：Summon 页：低频 ambient + 钟琴点缀
- 例：Result 页：高潮 + 渐弱
- 优点：0 外部资源
- 缺点：质量有限

**方案 B：使用 mp3/ogg 资源**
- 找免费的 gacha BGM（如 open game art、incompetech）
- 放到 `public/bgm/`
- 播放：`<audio loop autoplay src="/bgm/summon.mp3">`
- 优点：质量高
- 缺点：增加 ~2-5MB 资源

**文件位置**：
- `src/utils/bgm.ts`（新建）
- `src/components/layout/AppLayout.vue`（挂载 audio）
- `public/bgm/*.mp3`（资源）

**验证**：
- 抽卡时 BGM 切换
- Profile 设置开关可静音
- 移动端有静音限制（iOS Safari 必须用户主动触发音频）

---

### 2.4 任务奖励提示强化

**当前状态**：
- ✅ 任务完成 → 「领取」按钮可点
- ⚠️ 领取后只有 toast 提示（"✓ 领取成功：xxx"）
- ❌ 完成任务时**没有主动提示**

**实现**：
- 完成时弹一个奖励飞入动画（货币从任务卡片飞到顶部货币栏）
- 任务卡片震动 + 金色发光
- 全局通知（右下角弹出 "🎉 任务完成！💎 +100"）

**文件位置**：
- `src/components/common/TaskRewardAnimation.vue`（新建）
- `src/stores/gachaStore.ts`（claimTaskReward 时触发事件）

**验证**：
- 完成任务后看到货币飞入动画
- 全局通知 3 秒后消失

---

### 2.5 成就解锁动画

**当前状态**：
- ✅ 成就列表显示 + 进度条
- ❌ 达成时无特殊动画

**实现**：
- 达成瞬间：成就卡片震动 + 金色光晕
- 弹窗：「🏆 成就解锁！xxx」（带 +X EXP 提示）
- Profile 顶部经验条动画增长

**文件位置**：
- `src/views/ProfileView.vue`（成就卡片）
- 通用通知组件

**验证**：
- 完成 1 个成就时看到弹窗

---

### 2.6 离线收益提示 modal

**当前状态**：
- ✅ 离线累积（最多 8h）自动补发
- ❌ 回归时**没有提示**

**实现**：
- 启动时（onMounted）检测「上次 tick 距今 > 5 分钟」→ 弹 modal
- 展示：「你离线了 X 小时 Y 分钟，获得 💎N 💗N 🪙N」
- 倒计时 5 秒后自动关闭，可手动关闭

**文件位置**：
- `src/components/common/OfflineRewardModal.vue`（新建）
- `src/App.vue`（挂载）
- `src/stores/gachaStore.ts`（暴露 `lastSeenTickAt`）

**验证**：
- 关闭页面 5 分钟后回来
- 看到离线收益 modal

---

## 🧪 Tier 3：质量保障

### 3.1 单元测试（gacha 概率算法）

**当前状态**：
- ❌ 0 测试
- ⚠️ `gacha.ts` 概率算法是核心逻辑，需要保证正确

**实现方案**：Vitest（Vite 官方推荐）

**测试用例**：
- `gacha.ts`：
  - 基础概率：10000 次抽样 SSR 比例 ≈ 2%
  - 90 保底：连续 89 次非 SSR，第 90 次必 SSR
  - UP 加权：1000 次抽样 UP 角色比例 ≈ 50%（SSR）
  - 十连保底：1000 次十连，必有 ≥ 1 SR
  - 边界情况：pity=0 + 89 各种状态
- `storage.ts`：
  - loadJSON fallback
  - saveJSON 异常处理
- `format.ts`：
  - formatNumber 各种数字
  - formatPercent 精度

**文件位置**：
- `tests/gacha.test.ts`（新建）
- `tests/format.test.ts`（新建）
- `tests/storage.test.ts`（新建）
- `vitest.config.ts`（新建）

**实现步骤**：
1. `npm install -D vitest @vitest/ui`
2. 配置 `vitest.config.ts`
3. 写测试用例
4. `npm test`

**验证**：
- `npm test` 全部通过
- 覆盖率 > 80%

---

### 3.2 TypeScript 严格模式清理

**当前状态**：
- ✅ TypeScript 6 严格模式
- ⚠️ 之前有未使用 import 等 lint 警告（已部分修复）

**实施**：
- 启用 `noUnusedLocals: true`、`noUnusedParameters: true`
- 启用 `noImplicitReturns: true`、`strictNullChecks: true`
- 清理所有 `// @ts-ignore` 注释
- 用 `type`/`interface` 严格化所有函数签名

**文件位置**：
- `tsconfig.app.json`
- `tsconfig.json`
- 全项目文件

**验证**：
- `vue-tsc --noEmit` 0 错误
- 0 lint 警告

---

## 🎨 Tier 4：内容扩充

### 4.1 角色立绘替换

**当前状态**：
- ⚠️ 15 个角色都用 emoji 占位（🔥 ❄️ ⚡ 🌿 🌙 ✨）
- ⚠️ 立绘字用字符（"诺"、"艾"等）

**实施**：
- 设计或外包 15 张角色立绘 PNG（300×400）
- 放到 `public/characters/`
- 修改 `Character.image` 字段指向实际文件
- 立绘字消失，改用真正图片

**文件位置**：
- `public/characters/*.png`
- `src/data/characters.ts`（image 字段）

**验证**：
- 角色卡片显示真实立绘

---

### 4.2 更多角色 + 卡池

**当前状态**：
- 15 角色 / 3 卡池

**实施**：
- 扩到 30+ 角色（按规划文档：SSR 28 + SR 45 + R 49 = 122）
- 加 4-5 个限时活动卡池（新年、周年、联动）

**验证**：
- 图鉴更丰富
- 抽卡可选择卡池

---

### 4.3 数据导入/导出

**当前状态**：
- ✅ Records 页面有「导出 CSV」
- ❌ 无导入功能

**实施**：
- Profile 加「导入存档」按钮（粘贴 JSON）
- 「导出存档」按钮（生成 JSON 字符串）
- 玩家可换设备恢复数据

**文件位置**：
- `src/views/ProfileView.vue`

---

## 🛠️ Tier 5：高级功能

### 5.1 PWA 离线访问

**实施**：
- `vite-plugin-pwa` 自动生成 service worker
- `manifest.webmanifest` 配置图标/主题色
- 离线时显示「已离线」状态条
- 安装到桌面图标

**价值**：中（增加留存，但用户场景有限）

### 5.2 多语言 i18n

**实施**：
- `vue-i18n` 框架
- 默认中文，en-US 翻译
- 切换器在 Profile

**价值**：低（项目主题是中文游戏）

### 5.3 角色详情独立路由

**实施**：
- `/character/:id` 路由
- 浏览器后退按钮可关闭
- 可分享链接

**价值**：中

### 5.4 暗/亮主题切换

**实施**：
- 亮色主题（白底 + 浅紫）
- 现有暗色主题
- Profile 切换开关

**价值**：中

### 5.5 抽卡模拟排行（云端）

**实施**：需要后端，**不在纯前端范围**
- 用户分享成绩到排行榜
- 比较其他玩家的 SSR 数量

**价值**：高（社交传播）但**实现复杂**

### 5.6 真实支付 / 商城

**实施**：需要后端 + 支付 SDK
- 微信/支付宝 SDK
- 真实抽卡

**价值**：高但**实现极复杂**

---

## 📋 实施路线图建议

按 ROI（投入产出比）排序：

### 短期（1-2 天内可见成果）
1. **GitHub Pages 部署**（⭐⭐⭐）— 让项目可访问
2. **任务奖励提示强化**（⭐）— 任务闭环体验
3. **离线收益 modal**（⭐）— 回归反馈
4. **TypeScript 严格清理**（⭐）— 质量保障

### 中期（1 周内）
5. **响应式移动端深度优化**（⭐⭐⭐）— 触达手机用户
6. **抽卡结果分享图**（⭐⭐）— 社交传播
7. **背景音乐**（⭐⭐）— 沉浸感
8. **单元测试**（⭐）— 质量保障

### 长期（需要更多资源）
9. **角色立绘替换**（⭐）— 视觉完成品
10. **更多角色 / 卡池**（⭐）— 内容扩充
11. **PWA 离线访问**（⭐）— 高级功能
12. **角色详情独立路由**（⭐）— 高级功能

---

## 🔄 实现建议

**如果开始做，建议流程**：

1. **每天一个 Tier 1 项**：确保每天都有可用成果
2. **每周一次回顾**：检查 todo.md，更新优先级
3. **每完成一项**：更新 completed.md + README.md
4. **每两周一次 build 优化**：检查包大小、性能

---

**最后更新**：基于 v0.1.0 当前状态
