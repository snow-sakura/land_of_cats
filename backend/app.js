require('dotenv').config()

const express = require('express')
const session = require('express-session')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const config = require('./config')
const auth = require('./middleware/auth')
const catsRouter = require('./routes/cats')
const uploadRouter = require('./routes/upload')
const manageRouter = require('./routes/manage')
const authRouter = require('./routes/auth')

const app = express()

// 确保上传目录存在
const uploadDirs = ['uploads/photos', 'uploads/sounds']
uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir)
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
})

// 中间件
app.use(cors())
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true }))

// EJS 模板引擎
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// Session 中间件（管理后台登录用）
app.use(session({
  secret: config.manage.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }  // session 有效期 24 小时
}))

// 静态文件服务（提供上传的照片和音频访问）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// 健康检查（无需鉴权）
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '流浪猫足迹后端服务运行中', time: new Date().toISOString() })
})

// 认证路由（注册、登录等无需 API 鉴权，必须在 /api auth 之前注册）
app.use('/api/auth', authRouter)

// 鉴权中间件（保护 API 路由）
app.use('/api', auth)

// 路由
app.use('/api/cats', catsRouter)
app.use('/api/upload', uploadRouter)

// 管理后台
app.use(`/${config.manage.path}`, manageRouter)

// 404 处理
app.use((req, res) => {
  res.status(404).json({ success: false, error: '接口不存在' })
})

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('未捕获的错误:', err)
  res.status(500).json({ success: false, error: '服务器内部错误' })
})

// 启动服务器
app.listen(config.server.port, () => {
  console.log(`🐱 流浪猫足迹后端服务已启动: http://localhost:${config.server.port}`)
  console.log(`📋 API 基础路径: http://localhost:${config.server.port}/api`)
})
