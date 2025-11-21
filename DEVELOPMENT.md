# MkSaaS 二次开发指南

本指南将帮助你快速了解项目结构，并进行二次开发。

## 📋 目录

- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [核心模块](#核心模块)
- [开发流程](#开发流程)
- [常见开发任务](#常见开发任务)
- [最佳实践](#最佳实践)

## 🚀 快速开始

### 1. 环境准备

**必需工具：**
- Node.js 18+
- pnpm（推荐）或 npm/yarn
- PostgreSQL 数据库
- Git

**安装依赖：**
```bash
pnpm install
```

### 2. 环境配置

复制环境变量模板并配置：

```bash
cp env.example .env
```

**必需配置项：**

```env
# 应用基础 URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# 数据库连接（PostgreSQL）
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Better Auth 密钥（生成：openssl rand -base64 32）
BETTER_AUTH_SECRET=your-secret-key-here

# OAuth（至少配置一个）
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
# 或
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

**可选配置：**
- Stripe 支付（如需订阅/支付功能）
- Resend API（如需邮件功能）
- 存储服务（Cloudflare R2 或 S3）
- AI 服务 API（如需 AI 功能）
- 分析服务（Google Analytics、PostHog 等）

### 3. 数据库初始化

```bash
# 生成数据库迁移文件
pnpm db:generate

# 执行数据库迁移
pnpm db:migrate

# 或直接推送（开发环境）
pnpm db:push
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

## 📁 项目结构

```
mksaas-template/
├── src/
│   ├── app/                 # Next.js 应用路由（App Router）
│   │   ├── [locale]/        # 国际化路由
│   │   └── api/             # API 路由
│   ├── components/          # React 组件
│   │   ├── ui/              # 基础 UI 组件（Radix UI）
│   │   ├── magicui/         # Magic UI 组件库
│   │   ├── tailark/         # Tailark 组件库
│   │   ├── auth/            # 认证相关组件
│   │   ├── dashboard/       # 仪表板组件
│   │   ├── payment/         # 支付相关组件
│   │   └── ...              # 其他功能组件
│   ├── actions/             # Server Actions
│   ├── ai/                  # AI 工作流和工具
│   ├── db/                  # 数据库相关
│   │   ├── schema.ts        # Drizzle ORM 模式定义
│   │   └── migrations/      # 数据库迁移文件
│   ├── lib/                 # 工具函数和辅助函数
│   ├── hooks/               # React Hooks
│   ├── stores/              # Zustand 状态管理
│   ├── types/               # TypeScript 类型定义
│   ├── mail/                # 邮件模板
│   ├── storage/             # 存储服务（S3/R2）
│   ├── payment/             # 支付逻辑（Stripe）
│   ├── credits/             # 积分系统
│   └── middleware.ts        # Next.js 中间件
├── content/                 # 内容文件（博客、文档等）
├── public/                  # 静态资源
├── scripts/                 # 工具脚本
├── messages/                # 国际化消息文件
└── config/                  # 配置文件
```

## 🔧 核心模块

### 1. 认证系统 (Better Auth)

**位置：** `src/lib/auth.ts`

**功能：**
- 邮箱/密码登录
- OAuth（GitHub、Google）
- 会话管理
- 用户管理

**使用示例：**
```typescript
import { auth } from '@/lib/auth';

// 获取当前用户
const session = await auth.api.getSession({ headers });

// 创建用户
await auth.api.signUpEmail({
  body: { email, password, name },
  headers,
});
```

### 2. 数据库 (Drizzle ORM)

**位置：** `src/db/schema.ts`

**常用命令：**
```bash
# 修改 schema 后生成迁移
pnpm db:generate

# 执行迁移
pnpm db:migrate

# 开发时直接推送（不生成迁移文件）
pnpm db:push

# 打开 Drizzle Studio（数据库可视化工具）
pnpm db:studio
```

**添加新表示例：**
```typescript
// src/db/schema.ts
export const yourTable = pgTable('your_table', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### 3. Server Actions

**位置：** `src/actions/`

**特点：**
- 使用 `next-safe-action` 进行类型安全的服务端操作
- 自动验证和错误处理
- 客户端调用方便

**创建新 Action：**
```typescript
// src/actions/your-action.ts
'use server';

import { actionClient } from '@/lib/safe-action';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
});

export const yourAction = actionClient
  .schema(schema)
  .action(async ({ parsedInput }) => {
    // 业务逻辑
    return { success: true };
  });
```

### 4. AI 功能

**位置：** `src/ai/`

**支持的 AI 提供商：**
- OpenAI
- Google Gemini
- DeepSeek
- Fireworks
- Replicate
- Fal
- OpenRouter

**配置：** 在 `.env` 中添加对应的 API Key

### 5. 支付系统 (Stripe)

**位置：** `src/payment/`

**功能：**
- 订阅管理
- 一次性支付
- Webhook 处理
- 积分包购买

**配置：**
```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_...
```

### 6. 国际化 (i18n)

**位置：** `messages/` 和 `src/i18n/`

**支持语言：** 中文、英文等

**添加翻译：**
```typescript
// messages/zh.json
{
  "common": {
    "hello": "你好"
  }
}

// messages/en.json
{
  "common": {
    "hello": "Hello"
  }
}
```

### 7. 存储服务

**位置：** `src/storage/`

**支持的存储：**
- Cloudflare R2
- AWS S3
- 其他 S3 兼容服务

**使用示例：**
```typescript
import { storage } from '@/lib/storage';

// 上传文件
await storage.upload({
  key: 'path/to/file.jpg',
  body: fileBuffer,
  contentType: 'image/jpeg',
});
```

## 💻 开发流程

### 1. 开发新功能

**步骤：**
1. 规划功能需求
2. 设计数据库结构（如需要）
3. 创建 Server Actions
4. 开发 UI 组件
5. 集成到页面路由
6. 测试功能

**示例：添加新页面**

```typescript
// src/app/[locale]/your-page/page.tsx
import { useTranslations } from 'next-intl';

export default function YourPage() {
  const t = useTranslations();

  return (
    <div>
      <h1>{t('yourPage.title')}</h1>
      {/* 页面内容 */}
    </div>
  );
}
```

### 2. 添加新 API 路由

```typescript
// src/app/api/your-endpoint/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // 处理逻辑
  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  const body = await request.json();
  // 处理逻辑
  return NextResponse.json({ success: true });
}
```

### 3. 创建新组件

```typescript
// src/components/your-component.tsx
'use client'; // 如果需要在客户端使用

import { Button } from '@/components/ui/button';

interface YourComponentProps {
  title: string;
}

export function YourComponent({ title }: YourComponentProps) {
  return (
    <div>
      <h2>{title}</h2>
      <Button>点击</Button>
    </div>
  );
}
```

### 4. 数据库变更流程

```bash
# 1. 修改 schema.ts
# 2. 生成迁移文件
pnpm db:generate

# 3. 检查生成的迁移文件
# 查看 src/db/migrations/

# 4. 执行迁移
pnpm db:migrate
```

## 🎯 常见开发任务

### 1. 修改品牌和样式

**修改品牌信息：**
- 查找项目中的品牌名称和 logo
- 搜索公司名称
- 替换为你的品牌

**修改主题颜色：**
- 编辑 `src/styles/` 中的 Tailwind 配置
- 或修改 `tailwind.config.ts`

### 2. 自定义认证流程

**修改登录页面：**
- `src/app/[locale]/(auth)/sign-in/page.tsx`

**添加新的 OAuth 提供商：**
- 参考 `src/lib/auth.ts`
- 添加提供商配置

### 3. 添加新的订阅计划

1. 在 Stripe 创建价格
2. 在 `.env` 添加价格 ID
3. 更新 `src/payment/types.ts`
4. 修改定价页面组件

### 4. 集成新的 AI 提供商

1. 安装对应的 AI SDK 包
2. 在 `src/ai/` 中添加配置
3. 在 `.env` 添加 API Key
4. 更新 AI 工作流

### 5. 自定义邮件模板

**位置：** `src/mail/templates/`

**预览邮件：**
```bash
pnpm email
```

访问 http://localhost:3333 预览邮件

### 6. 添加新语言

1. 创建翻译文件：`messages/[locale].json`
2. 在 `src/i18n/config.ts` 注册语言
3. 更新路由配置

## ✨ 最佳实践

### 代码风格

**格式化：**
```bash
pnpm format
```

**代码检查：**
```bash
pnpm lint
```

**规范：**
- 使用 2 个空格缩进
- 单引号
- ES5 尾随逗号
- 必须有分号
- 文件命名使用 kebab-case

### 类型安全

- 充分利用 TypeScript
- 使用 Zod 进行数据验证
- Server Actions 使用 `next-safe-action`

### 性能优化

- 使用 Next.js 的 Server Components 默认
- 只在需要时使用 `'use client'`
- 合理使用缓存
- 优化图片（Next.js Image 组件）

### 安全建议

- 永远不要在客户端暴露敏感信息
- 使用 Server Actions 处理敏感操作
- 验证用户输入
- 使用环境变量存储密钥

### 测试

虽然项目没有自动化测试，但建议：

1. 手动测试关键流程：
   - 用户注册/登录
   - 支付流程
   - AI 功能
   - 数据 CRUD

2. 检查：
   - 响应式设计
   - 浏览器兼容性
   - 国际化显示

## 📚 参考资源

- **官方文档：** https://mksaas.com/docs
- **Next.js 文档：** https://nextjs.org/docs
- **Drizzle ORM：** https://orm.drizzle.team
- **Better Auth：** https://www.better-auth.com
- **Stripe 文档：** https://stripe.com/docs

## 🆘 获取帮助

- **GitHub Issues：** https://github.com/MkSaaSHQ/mksaas-template/issues
- **Discord：** https://mksaas.link/discord
- **邮件支持：** support@mksaas.com

## 🔄 更新项目

**获取最新代码：**
```bash
git pull origin main
pnpm install
pnpm db:migrate
```

**注意：** 更新前请备份你的更改和数据库

---

祝你开发顺利！🎉

