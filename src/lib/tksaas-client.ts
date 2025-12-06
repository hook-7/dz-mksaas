/**
 * TKSAAS Internal API Client
 *
 * 统一管理与 TKSAAS 服务的 API 调用
 */

import { getDb } from '@/db/index';
import { user as userTable } from '@/db/schema';
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
