/**
 * TKSAAS Internal API Client
 *
 * 统一管理与 TKSAAS 服务的 API 调用
 */

import { sendEncryptedRequest } from './bizhub-client.example';

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

    const result = await sendEncryptedRequest<TKSaasResponse<SyncUserData>>(
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
  const result = await sendEncryptedRequest<TKSaasResponse<unknown>>(
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
  const result = await sendEncryptedRequest<TKSaasResponse<unknown>>(
    '/api/v1/internal/delete-user',
    { bizhub_user_id: userId }
  );
  return result;
}
