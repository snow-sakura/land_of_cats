/**
 * 数据库迁移脚本：创建 users 表
 * 运行方式：node scripts/migrate.js
 */
require('dotenv').config()
const pool = require('../models/db')

async function migrate() {
  try {
    console.log('开始执行数据库迁移...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        nickname VARCHAR(100) DEFAULT NULL,
        avatar_url VARCHAR(500) DEFAULT NULL,
        openid VARCHAR(100) UNIQUE DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    console.log('✅ users 表创建/已验证成功')
    process.exit(0)
  } catch (err) {
    console.error('❌ 迁移失败:', err.message)
    process.exit(1)
  }
}

migrate()
