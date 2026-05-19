const bcrypt = require('bcryptjs')
const pool = require('./db')

const adminModel = {
  /**
   * 按用户名查找管理员
   */
  async findByUsername(username) {
    const [rows] = await pool.query(
      'SELECT * FROM admin_users WHERE username = ?',
      [username]
    )
    return rows.length > 0 ? rows[0] : null
  },

  /**
   * bcrypt 验证密码
   */
  async verifyPassword(plainPwd, hash) {
    return bcrypt.compare(plainPwd, hash)
  },

  /**
   * 创建管理员（密码自动加密）
   */
  async create(username, plainPwd) {
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(plainPwd, salt)
    const [result] = await pool.query(
      'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
      [username, passwordHash]
    )
    return result.insertId
  }
}

module.exports = adminModel
