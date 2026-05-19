const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const userModel = require('../models/user')
const config = require('../config')

const JWT_SECRET = config.jwtSecret

/**
 * 生成 JWT token
 */
function generateToken(userId) {
  return jwt.sign({ user_id: userId }, JWT_SECRET, { expiresIn: '7d' })
}

/**
 * 统一返回用户信息（不暴露密码）
 */
function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    phone: user.phone || '',
    avatarUrl: user.avatar_url || '',
    openid: user.openid || '',
    createdAt: user.created_at
  }
}

/**
 * 需要登录的中间件（用于 /me 等接口）
 */
function requireAuth(req, res, next) {
  const token = req.headers['x-token']
  if (!token) {
    return res.status(401).json({ success: false, error: '未登录' })
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.user_id
    next()
  } catch {
    return res.status(401).json({ success: false, error: '登录已过期，请重新登录' })
  }
}

// ---- 路由 ----

/**
 * POST /api/auth/register — 注册
 * Body: { username, password, nickname, phone? }
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, nickname, phone } = req.body

    if (!username || !password || !nickname) {
      return res.status(400).json({ success: false, error: '用户名、密码和昵称为必填项' })
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: '密码至少 6 位' })
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ success: false, error: '用户名只能包含字母、数字和下划线' })
    }

    // 检查用户名是否已存在
    const existing = await userModel.findByUsername(username)
    if (existing) {
      return res.status(400).json({ success: false, error: '用户名已被注册' })
    }

    // 检查手机号是否已存在
    if (phone) {
      const phoneUser = await userModel.findByPhone(phone)
      if (phoneUser) {
        return res.status(400).json({ success: false, error: '手机号已被绑定' })
      }
    }

    const userId = await userModel.create({ username, password, nickname, phone })
    const user = await userModel.findById(userId)
    const token = generateToken(userId)

    res.json({ success: true, data: { token, user: sanitizeUser(user) } })
  } catch (err) {
    console.error('注册失败:', err)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

/**
 * POST /api/auth/login — 账号密码登录
 * Body: { username, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ success: false, error: '请输入用户名和密码' })
    }

    const user = await userModel.findByUsername(username)
    if (!user) {
      return res.status(400).json({ success: false, error: '用户名或密码错误' })
    }

    const valid = await userModel.verifyPassword(password, user.password_hash)
    if (!valid) {
      return res.status(400).json({ success: false, error: '用户名或密码错误' })
    }

    const token = generateToken(user.id)
    res.json({ success: true, data: { token, user: sanitizeUser(user) } })
  } catch (err) {
    console.error('登录失败:', err)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

/**
 * POST /api/auth/wx-login — 微信登录（mock）
 * Body: { code }
 * mock 阶段：模拟 wx.login 流程，自动创建/返回用户
 */
router.post('/wx-login', async (req, res) => {
  try {
    const { code } = req.body
    // mock：用 code 模拟 openid（生产环境应通过微信 code2session 接口换取）
    const mockOpenid = code ? `mock_wx_${code.substring(0, 8)}` : `mock_wx_${Date.now()}`
    const nicknames = ['喵星人', '爱猫用户', '猫咪朋友', '云养猫', '猫奴一号']
    const mockNickname = nicknames[Math.floor(Math.random() * nicknames.length)]

    // 查找或自动创建用户
    const userId = await userModel.findOrCreateByOpenid(mockOpenid, mockNickname)
    const user = await userModel.findById(userId)
    const token = generateToken(userId)

    res.json({ success: true, data: { token, user: sanitizeUser(user) } })
  } catch (err) {
    console.error('微信登录失败:', err)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

/**
 * POST /api/auth/send-code — 发送短信验证码（mock）
 * Body: { phone }
 * mock：不真实发送，固定返回验证码 666666（通过 toast 提示用户）
 */
router.post('/send-code', async (req, res) => {
  try {
    const { phone } = req.body
    if (!phone || !/^1\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, error: '请输入正确的手机号' })
    }
    // mock：始终返回 666666
    res.json({ success: true, data: { code: '666666', message: '验证码已发送（测试环境固定为 666666）' } })
  } catch (err) {
    console.error('发送验证码失败:', err)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

/**
 * POST /api/auth/sms-login — 手机验证码登录（mock）
 * Body: { phone, code }
 * mock：验证 code === '666666' 即通过
 */
router.post('/sms-login', async (req, res) => {
  try {
    const { phone, code } = req.body
    if (!phone || !code) {
      return res.status(400).json({ success: false, error: '请输入手机号和验证码' })
    }
    if (code !== '666666') {
      return res.status(400).json({ success: false, error: '验证码错误' })
    }

    // 查找或创建用户（以手机号作为用户名）
    let user = await userModel.findByPhone(phone)
    if (!user) {
      // 手机号用户自动创建
      const userId = await userModel.create({
        username: `phone_${phone}`,
        password: `auto_${Date.now()}`,
        nickname: `用户${phone.substring(7)}`,
        phone
      })
      user = await userModel.findById(userId)
    }

    const token = generateToken(user.id)
    res.json({ success: true, data: { token, user: sanitizeUser(user) } })
  } catch (err) {
    console.error('短信登录失败:', err)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

/**
 * GET /api/auth/me — 获取当前登录用户信息
 * Headers: x-token
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await userModel.findById(req.userId)
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' })
    }
    res.json({ success: true, data: sanitizeUser(user) })
  } catch (err) {
    console.error('获取用户信息失败:', err)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

module.exports = router
