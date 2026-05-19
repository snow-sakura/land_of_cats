const pool = require('./db')
const bcrypt = require('bcryptjs')

const userModel = {
  /**
   * 按用户名查找用户
   */
  async findByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username])
    return rows.length > 0 ? rows[0] : null
  },

  /**
   * 按手机号查找用户
   */
  async findByPhone(phone) {
    const [rows] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone])
    return rows.length > 0 ? rows[0] : null
  },

  /**
   * 按 openid 查找用户（微信登录）
   */
  async findByOpenid(openid) {
    const [rows] = await pool.query('SELECT * FROM users WHERE openid = ?', [openid])
    return rows.length > 0 ? rows[0] : null
  },

  /**
   * 按 ID 查找用户
   */
  async findById(id) {
    const [rows] = await pool.query('SELECT id, username, phone, nickname, avatar_url, openid, created_at FROM users WHERE id = ?', [id])
    return rows.length > 0 ? rows[0] : null
  },

  /**
   * 创建用户，密码自动加密
   */
  async create({ username, password, nickname, phone }) {
    const passwordHash = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash, nickname, phone) VALUES (?, ?, ?, ?)',
      [username, passwordHash, nickname || username, phone || null]
    )
    return result.insertId
  },

  /**
   * 创建或查找微信用户（通过 openid）
   */
  async findOrCreateByOpenid(openid, nickname) {
    const existing = await this.findByOpenid(openid)
    if (existing) return existing.id

    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash, nickname, openid) VALUES (?, ?, ?, ?)',
      [`wx_${openid.substring(0, 8)}`, '', nickname || '微信用户', openid]
    )
    return result.insertId
  },

  /**
   * 验证密码
   */
  async verifyPassword(inputPassword, storedHash) {
    if (!storedHash) return false
    return bcrypt.compare(inputPassword, storedHash)
  },

  /**
   * 更新用户信息
   */
  async update(id, data) {
    const fields = []
    const values = []
    for (const key of ['nickname', 'phone', 'avatar_url']) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`)
        values.push(data[key])
      }
    }
    if (fields.length === 0) return false
    values.push(id)
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values)
    return true
  }
}

module.exports = userModel
