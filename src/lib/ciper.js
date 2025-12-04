/**
 * Bizhub Internal API - Postman Pre-request Script (Forge 版本)
 *
 * 使用 Forge 库实现完整的 AES-256-GCM 加密 + HMAC-SHA256 签名
 * 动态加载方案，从 CDN 加载 Forge 库
 *
 * 使用方法：
 * 1. 将此脚本复制到 Postman Collection 或 Request 的 Pre-request Script
 * 2. 在 Body 中填写原始 JSON 数据（无需预加密）
 * 3. 脚本会自动完成加密和签名
 *
 * 环境变量（可选，有默认值）：
 * - BIZHUB_SECRET_KEY: HMAC 签名密钥
 * - BIZHUB_AES_KEY: AES 加密密钥（必须 32 字节）
 */

// ============== 配置（必须与服务端一致）==============
const SECRET_KEY = pm.environment.get('BIZHUB_SECRET_KEY')
    || 'vyQVTdia3SmiT0FfuHMEmds64Q86zW-9M9LGSxgzgS9sYJUQqWac_WHQ8tm42f1I';

const AES_KEY = pm.environment.get('BIZHUB_AES_KEY')
    || '60de7302c514a30b83d659ea1643e9b5';  // 32 字节

const FORGE_CDN_URL = 'https://cdn.jsdelivr.net/npm/forge@2.3.0/forge.min.js';
//  /npm/forge@2.3.0/forge.js
const FORGE_CDN_BACKUP = 'https://unpkg.com/node-forge@2.3.0/dist/forge.min.js';

// ============== 主入口 ==============
function main() {
    // 检查是否已加载 Forge 库
    if (!pm.globals.get('forge-js')) {
        console.log('Forge 库未加载，正在从 CDN 下载...');
        loadForgeLibrary(FORGE_CDN_URL, function (success) {
            if (success) {
                doEncryptAndSign();
            } else {
                // 尝试备用 CDN
                console.log('主 CDN 失败，尝试备用 CDN...');
                loadForgeLibrary(FORGE_CDN_BACKUP, function (backupSuccess) {
                    if (backupSuccess) {
                        doEncryptAndSign();
                    } else {
                        console.error('Forge 库加载失败！请检查网络连接。');
                    }
                });
            }
        });
    } else {
        doEncryptAndSign();
    }
}


// ============== Forge 库加载 ==============
function loadForgeLibrary(url, callback) {
    pm.sendRequest({
        url: url,
        method: 'GET'
    }, function (err, res) {
        if (err || !res || res.code !== 200) {
            console.error('加载 Forge 库失败:', err);
            callback(false);
            return;
        }
        pm.globals.set('forge-js', res.text());
        console.log('Forge 库加载成功！');
        callback(true);
    });
}


// ============== 加密和签名主流程 ==============
function doEncryptAndSign() {
    // 创建 fake 全局对象（Postman 沙箱没有 window/navigator）
    // Forge 库会检测环境并将 forge 对象挂载到 window 上
    var window = {};
    var navigator = {};
    var self = window;  // self 通常指向 window
    var document = {};
    var exports = {};
    var module = { exports: exports };

    // 初始化 Forge（使用 eval 执行库代码）
    eval(pm.globals.get('forge-js'));

    // 从可能的位置获取 forge 对象
    var forge = window.forge || module.exports || exports.forge;

    if (!forge) {
        console.error('Forge 对象未找到！');
        return;
    }
    console.log('Forge 初始化成功');

    const method = pm.request.method.toUpperCase();
    const timestamp = Date.now();
    const nonce = generateNonce(32);

    console.log('========== Bizhub Forge 加密签名 ==========');
    console.log('Method:', method);
    console.log('Timestamp:', timestamp);
    console.log('Nonce:', nonce);

    let signBody = '';
    let requestBody = null;

    if (method === 'GET') {
        // GET 请求：signBody 为空字符串
        signBody = '';
        console.log('signBody: (空字符串)');
    } else {
        // POST/PUT/PATCH 请求
        if (pm.request.body && pm.request.body.raw) {
            try {
                const bodyJson = JSON.parse(pm.request.body.raw);

                if (bodyJson.encrypted_data) {
                    // 已经是加密数据，直接使用
                    signBody = bodyJson.encrypted_data;
                    console.log('使用已有的 encrypted_data');
                } else {
                    // 需要加密原始数据
                    console.log('原始数据:', JSON.stringify(bodyJson, null, 2));

                    // AES-256-GCM 加密
                    const encryptedData = aesGcmEncrypt(bodyJson, AES_KEY, forge);
                    signBody = encryptedData;

                    // 修改请求体为加密格式
                    requestBody = { encrypted_data: encryptedData };
                    console.log('加密完成，encrypted_data 长度:', encryptedData.length);
                }
            } catch (e) {
                console.error('解析/加密 Body 失败:', e.message);
            }
        }
    }

    // 计算 HMAC-SHA256 签名
    const signature = generateSignature(timestamp, nonce, signBody, SECRET_KEY, forge);

    console.log('');
    console.log('Signature:', signature);
    console.log('==========================================');

    // 设置请求头
    pm.request.headers.remove('X-Timestamp');
    pm.request.headers.remove('X-Nonce');
    pm.request.headers.remove('X-Signature');
    pm.request.headers.remove('Content-Type');

    pm.request.headers.add({ key: 'X-Timestamp', value: String(timestamp) });
    pm.request.headers.add({ key: 'X-Nonce', value: nonce });
    pm.request.headers.add({ key: 'X-Signature', value: signature });
    pm.request.headers.add({ key: 'Content-Type', value: 'application/json' });

    // 如果需要修改请求体
    if (requestBody) {
        pm.request.body.raw = JSON.stringify(requestBody);
        console.log('请求体已更新为加密格式');
    }
}


// ============== AES-256-GCM 加密 ==============
/**
 * AES-256-GCM 加密
 *
 * 输出格式（与 Python 端一致）：
 * base64(nonce + tag + ciphertext)
 *   - nonce: 16 字节
 *   - tag: 16 字节
 *   - ciphertext: 变长
 *
 * @param {Object} data - 要加密的数据对象
 * @param {string} key - AES 密钥（32 字节字符串）
 * @param {Object} forge - Forge 库对象
 * @returns {string} Base64 编码的加密数据
 */
function aesGcmEncrypt(data, key, forge) {
    // 1. JSON 序列化：key 排序、无空格（与 Python 端一致）
    const plaintext = JSON.stringify(sortObjectKeys(data));
    console.log('序列化后的明文:', plaintext);

    // 2. 生成 16 字节随机 nonce
    const nonce = forge.random.getBytesSync(16);

    // 3. 创建 AES-GCM cipher
    const cipher = forge.cipher.createCipher('AES-GCM', key);
    cipher.start({
        iv: nonce,
        tagLength: 128  // 16 字节 = 128 位
    });

    // 4. 加密
    cipher.update(forge.util.createBuffer(plaintext, 'utf8'));
    cipher.finish();

    // 5. 获取 ciphertext 和 tag
    const ciphertext = cipher.output.getBytes();
    const tag = cipher.mode.tag.getBytes();

    // 6. 组合格式：nonce + tag + ciphertext（与 Python 端一致）
    const encrypted = nonce + tag + ciphertext;

    // 7. Base64 编码
    return forge.util.encode64(encrypted);
}


// ============== HMAC-SHA256 签名 ==============
/**
 * 生成 HMAC-SHA256 签名
 *
 * 签名格式：{timestamp}\n{nonce}\n{body}
 *
 * @param {number} timestamp - 毫秒级时间戳
 * @param {string} nonce - 随机字符串
 * @param {string} body - 请求体内容（加密后的数据）
 * @param {string} secretKey - HMAC 密钥
 * @param {Object} forge - Forge 库对象
 * @returns {string} 签名的 hex 字符串
 */
function generateSignature(timestamp, nonce, body, secretKey, forge) {
    const signString = timestamp + '\n' + nonce + '\n' + body;

    console.log('签名原字符串 (escaped):');
    console.log(JSON.stringify(signString));

    const hmac = forge.hmac.create();
    hmac.start('sha256', secretKey);
    hmac.update(signString);

    return hmac.digest().toHex();
}


// ============== 工具函数 ==============

/**
 * 生成随机 Nonce
 */
function generateNonce(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * 递归排序对象的 keys（与 Python sort_keys=True 一致）
 */
function sortObjectKeys(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys);
    }
    const sorted = {};
    Object.keys(obj).sort().forEach(key => {
        sorted[key] = sortObjectKeys(obj[key]);
    });
    return sorted;
}


// ============== 执行 ==============
main();
