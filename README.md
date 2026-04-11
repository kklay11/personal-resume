# 模块化简历编辑器

一个基于 **React + TypeScript + Vite** 的在线简历编辑器，支持左侧模块化填写、右侧 A4 分页实时预览，以及高质量 PDF 导出。

## 功能特点

- 左侧分模块编辑：基本信息、教育背景、项目经历、专业技能、获奖经历、校园经历、实习经历、工作经历、证书信息、个人评价
- 支持自定义简历模块
- 支持模块显示/隐藏、上下排序、标题重命名
- 右侧实时分页预览，尽量与导出 PDF 保持一致
- 支持头像上传与本地自动保存
- 支持简历样式配置：
  - 主题色
  - 模块标题字号
  - 模块内容字号
  - 行高
  - 模块间距
  - 页边距
  - 基本信息头部显隐
- 支持导出多页 PDF

## 技术栈

- React 18
- TypeScript
- Vite
- html2canvas
- jsPDF

## 项目结构

```text
src/
  App.tsx               # 页面布局、配置抽屉、分页预览
  main.tsx              # 入口文件
  resumeConfig.ts       # 简历模块 schema 与默认数据
  types.ts              # 类型定义
  hooks/
    useResumeBuilder.ts # 简历状态管理与本地持久化
  lib/
    pdf.ts              # PDF 导出逻辑
  styles.css            # 全局样式与简历排版样式
```

## 本地运行

先确保本机已安装 **Node.js 18+**。

```bash
npm install
npm run dev
```

启动后打开终端输出的本地地址，通常是：

```text
http://localhost:5173
```

## 生产构建

```bash
npm run build
npm run preview
```

## 使用说明

1. 左侧选择对应模块并填写内容
2. 点击右上角 **简历配置与模块管理** 调整样式和模块顺序
3. 右侧查看分页预览效果
4. 点击 **导出 PDF** 生成简历文件

## 当前说明

- 本项目默认使用浏览器本地存储保存简历内容
- 分页预览已按 A4 视图组织，导出时会尽量与预览保持一致
- 若直接双击 `index.html` 打开页面，浏览器不会编译 `tsx`，因此需要通过 `npm run dev` 或 `npm run preview` 启动
