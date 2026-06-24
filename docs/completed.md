# ✅ 已完成功能详细记录

> 按模块分类的所有已完成功能，含文件位置、关键 API、验证状态

---

## 1. 项目基础设施

### 1.1 Vue 3 + Vite + TypeScript 脚手架
- **位置**：`vite.config.ts`、`tsconfig.json`、`package.json`
- **关键配置**：
  - `base: '/fantasy-gacha-lab/'`（GitHub Pages 子路径）
  - `@/*` 路径别名（指向 `src/`）
  - TypeScript 6 严格模式
- **验证**：`npm run build` 通过，0 编译错误

### 1.2 路由系统（vue-router 4 + hash 模式）
- **位置**：`src/router/index.ts`
- **8 个路由**：
  | 路径 | 名称 | 组件 |
  |---|---|---|
  | `/` | home | HomeView |
  | `/summon` | summon | SummonView |
  | `/result` | result | ResultView |
  | `/collection` | collection | CollectionView |
  | `/records` | records | RecordsView |
  | `/shop` | shop | ShopView |
  | `/events` | events | EventsView |
  | `/profile` | profile | ProfileView |
- **特性**：动态 title 设置、404 → / 重定向

### 1.3 Pinia 状态管理
- **位置**：`src/stores/gachaStore.ts`
- **使用方式**：setup store（组合式 API）
- **状态数量**：8 个 ref（currency、collection、history、pity、settings、lastResult、lastTickAt、idleMultiplier、dailyLastReset、dailyClaimed、freeDrawDate、eventsClaimed、taskProgress、currentBannerId、ssrBurstTrigger）
- **计算属性**：totalDraws、ssrCount、ssrRate、avgPerSSR、collectedCount、idleRates、idleLevel、taskProgressView、activeEvents、activeDiscount、idleDouble、effectiveIdleMultiplier、singleDrawCost、tenDrawCost、freeDrawAvailable
- **方法数量**：30+ 个（抽卡/挂机/任务/活动/货币）

---

## 2. 核心业务功能

### 2.1 抽卡核心算法
- **位置**：`src/utils/gacha.ts`
- **接口**：
  - `drawOne(pool, banner, pityCount, collection)` 单抽
  - `drawTen(pool, banner, pityCount, collection)` 十连抽
- **概率**：SSR 2% / SR 12% / R 86%
- **保底机制**：
  - 90 抽保底：pityCount >= 89 时下次必出 SSR
  - 十连保底：至少 1 SR（强制替换最后一张为 SR）
- **UP 角色加权**：
  - SSR 50% 概率是 UP 角色
  - SR 30% 概率是 UP 角色
- **新角色判断**：isNew = (collection[charId] === 0)
- **验证**：手动测试 100+ 次，pity=89 必出 SSR，十连无 0 SR

### 2.2 货币系统
- **位置**：`src/stores/gachaStore.ts`（addCurrency、spend、resetAll）
- **3 种货币**：💎 宝石、💗 粉晶、🪙 金币
- **获取途径**：
  - 抽卡前：扣除（单抽 160 / 十连 1600，活动折扣可减半）
  - 抽卡后：无（设计为消耗型）
  - 商店兑换：用宝石/粉晶/金币买商品
  - 任务奖励：每日任务
  - 活动奖励：登录/免费活动
  - 挂机累积：每分钟自动增长
- **消耗途径**：
  - 单抽 / 十连
  - 商店购买
- **验证**：所有流入/流出都通过 addCurrency / spend，无散落修改

### 2.3 图鉴系统
- **位置**：`src/views/CollectionView.vue` + `src/components/gacha/CharacterCard.vue` + `src/components/gacha/CharacterModal.vue`
- **数据**：`src/data/characters.ts`（15 个角色：5 SSR + 5 SR + 5 R）
- **筛选**：稀有度（SSR/SR/R）、元素（6 种）、职业（5 种）、搜索框
- **排序**：默认 / 按稀有度 / 按元素
- **收集进度**：左侧环形图 + SSR/SR/R 分类进度
- **未获得角色**：灰显 + 半透明
- **角色详情弹窗**：
  - 大立绘（200×200 + 稀有度光晕）
  - 完整属性（HP/ATK/DEF/SPD 进度条）
  - 角色故事
  - 元素 + 职业 + UP + 数量标签
  - 同稀有度其他角色推荐
  - 5/4/3 颗稀有度星
  - ESC 键关闭 + 点击遮罩关闭
- **验证**：✅ 已完成 100%

### 2.4 抽卡记录系统
- **位置**：`src/views/RecordsView.vue`
- **数据**：`gacha_history` localStorage key
- **字段**：时间、卡池、获得物品、稀有度、抽数（第几抽）
- **功能**：
  - 4 个统计卡：总召唤、SSR 获得、SSR 概率、平均每 SSR
  - 卡池筛选下拉
  - 抽卡历史表格
  - 导出 CSV
  - 清空记录
  - 分页（每页 10 条）
- **验证**：✅ 已完成 100%

### 2.5 抽卡逻辑（performSingleDraw/performTenDraw）
- **位置**：`src/stores/gachaStore.ts`
- **特性**：
  - 自动应用活动折扣
  - 自动应用角色 UP 加权
  - 十连保底（至少 1 SR）
  - 抽到 isNew 角色时推进「收集新角色」任务
  - 触发 SSR 翻面时自动粒子爆发
  - 触发了活动 discount 折扣
- **验证**：✅ 已完成 100%

---

## 3. 商店与挂机系统

### 3.1 商店系统
- **位置**：`src/views/ShopView.vue` + `src/data/shopItems.ts` + `src/stores/gachaStore.ts`（spend、setIdleMultiplier、upgradeIdle）
- **7 个商品**：
  | ID | 名称 | 类型 | 价格 | 效果 |
  |---|---|---|---|---|
  | item_gem_small | 宝石袋 (小) | currency | 200 金币 | +1000 宝石 |
  | item_gem_large | 宝石箱 (大) | currency | 800 金币 | +5000 宝石 |
  | item_pink_small | 粉晶袋 | currency | 300 金币 | +500 粉晶 |
  | item_gold_small | 金币袋 | currency | 200 宝石 | +2000 金币 |
  | item_idle_boost | 挂机加速器 | idle | 500 金币 | 倍率 +0.5x |
  | item_idle_boost_mega | 挂机增幅核心 | idle | 2000 金币 | 倍率 +1.0x |
  | item_special_ticket | 限定抽卡券 | special | 200 粉晶 | +800 宝石 |
- **UI 特性**：
  - 4 个分类 Tab（全部 / 货币 / 挂机升级 / 特殊）
  - 顶部状态：当前倍率 + Lv + 每分钟产出
  - 货币不足时灰显 + 按钮 disabled
  - 购买成功/失败 toast
  - 触发「商店消费 500 金币」任务
- **验证**：✅ 已完成 100%

### 3.2 挂机引擎
- **位置**：`src/stores/gachaStore.ts`（tick、upgradeIdle、setIdleMultiplier）
- **基础产出**：💎1200/分、💗600/分、🪙2400/分
- **倍率升级**：每次 +0.5x，消耗金币 500×当前倍率
- **倍率上限**：10x（MAX_IDLE_MULTIPLIER）
- **离线累积**：8 小时封顶，回归时自动补发
- **App.vue 挂载**：onMounted 启动 1 秒 setInterval，onBeforeUnmount 清理
- **触发任务**：tick 时累加 task_idle_60 进度
- **验证**：✅ 60 秒后货币精确增长 1200/600/2400

---

## 4. 任务与活动系统

### 4.1 每日任务
- **位置**：`src/views/HomeView.vue` + `src/data/dailyTasks.ts` + `src/stores/gachaStore.ts`（progressTask、claimTaskReward、taskProgressView）
- **5 个任务**：
  | ID | 触发 | 奖励 |
  |---|---|---|
  | task_draw_10 | 1 次十连抽 | 💎×100 |
  | task_collect_new | 1 个新角色 | 💗×20 |
  | task_browse_collection | 进入图鉴 | 💎×50 |
  | task_spend_500 | 商店消费 500 金币 | 💗×30 |
  | task_idle_60 | 挂机 60 分钟 | 💎×200 |
- **UI 状态**：
  - 未完成：灰色「未完成」按钮
  - 可领：金色「领取」按钮
  - 已领：✓ 已领
- **每日 0 点重置**：dailyLastReset 自动检查
- **验证**：✅ 已完成 100%

### 4.2 活动系统
- **位置**：`src/views/EventsView.vue` + `src/data/gameEvents.ts` + `src/stores/gachaStore.ts`（activeEvents、claimEventReward、activeDiscount、idleDouble）
- **4 种活动类型**：
  - **login**：登录奖励（2000 宝石 + 500 金币，新人欢迎礼）
  - **discount**：折扣（半价召唤祭，0.5x 抽卡消耗）
  - **double**：双倍（双倍挂机节，挂机产出 ×2）
  - **free**：免费（免费十连券，+800 宝石）
- **自动生效**：discount、double 类型无需按钮
- **手动领取**：login、free 类型点击「领取」
- **持久化**：eventsClaimed 数组
- **过期检查**：基于 ISO endTime 自动隐藏
- **验证**：✅ 已完成 100%

### 4.3 免费一抽
- **位置**：`src/stores/gachaStore.ts`（performFreeDraw、freeDrawAvailable）
- **机制**：每天 1 次基础免费，活动期间每领一张券 +1
- **扣费退还**：内部扣宝石后立即退还，所以用户看到 0 消耗
- **触发任务**：自动 +1 task_draw_10
- **验证**：✅ 已完成 100%

---

## 5. 动画系统

### 5.1 翻牌动画（GSAP）
- **位置**：`src/components/gacha/FlipCard.vue`
- **机制**：
  - 父级 rotateY 0→180 度（GSAP timeline）
  - 子级同步 rotateY 0→180（抵消父级让内容正向）
  - 翻转过半（45%）时 back opacity → 0，front opacity 0→1 + scale 0.92→1
  - 0.65s 持续时间
- **修复 bug**（重要）：之前传 `:delay="idx * 0.08"` 导致累计延迟太长，后 4-5 张卡"卡死在卡背"——已修复为 `:delay="0"`
- **验证**：✅ 10 张卡全部正向翻面，0 console 错误

### 5.2 抽卡按钮波纹（GSAP）
- **位置**：`src/components/gacha/DrawButton.vue`
- **机制**：
  - 点击位置精准定位的波纹
  - `gsap.fromTo({ scale: 0, opacity: 0.85 }, { scale: 1.2, opacity: 0, duration: 0.85, ease: 'power2.out' })`
  - 整体 brightness flash（GSAP yoyo）
  - 缩放反馈（GSAP yoyo scale 0.94）
- **验证**：✅ 已完成 100%

### 5.3 全屏金色脉冲（SSR 出货）
- **位置**：`src/components/gacha/SSRGoldFlash.vue`
- **机制**：
  - `gsap.fromTo({ opacity: 0, scale: 0.6 }, { opacity: 0.9, scale: 1.4, duration: 0.4, yoyo: true, repeat: 1 })`
  - 屏幕震动 12 次（GSAP x ±8px yoyo）
  - 径向渐变（金色→紫色→透明）
  - mix-blend-mode: screen
- **触发**：ResultView 翻 SSR 卡时调用 `ssrFlashRef.value.flash()`
- **验证**：✅ 抽到 SSR 时 flashOpacity 验证到 0.8982

### 5.4 SSR 粒子爆发（tsParticles）
- **位置**：`src/components/gacha/SSRBurst.vue` + `src/components/layout/TsParticlesBg.vue`
- **机制**：
  - 全屏 canvas 容器（1246×620）
  - 中心爆发 60 个星形粒子 + 20 个紫色火花
  - 重力 + 空气阻力物理模拟
  - `container.particles.addParticle()` 一次性 push
- **关键修复**：
  - **@tsparticles/vue3 API 修复**：default export 是 install function `(app, options) => void`，不是 Vue plugin；必须用 `Particles(app, { init: async (engine) => await loadSlim(engine) })`
  - 手动写 `addParticle` 替代 `emitter`（slim 包不含 emitters 插件）
- **验证**：✅ SSR 出货时 canvas 存在

### 5.5 背景星空（CSS + tsParticles）
- **位置**：`src/components/layout/StarField.vue`
- **机制**：
  - 3 层 CSS 静态星点（不同密度、不同位置、不同颜色）
  - 3 处大光晕（紫金粉，filter: blur(80px)，pulse 8s 动画）
  - **tsParticles 流星层**：2 个 emitter（金/紫双色，方向 bottom-left，速度 220+，life 0.8s）
- **验证**：✅ 流星每隔 0.8-3s 划过

### 5.6 Banner 浮动光点
- **位置**：`src/components/gacha/GachaBanner.vue`
- **机制**：tsParticles 18 个金/紫/粉粒子环绕主立绘（speed 0.5-1.5 random，twinkle 0.08 频率）
- **触发**：每次 Banner mount
- **验证**：✅ 6 个光点环绕「艾」字

### 5.7 背景渐变 + 卡片呼吸光
- **位置**：全局 CSS（`src/assets/styles/global.css`）
- **机制**：
  - 背景：radial-gradient（紫顶 + 蓝底 + base color）
  - 卡片呼吸光：稀有度光晕（SSR 金 / SR 紫 / R 蓝）
  - 渐变流光（背景 panel 边框 hover）
- **验证**：✅ 已完成 100%

### 5.8 保底预警动画强化
- **位置**：`src/views/SummonView.vue`（pity-track 样式）
- **三档渐进**：
  - **6-10 抽（pityLeft ≤ 10）**：粉色边框 + 抖动 0.6s + 渐变流光（粉/金/粉）
  - **1-5 抽（pityLeft ≤ 5）**：金色边框 + 抖动 0.4s + 金色脉冲 + 文字加速
  - 0 抽：归位
- **验证**：✅ 已完成 100%

---

## 6. 体验优化

### 6.1 个人中心（ProfileView）
- **位置**：`src/views/ProfileView.vue`
- **5 大模块**：
  - **玩家信息**：头像 + Lv + 经验条 + 称号
  - **8 项详细统计**：总召唤、SSR、SR、出货率、平均 SSR、图鉴、历史、保底
  - **5 项资源总览**：3 货币 + 挂机倍率 + 活动数
  - **5 级称号系统**：见习召唤师 / 星辰探索者 / SSR 猎人 / 召唤大师 / 传说级召唤师（按总抽数 + SSR 数解锁）
  - **8 大成就**：初次召唤、收藏家、完美收藏、欧皇初现、金色传说、百抽达成、千抽之路、挂机大师
  - **3 项设置**：动画开关（toggle UI）/ 音效开关 / 重置存档（带 confirm）
- **入口**：
  - 顶部导航「我的 PROFILE」tab
  - 右侧头像点击（CurrencyBar 头像）
- **验证**：✅ 已完成 100%

### 6.2 角色详情弹窗（CharacterModal）
- **位置**：`src/components/gacha/CharacterModal.vue`
- **整合**：`CollectionView` 角色卡点击触发
- **特性**：
  - 大立绘（200×200 + 稀有度光晕）
  - 完整属性（HP/ATK/DEF/SPD 进度条）
  - 角色故事
  - 元素 + 职业 + UP + 数量标签
  - 同稀有度其他角色推荐
  - 5/4/3 颗稀有度星
  - ESC 键关闭 + 点击遮罩关闭 + ✕ 按钮关闭
  - Vue Transition 缩放/淡入动画
- **验证**：✅ 点击艾莉娅打开弹窗，按 ESC 关闭

### 6.3 音效系统（Web Audio API 合成）
- **位置**：`src/utils/sound.ts` + 全局 `setSoundEnabled()`
- **8 种音效**：
  | 名称 | 触发 | 实现 |
  |---|---|---|
  | playClick | 抽卡按钮 | 短促 1200→800Hz square |
  | playFlip | 翻牌 | 600→200Hz sine 0.25s |
  | playSSR | 翻 SSR | 4 音琶音 C5-E5-G5-C6 + G6 尾音 |
  | playSR | 翻 SR | 3 音琶音 C5-E5-G5 |
  | playR | 翻 R | 单音 392Hz |
  | playBuy | 商店购买 | 880Hz + 1320Hz 间隔 0.1s |
  | playClaim | 任务领取 | 3 音铃声 E5-A5-D6 |
  | playError | 错误 | 200→100Hz sawtooth |
- **懒加载 AudioContext**（首次交互后才创建，绕过自动播放限制）
- **fade in/out 包络**（attack + decay）保证不爆音
- **Profile 开关切换**：soundEnabled 持久化
- **验证**：✅ 5 个接入点（DrawButton / FlipCard / ResultView / ShopView / HomeView）全部接好

### 6.4 结果页入场时间轴（GSAP）
- **位置**：`src/views/ResultView.vue`（runTimeline）
- **完整编排**：
  ```
  0.0s ────── 标题缩放淡入（back.out 0.6s）
  0.3s ────── 卡片 #1 飞行入场（back.out 0.5s）
  0.4s ────── 卡片 #1 翻面（0.65s）
  ...
  1.3s ────── 卡片 #10 飞行入场
  1.7s ────── 卡片 #10 翻面
  1.9s ────── 底部三块整体淡入
  ```
- **修复 bug**：之前用 setTimeout 链，FlipCard 的 delay 又叠加，导致后 4-5 张卡卡死在卡背
- **清理机制**：`pendingTimers` + `mainTimeline` 句柄可 kill
- **验证**：✅ 10 张卡全部正向翻面

### 6.5 持久化（13 个 localStorage key）
- **位置**：`src/types/index.ts`（STORAGE_KEYS）+ `src/utils/storage.ts`
- **13 个 key**：
  | Key | 用途 |
  |---|---|
  | gacha_history | 抽卡历史 |
  | gacha_collection | 收集统计（角色 → 次数）|
  | gacha_pity | 各卡池保底计数 |
  | gacha_currency | 货币（宝石/粉晶/金币）|
  | gacha_settings | 设置（动画/音效开关）|
  | gacha_last_result | 上次抽卡结果（result 页）|
  | gacha_last_tick_at | 挂机引擎上次 tick 时间 |
  | gacha_idle_multiplier | 挂机倍率 |
  | gacha_daily_last_reset | 每日任务上次重置日期 |
  | gacha_daily_claimed | 今日已领取的任务 ID |
  | gacha_free_draw_date | 上次免费一抽日期 |
  | gacha_events_claimed | 活动奖励已领取 ID |
- **验证**：✅ 刷新页面后所有数据保留

---

## 7. 关键 Bug 修复记录

### 7.1 翻牌镜像 bug
- **症状**：卡片翻面后内容左右镜像
- **原因**：GSAP matrix3d 与 CSS backface-visibility 不兼容
- **修复**：父级 + 子级都 rotateY 180（视觉叠加归零）
- **位置**：`src/components/gacha/FlipCard.vue`
- **验证**：✅ 角色名 + 立绘字 + 职业 + 星级全部正向

### 7.2 翻面时长 bug
- **症状**：点击抽卡后部分卡卡死在卡背
- **原因**：ResultView 用 setTimeout 控制时序 + FlipCard `delay=idx*0.08` 累加，导致后 4-5 张翻面时间超过 3.5s
- **修复**：
  - ResultView FlipCard `:delay="0"`
  - FlipCard front opacity fromTo delay 从 `duration*0.5` 改为 `duration*0.45`
  - 重构 ResultView 用 GSAP timeline.call 替代 setTimeout
- **位置**：`src/views/ResultView.vue` + `src/components/gacha/FlipCard.vue`
- **验证**：✅ 10 张卡 3.5s 内全部正向翻面

### 7.3 tsParticles vue3 API 踩坑
- **症状**：`e.provide is not a function`
- **原因**：@tsparticles/vue3 的 default export 是 install function `(app, options) => void`，不是 Vue plugin
- **修复**：手动调用 `Particles(app, { init: ... })` 而不是 `app.use(Particles, ...)`
- **位置**：`src/main.ts` + `src/types/tsparticles-vue3.d.ts`
- **验证**：✅ 0 console 错误

### 7.4 十连保底 bug
- **症状**：十连 0 SR（违反"至少 1 SR"设计）
- **原因**：保底替换最后一张时用 `drawOne(pity=0)` 走正常概率，86% 仍出 R
- **修复**：直接构造 GachaItem 强制 `rarity: 'SR'`，从 SR 池随机选（50% UP 加权）
- **位置**：`src/utils/gacha.ts`
- **验证**：✅ 十连保底机制稳定生效

### 7.5 SSRGoldFlash CSS 注释 bug
- **症状**：build 失败 "Unexpected '/'"
- **原因**：CSS 注释 `/ 危险...*/` 漏写 `*`
- **修复**：`/* 危险... */`
- **验证**：✅ Build 通过

---

## 8. 项目数据

### 8.1 角色数据（15 个）
- **位置**：`src/data/characters.ts`
- **分布**：5 SSR（艾莉娅、凯尔、伊芙琳、莱娜、亚瑟）+ 5 SR（露诺、月、莉亚、雷恩、塞莲）+ 5 R（雷欧、薇安、诺亚、提亚、艾琳）
- **字段**：id、name、title、rarity、element、role、image、description、isUp
- **立绘**：emoji 占位（待替换为真实图片）

### 8.2 卡池数据（3 个）
- **位置**：`src/data/banners.ts`
- **星穹之主 · 艾莉娅 限时 UP**（默认选中）
- **绯焰魔女 · 伊芙琳 限时 UP**
- **常驻召唤**
- **字段**：id、name、type、cover、startTime、endTime、upCharacterIds、rates

### 8.3 商品数据（7 个）
- 详见 § 3.1 商店系统

### 8.4 任务数据（5 个）
- 详见 § 4.1 每日任务

### 8.5 活动数据（4 个）
- 详见 § 4.2 活动系统

---

## 9. 构建产物

### 9.1 包大小
- **index.js**（gzip）：75.02 KB
- **gsap**（gzip）：27.28 KB
- **tsParticles**（gzip）：~12 KB Container + 多个子模块
- **CSS 总计**：~35 KB

### 9.2 独立 chunk 拆分
- ProfileView.js：9.02 KB
- CollectionView.js：9.17 KB
- ResultView.js：9.83 KB
- HomeView.js：5.27 KB
- SummonView.js：5.21 KB
- ShopView.js：4.83 KB
- EventsView.js：3.07 KB
- RecordsView.js：4.54 KB
- sound.js：1.54 KB
- 其他子模块 ~10 KB

### 9.3 构建配置
- **TS 严格模式**：✅ 通过
- **ESLint**：✅ 通过（部分警告，已清理）
- **dev server 启动**：~2 秒
- **production build**：~600 ms

---

**最后更新**：基于 v0.1.0 已完成功能
