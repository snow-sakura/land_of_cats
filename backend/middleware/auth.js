const jwt = require('jsonwebtoken')
const config = require('../config')
const userModel = require('../models/user')

const JWT_SECRET = config.jwtSecret

/**
 * 用户鉴权中间件
 *
 * 支持两种认证方式（按优先级）：
 * 1. x-token 头 — JWT 认证，解析后注入 req.user + req.openid
 * 2. x-openid 头 — 传统 openid 认证，注入 req.openid（向后兼容）
 *
 * 两种方式都没有时返回 401
 */
async function auth(req, res, next) {
  const token = req.headers['x-token']
  const openid = req.headers['x-openid']

  // 优先使用 x-token
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      const user = await userModel.findById(decoded.user_id)
      if (user) {
        req.user = user
        req.openid = user.openid || `user_${user.id}`
        return next()
      }
    } catch {
      // token 无效，尝试回退到 x-openid
    }
  }

  // 回退到 x-openid
  if (openid) {
    req.openid = openid
    return next()
  }

  return res.status(401).json({ error: '缺少用户标识 x-openid 或 x-token' })
}

module.exports = auth
