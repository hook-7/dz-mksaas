/**
 * 测试店铺列表 API
 *
 * 用于查看 API 响应的实际数据结构，以便正确编写类型定义
 *
 * 使用方法:
 *   pnpm tsx scripts/test-shop-list.ts [user_id] [id_type]
 *
 * 示例:
 *   pnpm tsx scripts/test-shop-list.ts bz_test_1764599401 bizhub
 *   pnpm tsx scripts/test-shop-list.ts bz_test_1764599401
 */

import dotenv from 'dotenv';
import { getShopList } from '../src/lib/tksaas-client.js';

dotenv.config();

async function testShopList() {
  // 从命令行参数获取 user_id 和 id_type
  const user_id = process.argv[2] || 'bz_test_1764599401';
  const id_type = (process.argv[3] as 'bizhub' | 'tksaas') || 'bizhub';

  console.log('🚀 开始测试店铺列表 API');
  console.log('================================');
  console.log('参数:');
  console.log(`  user_id: ${user_id}`);
  console.log(`  id_type: ${id_type}`);
  console.log('================================\n');

  // 检查环境变量
  console.log('🔍 环境变量检查:');
  console.log('================================');
  const apiUrl = process.env.TKSAAS_API_URL || '';
  console.log(`TKSAAS_API_URL: ${apiUrl || '(未设置)'}`);
  console.log(
    `BIZHUB_SECRET_KEY: ${process.env.BIZHUB_SECRET_KEY ? '(已设置)' : '(未设置)'}`
  );
  console.log(
    `BIZHUB_AES_KEY: ${process.env.BIZHUB_AES_KEY ? '(已设置)' : '(未设置)'}`
  );

  // 尝试解析 URL
  if (apiUrl) {
    try {
      const url = new URL(apiUrl);
      console.log(`\n解析后的 URL:`);
      console.log(`  协议: ${url.protocol}`);
      console.log(`  主机: ${url.hostname}`);
      console.log(`  端口: ${url.port || '(默认)'}`);
    } catch (e) {
      console.log(`\n⚠️  URL 解析失败: ${apiUrl}`);
    }
  }
  console.log('================================\n');

  try {
    const result = await getShopList({
      user_id,
      id_type,
    });

    console.log('\n✅ API 调用成功');
    console.log('================================');
    console.log('完整响应数据:');
    console.log(JSON.stringify(result, null, 2));
    console.log('================================\n');

    // 分析响应结构
    console.log('📊 响应结构分析:');
    console.log('================================');
    console.log(`响应码 (code): ${result.code}`);
    console.log(`响应消息 (msg): ${result.msg}`);
    console.log(`数据 (data):`, typeof result.data);

    if (result.data && typeof result.data === 'object') {
      console.log('\n数据字段:');
      console.log('  -', Object.keys(result.data).join('\n  - '));

      // 如果是数组
      if (Array.isArray(result.data)) {
        console.log(`\n数组长度: ${result.data.length}`);
        if (result.data.length > 0) {
          console.log('\n第一个元素结构:');
          console.log(JSON.stringify(result.data[0], null, 2));
        }
      }
      // 如果是对象且有 shops 字段
      else if ('shops' in result.data && Array.isArray(result.data.shops)) {
        console.log(`\n店铺数量 (shops.length): ${result.data.shops.length}`);
        if (result.data.shops.length > 0) {
          console.log('\n第一个店铺结构:');
          console.log(JSON.stringify(result.data.shops[0], null, 2));
        }
      }
      // 如果是对象且有其他数组字段
      else {
        const arrayFields = Object.entries(result.data).filter(([_, value]) =>
          Array.isArray(value)
        );
        if (arrayFields.length > 0) {
          console.log('\n数组字段:');
          for (const [key, value] of arrayFields) {
            console.log(`  - ${key}: 数组长度 ${(value as unknown[]).length}`);
            if ((value as unknown[]).length > 0) {
              console.log(`    第一个元素:`, JSON.stringify(value[0], null, 2));
            }
          }
        }
      }
    }

    console.log('================================\n');

    console.log('💡 建议的类型定义:');
    console.log('================================');
    if (result.data && typeof result.data === 'object') {
      if (Array.isArray(result.data)) {
        console.log('interface ShopListData {');
        if (result.data.length > 0) {
          const firstItem = result.data[0];
          Object.keys(firstItem).forEach((key) => {
            const value = firstItem[key as keyof typeof firstItem];
            const type =
              typeof value === 'string'
                ? 'string'
                : typeof value === 'number'
                  ? 'number'
                  : typeof value === 'boolean'
                    ? 'boolean'
                    : 'unknown';
            console.log(`  ${key}: ${type};`);
          });
        }
        console.log('}');
      } else if ('shops' in result.data && Array.isArray(result.data.shops)) {
        console.log('interface ShopInfo {');
        if (result.data.shops.length > 0) {
          const firstShop = result.data.shops[0];
          Object.keys(firstShop).forEach((key) => {
            const value = firstShop[key as keyof typeof firstShop];
            const type =
              typeof value === 'string'
                ? 'string'
                : typeof value === 'number'
                  ? 'number'
                  : typeof value === 'boolean'
                    ? 'boolean'
                    : 'unknown';
            console.log(`  ${key}: ${type};`);
          });
        }
        console.log('}\n');
        console.log('interface ShopListData {');
        Object.keys(result.data).forEach((key) => {
          const value = result.data[key as keyof typeof result.data];
          if (key === 'shops') {
            console.log(`  shops: ShopInfo[];`);
          } else if (typeof value === 'number') {
            console.log(`  ${key}?: number;`);
          } else if (typeof value === 'string') {
            console.log(`  ${key}?: string;`);
          } else if (typeof value === 'boolean') {
            console.log(`  ${key}?: boolean;`);
          } else {
            console.log(`  ${key}?: unknown;`);
          }
        });
        console.log('}');
      } else {
        console.log('interface ShopListData {');
        Object.keys(result.data).forEach((key) => {
          const value = result.data[key as keyof typeof result.data];
          if (Array.isArray(value)) {
            console.log(`  ${key}: Array<unknown>;`);
          } else if (typeof value === 'number') {
            console.log(`  ${key}: number;`);
          } else if (typeof value === 'string') {
            console.log(`  ${key}: string;`);
          } else if (typeof value === 'boolean') {
            console.log(`  ${key}: boolean;`);
          } else {
            console.log(`  ${key}: unknown;`);
          }
        });
        console.log('}');
      }
    }
    console.log('================================\n');
  } catch (error) {
    console.error('\n❌ API 调用失败');
    console.error('================================');
    console.error('错误信息:');
    if (error instanceof Error) {
      console.error(`  消息: ${error.message}`);
      console.error(`  堆栈: ${error.stack}`);
    } else {
      console.error('  未知错误:', error);
    }
    console.error('================================\n');

    // 网络诊断建议
    console.log('💡 网络诊断建议:');
    console.log('================================');
    const apiUrl = process.env.TKSAAS_API_URL || '';
    if (apiUrl) {
      try {
        const url = new URL(apiUrl);
        console.log(`1. 测试服务器连接: ping ${url.hostname}`);
        console.log(`2. 测试 HTTP 连接: curl ${apiUrl}/api/v1/internal/health`);
        console.log(`3. 检查防火墙设置`);
        console.log(`4. 确认服务器是否正在运行`);
        console.log(`5. 检查网络路由是否可达`);
      } catch (e) {
        console.log(`1. 检查 TKSAAS_API_URL 格式是否正确: ${apiUrl}`);
      }
    } else {
      console.log('1. 请先设置 TKSAAS_API_URL 环境变量');
    }
    console.log('================================\n');

    process.exit(1);
  }
}

testShopList();
