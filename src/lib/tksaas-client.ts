/**
 * TKSAAS Internal API Client
 *
 * 统一管理与 TKSAAS 服务的 API 调用
 */

import { getDb } from '@/db/index';
import { shop as shopTable, user as userTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { EncryptedApiClient } from './encrypted-api-client';

// ============== 客户端实例 ==============

/**
 * 创建 TKSAAS API 客户端实例
 */
function createTKSaasClient(): EncryptedApiClient {
  return new EncryptedApiClient({
    baseUrl: process.env.TKSAAS_API_URL || 'https://api.example.com',
    secretKey:
      process.env.BIZHUB_SECRET_KEY ||
      'vyQVTdia3SmiT0FfuHMEmds64Q86zW-9M9LGSxgzgS9sYJUQqWac_WHQ8tm42f1I',
    aesKey: process.env.BIZHUB_AES_KEY || '60de7302c514a30b83d659ea1643e9b5',
  });
}

// ============== 类型定义 ==============

/**
 * TKSAAS API 统一响应格式
 */
export interface TKSaasResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

/**
 * 用户同步响应数据
 */
export interface SyncUserData {
  tk_saas_user_id: string;
  is_new: boolean;
  synced: boolean;
}

/**
 * 用户同步请求参数
 */
export interface SyncUserParams {
  bizhub_user_id: string;
  phone?: string;
  email: string;
  username: string;
}

/**
 * 店铺列表请求参数
 */
export interface ShopListParams {
  user_id: string;
  id_type?: 'bizhub' | 'tksaas';
}

/**
 * 店铺信息（API 返回格式）
 */
export interface ShopInfo {
  shop_id: string;
  shop_code: string;
  shop_name: string;
  shop_type?: string;
  region?: string;
  status?: string;
  shop_avatar?: string;
  bound_at?: number; // Unix 时间戳（秒）
  [key: string]: unknown;
}

/**
 * 店铺列表响应数据
 */
export interface ShopListData {
  shops: ShopInfo[];
  total?: number;
  [key: string]: unknown;
}

// ============== API 调用函数 ==============

/**
 * 同步用户到 TKSAAS
 *
 * @param params - 用户同步参数
 * @returns Promise<TKSaasResponse<SyncUserData>>
 */
export async function syncUserToTKSaas(
  params: SyncUserParams
): Promise<TKSaasResponse<SyncUserData>> {
  try {
    console.log('🔄 Syncing user to TKSAAS:', {
      user_id: params.bizhub_user_id,
      email: params.email,
      phone: params.phone || '(no phone)',
    });

    const client = createTKSaasClient();
    const result = await client.post<TKSaasResponse<SyncUserData>>(
      '/api/v1/internal/sync-user',
      params
    );

    if (result.code === 200) {
      console.log(
        `✅ User ${params.bizhub_user_id} synced to TKSAAS successfully`
      );
      console.log('TKSAAS sync result:', {
        tk_saas_user_id: result.data.tk_saas_user_id,
        is_new: result.data.is_new,
        message: result.msg,
      });

      // Update user sync status in database
      try {
        const db = await getDb();
        await db
          .update(userTable)
          .set({
            tkSaasUserId: result.data.tk_saas_user_id,
            synced: result.data.synced,
            updatedAt: new Date(),
          })
          .where(eq(userTable.id, params.bizhub_user_id));
        console.log(
          `✅ Updated user sync status in database for ${params.bizhub_user_id}`
        );
      } catch (error) {
        console.error('Failed to update user sync status in database:', error);
        // Don't throw error, sync was successful
      }
    } else {
      console.error(
        `❌ Failed to sync user ${params.bizhub_user_id} to TKSAAS`
      );
      console.error('Error:', result.msg);
    }

    return result;
  } catch (error) {
    console.error('❌ TKSAAS user sync error:', error);
    console.error('Error details:', {
      user_id: params.bizhub_user_id,
      email: params.email,
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// ============== 其他 TKSAAS API 函数（待扩展）==============

/**
 * 更新用户信息到 TKSAAS
 *
 * @param params - 用户更新参数
 * @returns Promise<TKSaasResponse<unknown>>
 */
export async function updateUserToTKSaas(params: {
  bizhub_user_id: string;
  [key: string]: unknown;
}): Promise<TKSaasResponse<unknown>> {
  const client = createTKSaasClient();
  const result = await client.post<TKSaasResponse<unknown>>(
    '/api/v1/internal/update-user',
    params
  );
  return result;
}

/**
 * 删除用户从 TKSAAS
 *
 * @param userId - 用户 ID
 * @returns Promise<TKSaasResponse<unknown>>
 */
export async function deleteUserFromTKSaas(
  userId: string
): Promise<TKSaasResponse<unknown>> {
  const client = createTKSaasClient();
  const result = await client.post<TKSaasResponse<unknown>>(
    '/api/v1/internal/delete-user',
    { bizhub_user_id: userId }
  );
  return result;
}

/**
 * 获取店铺列表
 *
 * @param params - 店铺列表查询参数
 * @returns Promise<TKSaasResponse<ShopListData>>
 */
export async function getShopList(
  params: ShopListParams
): Promise<TKSaasResponse<ShopListData>> {
  try {
    console.log('🔄 Fetching shop list from TKSAAS:', {
      user_id: params.user_id,
      id_type: params.id_type || 'bizhub',
    });

    // 构建查询参数
    const queryParams = new URLSearchParams({
      user_id: params.user_id,
      id_type: params.id_type || 'bizhub',
    });

    const client = createTKSaasClient();
    const endpoint = `/api/v1/internal/shop/list?${queryParams.toString()}`;
    const result = await client.get<TKSaasResponse<ShopListData>>(endpoint);

    if (result.code === 200 && result.data?.shops) {
      console.log(
        `✅ Shop list fetched successfully for user ${params.user_id}`
      );
      console.log('Shop list result:', {
        shop_count: result.data.shops.length,
        total: result.data?.total,
        message: result.msg,
      });

      // 保存/更新店铺信息到本地数据库
      try {
        const db = await getDb();
        const shops = result.data.shops;

        for (const shopInfo of shops) {
          const boundAt = shopInfo.bound_at
            ? new Date(shopInfo.bound_at * 1000) // 转换为毫秒
            : null;

          await db
            .insert(shopTable)
            .values({
              id: shopInfo.shop_id,
              shopCode: shopInfo.shop_code,
              shopName: shopInfo.shop_name,
              shopType: shopInfo.shop_type || null,
              region: shopInfo.region || null,
              status: shopInfo.status || 'initializing',
              shopAvatar: shopInfo.shop_avatar || null,
              boundAt: boundAt,
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: shopTable.id,
              set: {
                shopCode: shopInfo.shop_code,
                shopName: shopInfo.shop_name,
                shopType: shopInfo.shop_type || null,
                region: shopInfo.region || null,
                status: shopInfo.status || 'initializing',
                shopAvatar: shopInfo.shop_avatar || null,
                boundAt: boundAt,
                updatedAt: new Date(),
              },
            });
        }

        console.log(`✅ Saved/updated ${shops.length} shops to local database`);
      } catch (error) {
        console.error('❌ Failed to save shops to database:', error);
        // 不抛出错误，继续返回 API 结果
      }
    } else {
      // API 返回了错误状态，记录日志但不抛出异常
      // 调用方应该检查 result.code 来处理错误
      console.warn(
        `⚠️ Shop list API returned error for user ${params.user_id}:`,
        {
          code: result.code,
          msg: result.msg,
        }
      );
    }

    return result;
  } catch (error) {
    // 记录详细错误信息用于调试，但不暴露给客户端
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ TKSAAS shop list error:', {
      user_id: params.user_id,
      id_type: params.id_type,
      error_message: errorMessage,
      error_type:
        error instanceof Error ? error.constructor.name : typeof error,
    });

    // 对于网络错误等，返回一个错误响应而不是抛出异常
    // 这样调用方可以检查 result.code 来处理错误
    return {
      code: 500,
      msg: `获取店铺列表失败: ${errorMessage}`,
      data: {
        shops: [],
        total: 0,
      } as ShopListData,
    };
  }
}
