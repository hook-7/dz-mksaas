import { getAllProductsAction } from '@/actions/admin-products';
import type { ProductInfo } from '@/lib/product';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

// Query keys
export const productsKeys = {
  all: ['adminProducts'] as const,
};

/**
 * 获取所有产品列表（仅管理员可用）
 */
export function useProducts() {
  return useQuery<ProductInfo[]>({
    queryKey: productsKeys.all,
    queryFn: async () => {
      const result = await getAllProductsAction();

      // next-safe-action 在客户端返回的结构为：
      // { data?: ActionReturnType, serverError?, fetchError? }
      // 我们在服务端返回的是 { success, data, error }，这里需要从 result.data 中再解包一层
      const actionData = result?.data;

      if (!actionData?.success || !actionData.data) {
        throw new Error(actionData?.error || 'Failed to fetch products');
      }

      return actionData.data.items || [];
    },
    placeholderData: keepPreviousData,
  });
}


