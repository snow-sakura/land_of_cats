const express = require('express')
const multer = require('multer')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const config = require('../config')

const router = express.Router()

// 照片上传存储配置
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/photos'))
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    cb(null, `${uuidv4()}${ext}`)
  }
})

// 音频上传存储配置
const soundStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/sounds'))
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp3'
    cb(null, `${uuidv4()}${ext}`)
  }
})

// 文件类型过滤
function photoFilter(req, file, cb) {
  if (config.uploads.allowedPhotoTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('不支持的图片格式，仅支持 JPEG/PNG/WebP'))
  }
}

function soundFilter(req, file, cb) {
  if (config.uploads.allowedSoundTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('不支持的音频格式'))
  }
}

const uploadPhoto = multer({
  storage: photoStorage,
  limits: { fileSize: config.uploads.maxPhotoSize },
  fileFilter: photoFilter
})

const uploadSound = multer({
  storage: soundStorage,
  limits: { fileSize: config.uploads.maxSoundSize },
  fileFilter: soundFilter
})

// POST /api/upload/photo — 上传照片
router.post('/photo', uploadPhoto.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: '请选择照片文件' })
  }
  const url = `/uploads/photos/${req.file.filename}`
  res.json({
    success: true,
    data: {
      id: path.parse(req.file.filename).name,
      url,
      isCover: false
    }
  })
})

// POST /api/upload/sound — 上传音频
router.post('/sound', uploadSound.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: '请选择音频文件' })
  }
  const duration = parseFloat(req.body.duration || 0)
  const url = `/uploads/sounds/${req.file.filename}`
  res.json({
    success: true,
    data: {
      id: path.parse(req.file.filename).name,
      url,
      duration,
      desc: req.body.desc || ''
    }
  })
})

// multer 错误处理
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: '文件大小超出限制' })
    }
    return res.status(400).json({ success: false, error: err.message })
  }
  if (err) {
    return res.status(400).json({ success: false, error: err.message })
  }
  next()
})

module.exports = router
