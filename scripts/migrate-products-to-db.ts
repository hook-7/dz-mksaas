/**
 * 将配置文件中的产品数据迁移到数据库
 *
 * 使用方法：
 * pnpm tsx scripts/migrate-products-to-db.ts
 */

import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import { and, eq } from 'drizzle-orm';
import { websiteConfig } from '../src/config/website';
import { getDb } from '../src/db';
import { product } from '../src/db/schema';
import { ProductTypes } from '../src/lib/product';
import { PaymentTypes, PlanIntervals } from '../src/payment/types';

// 加载环境变量
dotenv.config();

/**
 * 将金额转换为最小货币单位（分/美分）
 * @param amount - 金额（元/美元）
 * @returns 最小货币单位
 */
function convertToSmallestUnit(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * 检查必需的环境变量
 */
function checkRequiredEnvVars() {
  const requiredVars = [
    'NEXT_PUBLIC_STRIPE_PRICE_PERSONAL_YEARLY',
    'NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_YEARLY',
    'NEXT_PUBLIC_STRIPE_PRICE_PRO_SELLER_YEARLY',
    'NEXT_PUBLIC_STRIPE_PRICE_CREDITS_BASIC',
    'NEXT_PUBLIC_STRIPE_PRICE_CREDITS_STANDARD',
    'NEXT_PUBLIC_STRIPE_PRICE_CREDITS_PREMIUM',
    'NEXT_PUBLIC_STRIPE_PRICE_CREDITS_ENTERPRISE',
  ];

  const missingVars: string[] = [];
  for (const varName of requiredVars) {
    if (!process.env[varName] || process.env[varName]?.trim() === '') {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.error('❌ 错误: 以下环境变量未设置或为空:');
    missingVars.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.log('\n请确保 .env 文件中配置了这些 Stripe Price ID');
    console.log(
      '如果还没有创建 Stripe Price，可以暂时使用占位符值（如: price_placeholder_xxx）'
    );
    return false;
  }

  return true;
}

async function migrateProducts() {
  // 检查数据库连接
  if (!process.env.DATABASE_URL) {
    console.error('❌ 错误: DATABASE_URL 环境变量未设置');
    console.log('请确保 .env 文件中配置了 DATABASE_URL');
    process.exit(1);
  }

  console.log('🚀 开始迁移产品数据到数据库...\n');

  // 检查必需的环境变量
  console.log('🔍 检查环境变量...');
  if (!checkRequiredEnvVars()) {
    console.log('\n💡 提示: 如果 Stripe Price ID 还未创建，可以：');
    console.log('1. 在 Stripe Dashboard 中创建对应的 Price');
    console.log('2. 将 Price ID 添加到 .env 文件中');
    console.log('3. 或者暂时使用占位符值（如: price_placeholder_personal）');
    console.log('\n是否继续使用占位符值？(y/n)');
    // 对于脚本，我们允许继续，但会显示警告
    console.log('⚠️  继续执行，但会跳过 priceId 为空的产品\n');
  } else {
    console.log('✅ 所有必需的环境变量已配置\n');
  }

  let db: Awaited<ReturnType<typeof getDb>>;
  try {
    db = await getDb();
    // 测试数据库连接
    await db.select().from(product).limit(1);
    console.log('✅ 数据库连接成功\n');
  } catch (error) {
    console.error(
      '❌ 数据库连接失败:',
      error instanceof Error ? error.message : error
    );
    console.log('\n请检查:');
    console.log('1. 数据库服务是否运行');
    console.log('2. DATABASE_URL 配置是否正确');
    console.log('3. 数据库表是否已创建（运行 pnpm db:push）');
    process.exit(1);
  }

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  try {
    // 1. 迁移订阅计划
    console.log('📦 迁移订阅计划...');
    for (const [planId, plan] of Object.entries(websiteConfig.price.plans)) {
      try {
        // 每个计划只有一个价格（免费计划可能没有价格）
        const price = plan.prices[0];

        // 对于免费计划，如果没有价格，创建一个虚拟价格配置
        if (plan.isFree && !price) {
          // 免费计划没有价格，但仍然需要导入配置
          const productId = randomUUID();
          const config = {
            isFree: plan.isFree,
            isLifetime: plan.isLifetime,
            credits: plan.credits,
          };

          // 检查是否已存在
          const existing = await db
            .select()
            .from(product)
            .where(
              and(
                eq(product.name, planId),
                eq(product.productType, ProductTypes.SUBSCRIPTION_PLAN)
              )
            )
            .limit(1);

          if (existing.length > 0) {
            console.log(`  ⏭️  产品 ${planId} 已存在，跳过`);
            skipCount++;
            continue;
          }

          // 插入免费计划（没有价格信息）
          await db.insert(product).values({
            id: productId,
            name: planId,
            description: null,
            productType: ProductTypes.SUBSCRIPTION_PLAN,
            config: JSON.stringify(config),
            stripePriceId: null,
            amount: 0,
            currency: 'CNY',
            paymentType: 'subscription',
            interval: null,
            trialPeriodDays: null,
            allowPromotionCode: false,
            originalAmount: null,
            discountRate: null,
            popular: plan.popular || false,
            disabled: plan.disabled || false,
            sortOrder: 0,
          });

          console.log(`  ✅ 创建免费计划: ${planId} (${productId})`);
          successCount++;
          continue;
        }

        if (!price) {
          console.log(`  ⚠️  计划 ${planId} 没有价格，跳过`);
          skipCount++;
          continue;
        }

        // 检查 priceId 是否存在（允许为空）
        let priceId = price.priceId?.trim() || null;
        if (
          priceId &&
          (priceId.startsWith('price_xxxxx') || priceId === 'price_placeholder')
        ) {
          console.log(`  ⚠️  计划 ${planId} 的 priceId 为占位符，将设置为空`);
          priceId = null;
        }

        if (!priceId) {
          console.log(`  ⚠️  计划 ${planId} 的 priceId 未配置，将设置为空`);
        }

        // 检查是否已存在（根据 name 和 productType）
        const existing = await db
          .select()
          .from(product)
          .where(
            and(
              eq(product.name, planId),
              eq(product.productType, ProductTypes.SUBSCRIPTION_PLAN)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          console.log(`  ⏭️  产品 ${planId} 已存在，跳过`);
          skipCount++;
          continue;
        }

        const productId = randomUUID();
        const config = {
          isFree: plan.isFree,
          isLifetime: plan.isLifetime,
          credits: plan.credits,
        };

        // 插入产品（包含价格信息）
        await db.insert(product).values({
          id: productId,
          name: planId,
          description: null,
          productType: ProductTypes.SUBSCRIPTION_PLAN,
          config: JSON.stringify(config),
          stripePriceId: priceId,
          amount: convertToSmallestUnit(price.amount),
          currency: price.currency,
          paymentType:
            price.type === PaymentTypes.SUBSCRIPTION
              ? 'subscription'
              : 'one_time',
          interval:
            price.interval === PlanIntervals.MONTH
              ? 'month'
              : price.interval === PlanIntervals.YEAR
                ? 'year'
                : null,
          trialPeriodDays: price.trialPeriodDays || null,
          allowPromotionCode: price.allowPromotionCode || false,
          originalAmount: (price as any).originalAmount
            ? convertToSmallestUnit((price as any).originalAmount)
            : null,
          discountRate: (price as any).discountRate
            ? Math.round((price as any).discountRate * 100)
            : null,
          popular: plan.popular || false,
          disabled: plan.disabled || false,
          sortOrder: 0,
        });

        console.log(
          `  ✅ 创建产品: ${planId} (${productId}) - ${price.amount} ${price.currency}${priceId ? ` (priceId: ${priceId})` : ' (priceId: 未配置)'}`
        );
        successCount++;
      } catch (error) {
        console.error(
          `  ❌ 创建产品 ${planId} 失败:`,
          error instanceof Error ? error.message : error
        );
        errorCount++;
      }
    }

    // 2. 迁移积分包
    console.log('\n🎁 迁移积分包...');
    for (const [packageId, pkg] of Object.entries(
      websiteConfig.credits.packages
    )) {
      try {
        // 检查 priceId 是否存在（允许为空）
        let packagePriceId = pkg.price.priceId?.trim() || null;
        if (
          packagePriceId &&
          (packagePriceId.startsWith('price_xxxxx') ||
            packagePriceId === 'price_placeholder')
        ) {
          console.log(
            `  ⚠️  积分包 ${packageId} 的 priceId 为占位符，将设置为空`
          );
          packagePriceId = null;
        }

        if (!packagePriceId) {
          console.log(`  ⚠️  积分包 ${packageId} 的 priceId 未配置，将设置为空`);
        }

        // 检查是否已存在（根据 name 和 productType）
        const existing = await db
          .select()
          .from(product)
          .where(
            and(
              eq(product.name, packageId),
              eq(product.productType, ProductTypes.CREDIT_PACKAGE)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          console.log(`  ⏭️  产品 ${packageId} 已存在，跳过`);
          skipCount++;
          continue;
        }

        const productId = randomUUID();
        const config = {
          amount: pkg.amount,
          expireDays: pkg.expireDays,
        };

        // 插入产品（包含价格信息）
        await db.insert(product).values({
          id: productId,
          name: packageId,
          description: null,
          productType: ProductTypes.CREDIT_PACKAGE,
          config: JSON.stringify(config),
          stripePriceId: packagePriceId,
          amount: convertToSmallestUnit(pkg.price.amount),
          currency: pkg.price.currency,
          paymentType: 'one_time',
          interval: null,
          trialPeriodDays: null,
          allowPromotionCode: pkg.price.allowPromotionCode || false,
          originalAmount: (pkg.price as any).originalAmount
            ? convertToSmallestUnit((pkg.price as any).originalAmount)
            : null,
          discountRate: (pkg.price as any).discountRate
            ? Math.round((pkg.price as any).discountRate * 100)
            : null,
          popular: pkg.popular || false,
          disabled: pkg.disabled || false,
          sortOrder: 0,
        });

        console.log(
          `  ✅ 创建产品: ${packageId} (${productId}) - ${pkg.price.amount} ${pkg.price.currency}${packagePriceId ? ` (priceId: ${packagePriceId})` : ' (priceId: 未配置)'}`
        );
        successCount++;
      } catch (error) {
        console.error(
          `  ❌ 创建产品 ${packageId} 失败:`,
          error instanceof Error ? error.message : error
        );
        errorCount++;
      }
    }

    // 输出统计信息
    console.log('\n' + '='.repeat(50));
    console.log('📊 迁移统计:');
    console.log(`  ✅ 成功: ${successCount} 个产品`);
    console.log(`  ⏭️  跳过: ${skipCount} 个产品`);
    console.log(`  ❌ 失败: ${errorCount} 个产品`);
    console.log('='.repeat(50));

    if (errorCount > 0) {
      console.log('\n⚠️  部分产品迁移失败，请检查错误信息');
    } else {
      console.log('\n✨ 迁移完成！');
    }
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  }
}

// 运行迁移
migrateProducts()
  .then(() => {
    console.log('\n✅ 数据迁移脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 迁移过程中出现错误:', error);
    process.exit(1);
  });
