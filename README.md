# 幻想召唤研究所 Fantasy Gacha Lab

> 一个基于 Vue 3 + Vite + TypeScript + GSAP + tsParticles 的纯前端抽卡模拟器

## 📚 项目文档

详细的已完成功能、待办事项、技术栈说明已迁移到 `docs/` 目录：

- 📖 **[文档总览 →](./docs/README.md)**
- ✅ **[已完成功能详细记录 →](./docs/completed.md)**
- ⏳ **[未完成功能详细记录 →](./docs/todo.md)**

## 🎯 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 部署到 GitHub Pages（需先配置）
npm run deploy
```

## 🛠️ 技术栈

- **核心框架**：Vue 3.5 + Vite 8 + TypeScript 6
- **状态管理**：Pinia 3
- **路由**：vue-router 4
- **动画**：GSAP 3.15 + tsParticles 4.2
- **音效**：Web Audio API（合成）
- **存储**：localStorage

## 📁 项目结构

```
fantasy-gacha-lab/
├── docs/               # 项目文档（已完成 + 待办）
├── public/             # 静态资源
├── src/
│   ├── components/     # 组件
│   │   ├── gacha/      # 抽卡相关（Card/Modal/FlipCard...）
│   │   └── layout/     # 布局（Header/Footer/StarField）
│   ├── data/           # 静态数据（characters/banners/shopItems...）
│   ├── stores/         # Pinia store
│   ├── types/          # TypeScript 类型定义
│   ├── utils/          # 工具函数（gacha/sound/format/storage）
│   ├── views/          # 页面组件（Home/Summon/Result/...）
│   ├── App.vue         # 根组件
│   └── main.ts         # 入口
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🎮 项目状态

- **8 个页面**（100% 完成）
- **核心功能**（100% 完成）
- **高级功能**（100% 完成）
- **部署上线**（0% 完成）
- **测试保障**（0% 完成）

详细进度见 [docs/README.md](./docs/README.md)

---

最后更新：v0.1.0
