# 产品表统一管理系统

## 概述

使用数据库表统一管理所有付费产品，包括：
- **订阅计划**（Subscription Plans）：会员订阅服务
- **积分包**（Credit Packages）：一次性购买积分

## 数据库结构

### `product` 表 - 产品表（包含价格信息）

每个产品只有一个价格，价格信息直接存储在产品表中，简化设计。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | text | 产品唯一标识 |
| `name` | text | 产品名称 |
| `description` | text | 产品描述（可选） |
| `product_type` | text | 产品类型：`subscription_plan` 或 `credit_package` |
| `config` | text | JSON 格式的配置信息 |
| **价格字段** | | |
| `stripe_price_id` | text | Stripe Price ID（唯一） |
| `amount` | integer | 价格金额（以最小货币单位，如分） |
| `currency` | text | 货币代码（如 USD, CNY） |
| `payment_type` | text | 支付类型：`subscription` 或 `one_time` |
| `interval` | text | 订阅周期：`month` 或 `year`（仅订阅类型） |
| `trial_period_days` | integer | 试用期天数（可选） |
| `allow_promotion_code` | boolean | 是否允许优惠码 |
| `original_amount` | integer | 原价（用于显示折扣） |
| `discount_rate` | integer | 折扣系数（0-100，如 80 表示 8 折） |
| **其他字段** | | |
| `popular` | boolean | 是否推荐 |
| `disabled` | boolean | 是否禁用 |
| `sort_order` | integer | 排序顺序 |
| `created_at` | timestamp | 创建时间 |
| `updated_at` | timestamp | 更新时间 |

## 使用步骤

### 1. 应用数据库迁移

```bash
# 生成迁移文件（已完成）
pnpm db:generate

# 应用迁移到数据库
pnpm db:migrate
# 或直接推送（开发环境）
pnpm db:push
```

### 2. 迁移现有配置数据

运行迁移脚本，将 `website.tsx` 中的配置迁移到数据库：

```bash
pnpm tsx scripts/migrate-products-to-db.ts
```

### 3. 使用产品查询函数

```typescript
import {
  getAllProducts,
  getProductById,
  getProductByStripePriceId,
  getAllSubscriptionPlans,
  getAllCreditPackages,
} from '@/lib/product';

// 获取所有产品
const allProducts = await getAllProducts();

// 获取所有订阅计划
const plans = await getAllSubscriptionPlans();

// 获取所有积分包
const packages = await getAllCreditPackages();

// 根据 ID 获取产品
const product = await getProductById('product-id');

// 根据 Stripe Price ID 获取产品
const productByPrice = await getProductByStripePriceId('price_xxxxx');
```

## 配置说明

### 订阅计划配置（config 字段）

```json
{
  "isFree": false,
  "isLifetime": false,
  "credits": {
    "enable": true,
    "amount": 30,
    "expireDays": 30
  }
}
```

### 积分包配置（config 字段）

```json
{
  "amount": 100,
  "expireDays": 30
}
```

## 优势

1. **统一管理**：所有付费产品在一个地方管理
2. **简化设计**：每个产品只有一个价格，价格信息直接存储在产品表中，无需关联查询
3. **动态配置**：无需修改代码即可调整产品和价格
4. **灵活扩展**：可以轻松添加新的产品类型
5. **数据持久化**：产品信息存储在数据库中，便于管理和查询
6. **查询高效**：单表查询，性能更好

## 迁移策略

### 方案 1：完全迁移（推荐）

1. 运行迁移脚本将配置数据导入数据库
2. 修改代码使用数据库查询替代配置文件
3. 保留配置文件作为备份或默认值

### 方案 2：混合使用

1. 数据库作为主要数据源
2. 配置文件作为默认值或后备方案
3. 优先使用数据库，如果数据库为空则使用配置

## 注意事项

1. **金额单位**：数据库中的 `amount` 以最小货币单位存储（如分），需要转换
2. **折扣系数**：`discount_rate` 存储为整数（0-100），如 80 表示 8 折
3. **Stripe Price ID**：必须与 Stripe Dashboard 中的 Price ID 一致
4. **向后兼容**：迁移时需要考虑现有代码的兼容性

## 后续优化

1. 添加产品管理后台界面
2. 支持产品多语言名称和描述
3. 添加产品版本管理
4. 支持产品套餐组合
5. 添加产品使用统计

