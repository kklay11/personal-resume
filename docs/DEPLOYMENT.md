# 部署与更新

## Vercel 环境变量

Vercel 项目里需要配置：

```bash
VITE_SUPABASE_URL=你的 Supabase Project URL
VITE_SUPABASE_ANON_KEY=你的 Supabase Publishable Key
```

配置路径：

1. 打开 Vercel 项目 `jianli`
2. 进入 `Settings`
3. 进入 `Environment Variables`
4. 新增上面两条变量
5. 环境勾选：
   - `Production`
   - `Preview`
   - `Development`

变量来源：

1. 打开 Supabase 项目
2. 进入 `Project Settings -> API`
3. 复制：
   - `Project URL`
   - `Publishable Key`

## 本地开发环境变量

项目根目录新建 `.env`：

```bash
VITE_SUPABASE_URL=你的 Supabase Project URL
VITE_SUPABASE_ANON_KEY=你的 Supabase Publishable Key
```

## 每次更新的命令

先检查并构建：

```bash
npm run build
git status
```

提交到 GitHub：

```bash
git add .
git commit -m "你的更新说明"
git push
```

如果当前分支第一次推送：

```bash
git branch --show-current
git push -u origin 你的分支名
```

更新 Vercel：

```bash
vercel --prod --yes
```

## 推荐顺序

```bash
npm run build
git status
git add .
git commit -m "你的更新说明"
git push
vercel --prod --yes
```

## 回退

如果本次更新不满意：

```bash
git revert HEAD
git push
vercel --prod --yes
```
