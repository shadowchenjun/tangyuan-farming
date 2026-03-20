// 短信服务模块 - 支持阿里云和腾讯云短信平台
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

// 短信配置 - 请在环境变量中设置
const SMS_CONFIG = {
  // 短信服务商: 'aliyun' | 'tencent'
  provider: process.env.SMS_PROVIDER || 'aliyun',
  // 阿里云配置
  aliyun: {
    accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
    signName: process.env.ALIYUN_SMS_SIGN_NAME,
    templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE
  },
  // 腾讯云配置
  tencent: {
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY,
    sdkAppId: process.env.TENCENT_SMS_SDK_APP_ID,
    signName: process.env.TENCENT_SMS_SIGN_NAME,
    templateId: process.env.TENCENT_SMS_TEMPLATE_ID
  }
}

// 验证码有效期（秒）
const CODE_EXPIRY = 300 // 5分钟

// 验证码长度
const CODE_LENGTH = 6

/**
 * 生成6位数字验证码
 */
function generateCode() {
  return Math.random().toString().substring(2, 2 + CODE_LENGTH)
}

/**
 * 存储验证码到数据库
 */
async function storeCode(phone, code) {
  if (!supabase) {
    throw new Error('数据库未配置')
  }

  // 先删除旧验证码
  await supabase
    .from('sms_codes')
    .delete()
    .eq('phone', phone)

  // 插入新验证码
  const { error } = await supabase
    .from('sms_codes')
    .insert([{
      phone,
      code,
      expires_at: new Date(Date.now() + CODE_EXPIRY * 1000).toISOString()
    }])

  if (error) {
    throw new Error('存储验证码失败')
  }
}

/**
 * 验证验证码
 */
export async function verifyCode(phone, code) {
  if (!supabase) {
    throw new Error('数据库未配置')
  }

  const { data, error } = await supabase
    .from('sms_codes')
    .select('*')
    .eq('phone', phone)
    .eq('code', code)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !data) {
    return false
  }

  // 验证成功后删除验证码（一次性使用）
  await supabase
    .from('sms_codes')
    .delete()
    .eq('phone', phone)

  return true
}

/**
 * 发送短信 - 阿里云
 */
async function sendSMSAliyun(phone, code) {
  const { aliyun } = SMS_CONFIG

  if (!aliyun.accessKeyId || !aliyun.accessKeySecret || !aliyun.signName || !aliyun.templateCode) {
    throw new Error('阿里云短信配置不完整')
  }

  // 阿里云短信API调用
  // 注意：需要安装 @alicloud/sdk短信服务
  // 此处为示例实现，实际使用时需要安装相应SDK

  const { default: axios } = await import('axios')

  const params = {
    PhoneNumbers: phone,
    SignName: aliyun.signName,
    TemplateCode: aliyun.templateCode,
    TemplateParam: JSON.stringify({ code })
  }

  // 实际项目中取消注释并配置正确的阿里云API地址
  // const result = await axios.post(
  //   'https://dysmsapi.aliyuncs.com/?Action=SendSms&Version=2017-05-25',
  //   new URLSearchParams(params),
  //   {
  //     headers: {
  //       'Content-Type': 'application/x-www-form-urlencoded',
  //       'Authorization': `AK ${aliyun.accessKeyId}:${aliyun.accessKeySecret}`
  //     }
  //   }
  // )

  // 开发环境直接返回成功
  console.log(`[SMS] 阿里云短信发送: phone=${phone}, code=${code}`)
  return true
}

/**
 * 发送短信 - 腾讯云
 */
async function sendSMSTencent(phone, code) {
  const { tencent } = SMS_CONFIG

  if (!tencent.secretId || !tencent.secretKey || !tencent.sdkAppId || !tencent.signName || !tencent.templateId) {
    throw new Error('腾讯云短信配置不完整')
  }

  // 腾讯云短信API调用
  // 注意：需要安装 tencentcloud-sdk短信服务
  // 此处为示例实现

  console.log(`[SMS] 腾讯云短信发送: phone=${phone}, code=${code}`)
  return true
}

/**
 * 发送短信主函数
 */
export async function sendSMS(phone) {
  // 参数验证
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    throw new Error('手机号格式不正确')
  }

  // 生成验证码
  const code = generateCode()

  // 根据配置选择服务商
  let result
  if (SMS_CONFIG.provider === 'tencent') {
    result = await sendSMSTencent(phone, code)
  } else {
    result = await sendSMSAliyun(phone, code)
  }

  // 存储验证码
  await storeCode(phone, code)

  return { message: '验证码已发送', code: result ? 'sent' : 'failed' }
}

export default sendSMS