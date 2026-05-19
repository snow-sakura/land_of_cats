// 后端 API 基础地址
// 微信开发者工具模拟器中可用 localhost，真机调试需替换为电脑局域网 IP
const BASE_URL = 'http://localhost:3000/api'

// 获取当前用户标识（生产环境应通过 wx.login + code2session 换取）
function getOpenId() {
  let openid = wx.getStorageSync('openid')
  if (!openid) {
    openid = 'dev_' + Date.now()
    wx.setStorageSync('openid', openid)
  }
  return openid
}

// ---- Token 管理 ----

function getToken() {
  return wx.getStorageSync('token') || ''
}

function saveToken(token) {
  wx.setStorageSync('token', token)
}

function clearToken() {
  wx.removeStorageSync('token')
}

function hasToken() {
  return !!wx.getStorageSync('token')
}

/**
 * 通用请求封装
 */
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const header = {
      'x-openid': getOpenId(),
      'Content-Type': 'application/json',
      ...options.headers
    }
    // 有 token 时自动附加
    const token = getToken()
    if (token) {
      header['x-token'] = token
    }

    wx.request({
      url: BASE_URL + url,
      method: options.method || 'GET',
      data: options.data,
      header,
      timeout: 10000,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject({ code: res.statusCode, message: res.data?.error || '请求失败' })
        }
      },
      fail: (err) => {
        reject({ code: -1, message: '网络异常，请检查后端服务是否启动' })
      }
    })
  })
}

module.exports = {
  // ---- 猫咪档案 CRUD ----
  getCatList() {
    return request('/cats')
  },

  getCatDetail(id) {
    return request(`/cats/${id}`)
  },

  createCat(data) {
    return request('/cats', { method: 'POST', data })
  },

  updateCat(id, data) {
    return request(`/cats/${id}`, { method: 'PUT', data })
  },

  deleteCat(id) {
    return request(`/cats/${id}`, { method: 'DELETE' })
  },

  /**
   * 上传文件到后端
   */
  uploadFile(filePath, type = 'photo', extraData = {}) {
    return new Promise((resolve, reject) => {
      const url = type === 'photo'
        ? `${BASE_URL}/upload/photo`
        : `${BASE_URL}/upload/sound`

      const header = { 'x-openid': getOpenId() }
      const token = getToken()
      if (token) header['x-token'] = token

      wx.uploadFile({
        url,
        filePath,
        name: 'file',
        header,
        formData: extraData,
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            if (data.success) {
              resolve(data.data)
            } else {
              reject({ message: data.error || '上传失败' })
            }
          } catch (e) {
            reject({ message: '上传返回格式异常' })
          }
        },
        fail: () => {
          reject({ message: '网络异常，上传失败' })
        }
      })
    })
  },

  // ---- 认证相关 ----

  /** 注册：{ username, password, nickname, phone? } → { token, user } */
  register(data) {
    return request('/auth/register', { method: 'POST', data })
  },

  /** 账号密码登录 */
  login(data) {
    return request('/auth/login', { method: 'POST', data })
  },

  /** 微信登录（mock） */
  wxLogin(data) {
    return request('/auth/wx-login', { method: 'POST', data })
  },

  /** 发送短信验证码（mock） */
  sendSmsCode(data) {
    return request('/auth/send-code', { method: 'POST', data })
  },

  /** 手机验证码登录 */
  smsLogin(data) {
    return request('/auth/sms-login', { method: 'POST', data })
  },

  /** 获取当前登录用户信息 */
  getUserProfile() {
    return request('/auth/me')
  },

  // ---- Token 管理导出 ----
  getToken,
  saveToken,
  clearToken,
  hasToken
}
