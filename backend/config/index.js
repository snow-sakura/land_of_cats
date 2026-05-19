/**
 * 后端服务配置
 * 数据库连接信息通过此处配置，支持环境变量覆盖
 */
module.exports = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'stray_cats',
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4'
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10)
  },
  manage: {
    path: process.env.MANAGE_PATH || 'manage',
    sessionSecret: process.env.SESSION_SECRET || 'stray-cats-manage-secret'
  },
  jwtSecret: process.env.JWT_SECRET || 'stray-cats-jwt-secret-2024',
  uploads: {
    maxPhotoSize: 10 * 1024 * 1024,  // 单张照片最大 10MB
    maxSoundSize: 5 * 1024 * 1024,   // 单个音频最大 5MB
    allowedPhotoTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedSoundTypes: ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-m4a']
  }
}
