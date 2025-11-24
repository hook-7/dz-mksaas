import crypto from 'crypto';

import { normalizePhoneNumber } from '../phone';

type CodeType = 'login' | 'register';

const CONFIG = {
  account: process.env.SAAS_TK_CHUANGLAN_SMS_ACCOUNT,
  password: process.env.SAAS_TK_CHUANGLAN_SMS_PASSWORD,
  apiUrl: process.env.SAAS_TK_CHUANGLAN_SMS_API_URL,
  signText: process.env.SAAS_TK_CHUANGLAN_SMS_SIGN,
  timeoutMs: Number(process.env.SAAS_TK_CHUANGLAN_SMS_TIMEOUT ?? '10000'),
  templateLogin:
    process.env.SAAS_TK_CHUANGLAN_SMS_TEMPLATE_LOGIN ?? '1020393206',
  templateRegister:
    process.env.SAAS_TK_CHUANGLAN_SMS_TEMPLATE_REGISTER ?? '1020393206',
};

const ERROR_MAP: Record<string, string> = {
  '000000': '发送成功',
  '101200': '账号或密码错误',
  '101203': 'IP 鉴权失败',
  '101206': '短信内容含非法关键词',
  '101207': '余额不足',
};

const OTP_COOLDOWN_MS = 60_000;
const otpSendTimestamps = new Map<string, number>();

function assertConfig() {
  const missing = Object.entries(CONFIG)
    .filter(([k, v]) => v === undefined || v === '')
    .map(([k]) => k);
  if (missing.length) {
    throw new Error(
      `Chuanglan SMS config missing: ${missing.join(', ')}. Please set env vars.`
    );
  }
}

function md5(input: string) {
  return crypto.createHash('md5').update(input).digest('hex');
}

function makeSignature(md5Password: string, timestamp: string, nonce: string) {
  const parts = [md5Password, timestamp, nonce].sort();
  const signStr = parts.join('').replace(/\s+/g, '');
  return crypto.createHmac('sha256', md5Password).update(signStr).digest('hex');
}

function generateNonce(len = 32) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < len; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function sendChuanglanOtp(params: {
  phoneNumber: string;
  code: string;
  codeType: CodeType;
}) {
  assertConfig();
  const { phoneNumber, code, codeType } = params;
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  if (!normalizedPhone) throw new Error('phoneNumber required');
  if (!code) throw new Error('code required');

  // Debug log for tracing calls; keep terse to avoid leaking codes in prod logs.
  console.log('[chuanglan] sendChuanglanOtp called', {
    phone: normalizedPhone,
    type: codeType,
  });

  const now = Date.now();
  const lastSentAt = otpSendTimestamps.get(normalizedPhone);
  if (lastSentAt) {
    const elapsed = now - lastSentAt;
    if (elapsed < OTP_COOLDOWN_MS) {
      const secondsLeft = Math.ceil((OTP_COOLDOWN_MS - elapsed) / 1000);
      return {
        success: false,
        code: 'RATE_LIMITED',
        message: `验证码发送过于频繁，请在${secondsLeft}秒后重试`,
      };
    }
    otpSendTimestamps.delete(normalizedPhone);
  }

  const timestamp = `${Math.floor(Date.now() / 1000)}`;
  const nonce = generateNonce();
  const md5Password = md5(CONFIG.password!);
  const hmacSignature = makeSignature(md5Password, timestamp, nonce);

  const templateId =
    codeType === 'login' ? CONFIG.templateLogin : CONFIG.templateRegister;

  const payload = {
    account: CONFIG.account,
    timestamp,
    nonce,
    phoneNumbers: normalizedPhone,
    templateId,
    // API 需要数组参数 JSON 字符串
    templateParamJson: JSON.stringify([{ param1: code }]),
    signature: CONFIG.signText,
    report: 'false',
    callbackUrl: '',
    uid: `sms_${codeType}_${Date.now()}`,
    extend: '',
  };

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    CONFIG.timeoutMs || 10000
  );

  try {
    const res = await fetch(CONFIG.apiUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-QA-Hmac-Signature': hmacSignature,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await res.text();
    const data = JSON.parse(text);

    if (data.code === '000000') {
      otpSendTimestamps.set(normalizedPhone, Date.now());
      return { success: true, msgId: data.msgid };
    }

    const message = ERROR_MAP[data.code] || data.msg || '发送失败';
    return { success: false, code: data.code, message };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  } finally {
    clearTimeout(timeout);
  }
}
