const mysql = require('mysql2/promise')
const config = require('../config')

// 创建 MySQL 连接池
const pool = mysql.createPool(config.db)

// 连接池错误处理（如数据库宕机、连接断开）
pool.on('error', (err) => {
  console.error('数据库连接池异常:', err.message)
})

module.exports = pool
