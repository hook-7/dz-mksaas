/**
 * Health Check API
 *
 * GET /api/v1/internal/health
 * 健康检查接口，用于监控服务状态
 */

import { successResponse } from '../middleware';

export async function GET() {
  return successResponse(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
    'Service is healthy'
  );
}
