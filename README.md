# DiDaOJ-web

<div align="center">
  <img src="https://github.com/hpu-developer/DiDaOJ-web/actions/workflows/github-code-scanning/codeql/badge.svg" alt="CodeQL" />
  <img src="https://img.shields.io/badge/Vue-3-green.svg" alt="Vue 3" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6-orange.svg" alt="Vite" />
  <img src="https://img.shields.io/badge/TDesign-1.15-purple.svg" alt="TDesign" />
  <img src="https://img.shields.io/badge/License-GPL%20v3-blue.svg" alt="License" />
</div>

DiDaOJ-web 是 DiDaOJ 在线评测系统的前端项目，基于 Vue 3 + TypeScript + Vite 构建，提供了用户友好的在线编程评测界面。

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **开发语言**: TypeScript
- **构建工具**: Vite
- **UI 组件库**: TDesign Vue Next
- **状态管理**: Pinia
- **路由管理**: Vue Router
- **HTTP 客户端**: Axios
- **代码编辑器**: Monaco Editor
- **Markdown 编辑器**: md-editor-v3
- **图表库**: ECharts
- **代码风格**: ESLint + Prettier

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173 查看应用

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 项目结构

```
src/
├── apis/            # API 接口定义
├── assets/          # 静态资源
├── auth/            # 认证相关
├── components/      # 通用组件
├── config/          # 配置文件
├── init/            # 初始化代码
├── router/          # 路由配置
├── stores/          # Pinia 状态管理
├── text/            # 文本处理工具
├── time/            # 时间处理工具
├── types/           # TypeScript 类型定义
├── util/            # 通用工具函数
├── views/           # 页面组件
├── App.vue          # 根组件
└── main.ts          # 入口文件
```

## 开发命令

| 命令 | 描述 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |
| `npm run type-check` | TypeScript 类型检查 |
| `npm run lint` | ESLint 代码检查 |
| `npm run format` | Prettier 代码格式化 |

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 GNU General Public License v3 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系我们

如有问题或建议，欢迎提交 [Issue](https://github.com/hpu-developer/DiDaOJ-web/issues) 或 [Pull Request](https://github.com/hpu-developer/DiDaOJ-web/pulls)

---

<div align="center">
  <strong>DiDaOJ - 让编程评测更简单</strong>
</div>
