/**
 * 初始化默认管理员账号
 * 运行方式: node scripts/seed-admin.js
 *
 * 会创建默认管理员: admin / admin123
 * 如果已存在则跳过
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const adminModel = require('../models/admin')

async function main() {
  const username = 'admin'
  const password = 'admin123'

  const existing = await adminModel.findByUsername(username)
  if (existing) {
    console.log(`管理员 "${username}" 已存在，跳过创建`)
    process.exit(0)
  }

  await adminModel.create(username, password)
  console.log(`管理员创建成功: ${username} / ${password}`)
  process.exit(0)
}

main().catch(err => {
  console.error('创建管理员失败:', err.message)
  process.exit(1)
})
