# 模块化简历编辑器

一个基于 **React + TypeScript + Vite** 的在线简历编辑器，支持左侧模块化填写、右侧 A4 分页实时预览，以及高质量 PDF 导出。

## 当前功能

- 左侧模块化编辑，右侧实时分页预览
- 支持基本信息、教育背景、项目经历、专业技能、获奖经历、校园经历、实习经历、工作经历、证书信息、个人评价
- 支持自定义简历模块
- 支持模块启用/禁用、排序、项目模块与自定义模块标题重命名
- 支持头像上传，并按上传图片比例显示
- 支持描述类内容的简单 Markdown
- 支持空行保留，预览中按段落换行
- 项目经历、获奖经历等长内容跨页时，只在首段显示标题头，续段不重复
- PDF 导出改为浏览器打印式导出，清晰度更高，不再插入空白页
- 支持 Supabase 登录与云端简历保存
- 未登录时继续使用本地草稿保存

## 最近更新

- 新增 Supabase 云端同步能力，支持多份云端简历切换、创建、删除和自动保存
- 登录方式切换为邮箱 + 密码
- 优化头像显示逻辑，减少上传后裁切异常
- 模块描述支持基础 Markdown：
  - `**加粗**`
  - `- 列表`
  - 空行分段
- 专业技能改为整块编辑区，不再按分类拆分
- 修复项目经历、获奖经历等跨页时标题重复问题
- 优化左右双栏滚动：
  - 鼠标在左侧时只滚左侧
  - 鼠标在右侧时只滚右侧
  - 页面外层不再抢滚轮

## 技术栈

- React 18
- TypeScript
- Vite
- Supabase

## 项目结构

```text
src/
  App.tsx                    # 页面布局、编辑区、预览区、滚动与认证 UI
  main.tsx                   # 入口文件
  resumeConfig.ts            # 简历模块 schema 与默认模板数据
  types.ts                   # 类型定义
  hooks/
    useResumeBuilder.ts      # 本地状态、云端同步、认证状态管理
  lib/
    pdf.ts                   # 浏览器打印式 PDF 导出
    resumeData.ts            # schemaVersion 与数据兼容处理
    resumeStore.ts           # Supabase 数据访问层
    supabase.ts              # Supabase 客户端初始化
  styles.css                 # 全局样式与简历排版样式
supabase/
  schema.sql                 # resumes 表与 RLS 策略
```

## 本地运行

先确保本机已安装 **Node.js 18+**。

```bash
npm install
npm run dev
```

默认地址通常是：

```text
http://localhost:5173
```

## Supabase 配置

项目根目录新建 `.env`，填入：

```bash
VITE_SUPABASE_URL=你的 Supabase Project URL
VITE_SUPABASE_ANON_KEY=你的 Supabase Publishable Key
```

数据库表和权限策略执行：

```bash
supabase/schema.sql
```

建议在 Supabase 后台开启 Email Provider，并根据你的登录策略配置邮箱确认规则。

## 生产构建

```bash
npm run build
npm run preview
```

## 使用说明

1. 左侧填写简历内容或配置模块
2. 右侧实时查看分页预览
3. 需要云端保存时，先登录 Supabase 账号体系
4. 点击“导出 PDF”进入浏览器打印保存流程

## 说明

- 本地未登录时仍会保存草稿
- 登录后会切换到云端简历，并支持自动同步
- 当前 PDF 导出依赖浏览器打印能力，因此清晰度高于整页截图方案
