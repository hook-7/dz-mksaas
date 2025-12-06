/**
 * Encrypted API Client
 *
 * 通用的加密 API 客户端，支持 AES 加密和 HMAC 签名
 * 用于与需要加密通信的外部 API 进行安全交互
 */

import { decryptData, encryptData, generateNonce } from './crypto-utils';
import { generateSignature, verifySignature } from './signature-utils';

// ============== 配置接口 ==============

/**
 * API 客户端配置
 */
export interface ApiClientConfig {
  /** API 基础 URL */
  baseUrl: string;
  /** HMAC 签名密钥 */
  secretKey: string;
  /** AES 加密密钥（必须是 32 字节） */
  aesKey: string;
  /** 请求超时时间（毫秒），默认 30 秒 */
  timeout?: number;
}

/**
 * 请求选项
 */
export interface RequestOptions {
  /** 请求方法 */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** 额外的请求头 */
  headers?: Record<string, string>;
  /** 是否加密请求数据 */
  encrypt?: boolean;
  /** 请求超时时间（毫秒） */
  timeout?: number;
}

// ============== API 客户端类 ==============

/**
 * 加密 API 客户端
 */
export class EncryptedApiClient {
  private config: Required<ApiClientConfig>;

  constructor(config: ApiClientConfig) {
    this.config = {
      ...config,
      timeout: config.timeout ?? 30000,
    };
  }

  /**
   * 发送 POST 请求（带加密）
   *
   * @param endpoint - API 端点路径
   * @param data - 请求数据
   * @param options - 请求选项
   * @returns Promise<T>
   */
  async post<T>(
    endpoint: string,
    data: unknown,
    options: Omit<RequestOptions, 'method'> = {}
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        ...options,
        method: 'POST',
      },
      data
    );
  }

  /**
   * 发送 GET 请求（不加密，仅签名）
   *
   * @param endpoint - API 端点路径
   * @param options - 请求选项
   * @returns Promise<T>
   */
  async get<T>(
    endpoint: string,
    options: Omit<RequestOptions, 'method'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
      encrypt: false,
    });
  }

  /**
   * 发送 PUT 请求（带加密）
   *
   * @param endpoint - API 端点路径
   * @param data - 请求数据
   * @param options - 请求选项
   * @returns Promise<T>
   */
  async put<T>(
    endpoint: string,
    data: unknown,
    options: Omit<RequestOptions, 'method'> = {}
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        ...options,
        method: 'PUT',
      },
      data
    );
  }

  /**
   * 发送 DELETE 请求（带加密）
   *
   * @param endpoint - API 端点路径
   * @param data - 请求数据
   * @param options - 请求选项
   * @returns Promise<T>
   */
  async delete<T>(
    endpoint: string,
    data?: unknown,
    options: Omit<RequestOptions, 'method'> = {}
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        ...options,
        method: 'DELETE',
      },
      data
    );
  }

  /**
   * 通用请求方法
   *
   * @param endpoint - API 端点路径
   * @param options - 请求选项
   * @param data - 请求数据（可选）
   * @returns Promise<T>
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
    data?: unknown
  ): Promise<T> {
    const {
      method = 'POST',
      headers = {},
      encrypt = true,
      timeout = this.config.timeout,
    } = options;

    // 准备请求数据和签名
    let body: string | undefined;
    let bodyForSignature = '';

    if (data && method !== 'GET') {
      if (encrypt) {
        // 加密数据
        const encryptedData = encryptData(data, this.config.aesKey);
        body = JSON.stringify({ encrypted_data: encryptedData });
        bodyForSignature = encryptedData;
      } else {
        body = JSON.stringify(data);
        bodyForSignature = body;
      }
    }

    // 生成签名参数
    const timestamp = Date.now();
    const nonce = generateNonce(32);
    const signature = generateSignature(
      timestamp,
      nonce,
      bodyForSignature,
      this.config.secretKey
    );

    // 构建请求头
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Timestamp': String(timestamp),
      'X-Nonce': nonce,
      'X-Signature': signature,
      ...headers,
    };

    // 发送请求
    const url = `${this.config.baseUrl}${endpoint}`;
    let response: Response;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      response = await fetch(url, {
        method,
        headers: requestHeaders,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`请求超时 (${url}): 超过 ${timeout}ms`);
      }
      throw new Error(
        `API 连接失败 (${url}): ${error instanceof Error ? error.message : 'Network error'}`
      );
    }

    // 处理响应
    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => 'Unable to read error');
      throw new Error(
        `API 错误: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const result = await response.json();

    // 如果响应是加密的，解密它
    if (result.encrypted_data) {
      return decryptData<T>(result.encrypted_data, this.config.aesKey);
    }

    return result as T;
  }

  /**
   * 验证 Webhook 请求签名
   *
   * @param timestamp - 时间戳
   * @param nonce - 随机数
   * @param signature - 签名
   * @param body - 请求体
   * @param maxAge - 最大有效期（毫秒），默认 5 分钟
   * @returns 是否验证成功
   */
  verifyWebhook(
    timestamp: string,
    nonce: string,
    signature: string,
    body: string,
    maxAge = 5 * 60 * 1000
  ): boolean {
    const timestampNum = Number.parseInt(timestamp, 10);

    if (Number.isNaN(timestampNum)) {
      console.error('Invalid timestamp');
      return false;
    }

    return verifySignature(
      timestampNum,
      nonce,
      body,
      signature,
      this.config.secretKey,
      maxAge
    );
  }

  /**
   * 解密 Webhook 数据
   *
   * @param encryptedData - 加密的数据
   * @returns 解密后的数据
   */
  decryptWebhookData<T>(encryptedData: string): T {
    return decryptData<T>(encryptedData, this.config.aesKey);
  }
}
