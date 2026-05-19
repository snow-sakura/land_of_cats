const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const adminModel = require('../models/admin')
const catModel = require('../models/cat')
const userModel = require('../models/user')
const manageAuth = require('../middleware/manage-auth')
const config = require('../config')

// 管理后台文件上传配置
const adminUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = file.fieldname === 'soundFiles' ? 'sounds' : 'photos'
      cb(null, path.join(__dirname, '../uploads', dir))
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || (file.fieldname === 'soundFiles' ? '.mp3' : '.jpg')
      cb(null, `${uuidv4()}${ext}`)
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }
})

const managePath = config.manage.path

// 公共变量注入
router.use((req, res, next) => {
  req.managePath = managePath
  res.locals.managePath = managePath
  res.locals.currentPath = req.path
  next()
})

/**
 * 使用 EJS 布局渲染页面：先渲染内容模板，再套 layout 外壳
 */
function renderWithLayout(res, template, options = {}) {
  const title = options.title || '管理后台'
  res.render(template, options, (err, body) => {
    if (err) {
      console.error('渲染模板失败:', err)
      return res.status(500).send('渲染页面失败')
    }
    res.render('layout', { ...options, title, body })
  })
}

// ---- 登录（不使用布局） ----

router.get('/login', (req, res) => {
  if (req.session?.manageUser) {
    return res.redirect(`/${managePath}`)
  }
  res.render('login', { error: null, managePath })
})

router.post('/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.render('login', { error: '请输入用户名和密码', managePath })
  }

  try {
    const user = await adminModel.findByUsername(username)
    if (!user) {
      return res.render('login', { error: '用户名或密码错误', managePath })
    }

    const valid = await adminModel.verifyPassword(password, user.password_hash)
    if (!valid) {
      return res.render('login', { error: '用户名或密码错误', managePath })
    }

    req.session.manageUser = { id: user.id, username: user.username }
    res.redirect(`/${managePath}`)
  } catch (err) {
    console.error('管理员登录失败:', err)
    res.render('login', { error: '服务器错误，请重试', managePath })
  }
})

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect(`/${managePath}/login`)
  })
})

// ---- 以下路由需登录 + 使用布局 ----

router.use(manageAuth)

// 仪表盘
router.get('/', async (req, res) => {
  try {
    const stats = await catModel.getStats()
    renderWithLayout(res, 'dashboard', {
      title: '仪表盘',
      stats,
      dbConfig: config.db,
      uploadConfig: config.uploads,
      serverPort: config.server.port,
      manageUser: req.session.manageUser
    })
  } catch (err) {
    console.error('加载仪表盘失败:', err)
    renderWithLayout(res, 'dashboard', {
      title: '仪表盘',
      stats: null,
      dbConfig: config.db,
      uploadConfig: config.uploads,
      serverPort: config.server.port,
      manageUser: req.session.manageUser,
      error: '加载统计数据失败: ' + err.message
    })
  }
})

// 猫咪列表
router.get('/cats', async (req, res) => {
  try {
    const cats = await catModel.getAll()
    // 批量查询用户信息，建立 openid → 昵称映射
    const uniqueOpenids = [...new Set(cats.map(c => c.openid).filter(Boolean))]
    const userMap = {}
    await Promise.all(uniqueOpenids.map(async (oid) => {
      const user = await userModel.findByOpenid(oid)
      userMap[oid] = user ? (user.nickname || user.username) : null
    }))
    const enrichedCats = cats.map(c => ({
      ...c,
      userDisplay: userMap[c.openid] || null
    }))
    const search = req.query.search || ''
    const filtered = search
      ? enrichedCats.filter(c => c.nickname.toLowerCase().includes(search.toLowerCase()))
      : enrichedCats
    renderWithLayout(res, 'cats', {
      title: '猫咪列表',
      cats: filtered,
      search,
      manageUser: req.session.manageUser
    })
  } catch (err) {
    console.error('加载猫咪列表失败:', err)
    renderWithLayout(res, 'cats', {
      title: '猫咪列表',
      cats: [],
      search: '',
      manageUser: req.session.manageUser,
      error: '加载失败: ' + err.message
    })
  }
})

// ---- 新增猫咪 ----

// 新增猫咪表单页（必须在 /cats/:id 之前注册，避免被 :id 匹配）
router.get('/cats/new', async (req, res) => {
  try {
    const openids = await catModel.getDistinctOpenids()
    // 查询每个 openid 对应的用户昵称
    const openidUsers = await Promise.all(openids.map(async (oid) => {
      const user = await userModel.findByOpenid(oid)
      return { openid: oid, nickname: user ? (user.nickname || user.username) : null }
    }))
    renderWithLayout(res, 'cat-new', {
      title: '新增猫咪',
      manageUser: req.session.manageUser,
      openidUsers
    })
  } catch (err) {
    console.error('加载新增页面失败:', err)
    renderWithLayout(res, 'cat-new', {
      title: '新增猫咪',
      manageUser: req.session.manageUser,
      openidUsers: [],
      error: '加载失败: ' + err.message
    })
  }
})

// 猫咪详情（携带 error 参数用于展示编辑失败信息）
router.get('/cats/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      return renderWithLayout(res, 'cats', {
        title: '猫咪列表',
        cats: [],
        search: '',
        manageUser: req.session.manageUser,
        error: '无效的猫咪 ID'
      })
    }
    const cat = await catModel.getByIdAdmin(id)
    if (!cat) {
      return renderWithLayout(res, 'cats', {
        title: '猫咪列表',
        cats: [],
        search: '',
        manageUser: req.session.manageUser,
        error: '猫咪档案不存在'
      })
    }
    // 查询关联用户的昵称
    let userDisplay = cat.raw.openid
    const user = await userModel.findByOpenid(cat.raw.openid)
    if (user) {
      userDisplay = user.nickname || user.username
    }
    renderWithLayout(res, 'cat-detail', {
      title: `猫咪详情 — ${cat.nickname}`,
      cat,
      userDisplay,
      manageUser: req.session.manageUser,
      error: req.query.error || null
    })
  } catch (err) {
    console.error('加载猫咪详情失败:', err)
    renderWithLayout(res, 'cats', {
      title: '猫咪列表',
      cats: [],
      search: '',
      manageUser: req.session.manageUser,
      error: '加载失败: ' + err.message
    })
  }
})

// 删除猫咪
router.post('/cats/:id/delete', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) return res.status(400).json({ error: '无效的猫咪 ID' })
    const deleted = await catModel.deleteById(id)
    if (!deleted) {
      return res.status(404).json({ error: '猫咪档案不存在' })
    }
    res.json({ success: true, message: '已删除' })
  } catch (err) {
    console.error('删除猫咪失败:', err)
    res.status(500).json({ error: '删除失败: ' + err.message })
  }
})

// 处理新增表单提交
router.post('/cats', adminUpload.fields([
  { name: 'photoFiles', maxCount: 9 },
  { name: 'soundFiles', maxCount: 5 }
]), async (req, res) => {
  try {
    const { nickname, location_name, location_address, latitude, longitude,
            coatColors, hairLength, bodyType, specialFeatures, eyeColor,
            healthStatus, healthNote, personalities, relationships, notes,
            openid, customOpenid, soundDesc } = req.body

    // 处理多选字段（当只选一个时 express 解析为字符串而非数组）
    const coatColorsArr = Array.isArray(coatColors) ? coatColors : (coatColors ? [coatColors] : [])
    const personalitiesArr = Array.isArray(personalities) ? personalities : (personalities ? [personalities] : [])

    // 处理 openid：选择手动输入但未填写时，默认使用 'admin'
    const finalOpenid = openid === '__custom__'
      ? (customOpenid && customOpenid.trim()) || 'admin'
      : (openid || 'admin')

    if (!nickname || !nickname.trim()) {
      const allOpenids = await catModel.getDistinctOpenids()
      const openidUsers = await Promise.all(allOpenids.map(async (oid) => {
        const user = await userModel.findByOpenid(oid)
        return { openid: oid, nickname: user ? (user.nickname || user.username) : null }
      }))
      return renderWithLayout(res, 'cat-new', {
        title: '新增猫咪',
        manageUser: req.session.manageUser,
        openidUsers,
        error: '请输入猫咪昵称'
      })
    }

    // 处理上传的照片
    const photos = []
    if (req.files && req.files.photoFiles) {
      req.files.photoFiles.forEach((file, i) => {
        photos.push({
          id: path.parse(file.filename).name,
          url: `/uploads/photos/${file.filename}`,
          isCover: i === 0
        })
      })
    }

    if (photos.length === 0) {
      const allOpenids = await catModel.getDistinctOpenids()
      const openidUsers = await Promise.all(allOpenids.map(async (oid) => {
        const user = await userModel.findByOpenid(oid)
        return { openid: oid, nickname: user ? (user.nickname || user.username) : null }
      }))
      return renderWithLayout(res, 'cat-new', {
        title: '新增猫咪',
        manageUser: req.session.manageUser,
        openidUsers,
        error: '请至少上传一张照片'
      })
    }

    // 处理上传的音频
    const sounds = []
    if (req.files && req.files.soundFiles) {
      req.files.soundFiles.forEach((file) => {
        sounds.push({
          id: path.parse(file.filename).name,
          url: `/uploads/sounds/${file.filename}`,
          duration: 0,
          desc: soundDesc || '管理员上传'
        })
      })
    }

    const catData = {
      nickname: nickname.trim(),
      location: {
        name: location_name || '',
        address: location_address || '',
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0
      },
      photos,
      sounds,
      attributes: {
        coatColors: coatColorsArr,
        hairLength: hairLength || '',
        bodyType: bodyType || '',
        specialFeatures: specialFeatures || '',
        eyeColor: eyeColor || '',
        healthStatus: healthStatus || '',
        healthNote: healthNote || '',
        personalities: personalitiesArr,
        relationships: relationships || ''
      },
      notes: notes || ''
    }

    const catId = await catModel.create(catData, finalOpenid)
    res.redirect(`/${managePath}/cats/${catId}`)
  } catch (err) {
    console.error('创建猫咪失败:', err)
    const allOpenids = await catModel.getDistinctOpenids()
    const openidUsers = await Promise.all(allOpenids.map(async (oid) => {
      const user = await userModel.findByOpenid(oid)
      return { openid: oid, nickname: user ? (user.nickname || user.username) : null }
    }))
    renderWithLayout(res, 'cat-new', {
      title: '新增猫咪',
      manageUser: req.session.manageUser,
      openidUsers,
      error: '创建失败: ' + err.message
    })
  }
})

// ---- 编辑猫咪 ----

// 处理编辑表单提交
router.post('/cats/:id/update', adminUpload.fields([
  { name: 'photoFiles', maxCount: 9 },
  { name: 'soundFiles', maxCount: 5 }
]), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) return res.status(400).json({ error: '无效的猫咪 ID' })
    const { nickname, location_name, location_address, latitude, longitude,
            coatColors, hairLength, bodyType, specialFeatures, eyeColor,
            healthStatus, healthNote, personalities, relationships, notes,
            keepPhotoIds, keepSoundIds } = req.body

    if (!nickname || !nickname.trim()) {
      return res.redirect(`/${managePath}/cats/${id}?error=${encodeURIComponent('请输入猫咪昵称')}`)
    }

    // 处理多选字段
    const coatColorsArr = Array.isArray(coatColors) ? coatColors : (coatColors ? [coatColors] : [])
    const personalitiesArr = Array.isArray(personalities) ? personalities : (personalities ? [personalities] : [])

    // 保留的现有照片
    const keepIds = keepPhotoIds ? keepPhotoIds.split(',').filter(Boolean) : []
    const existingPhotos = await catModel.getPhotos(id)
    const photosToKeep = existingPhotos.filter(p => keepIds.includes(p.id))

    // 新上传的照片
    const newPhotos = []
    if (req.files && req.files.photoFiles) {
      req.files.photoFiles.forEach((file, i) => {
        newPhotos.push({
          id: path.parse(file.filename).name,
          url: `/uploads/photos/${file.filename}`,
          isCover: photosToKeep.length === 0 && i === 0
        })
      })
    }

    // 保留的现有音频
    const keepSids = keepSoundIds ? keepSoundIds.split(',').filter(Boolean) : []
    const existingSounds = await catModel.getSounds(id)
    const soundsToKeep = existingSounds.filter(s => keepSids.includes(s.id))

    // 新上传的音频
    const newSounds = []
    if (req.files && req.files.soundFiles) {
      req.files.soundFiles.forEach((file) => {
        newSounds.push({
          id: path.parse(file.filename).name,
          url: `/uploads/sounds/${file.filename}`,
          duration: 0,
          desc: '管理员上传'
        })
      })
    }

    const catData = {
      nickname: nickname.trim(),
      location: {
        name: location_name || '',
        address: location_address || '',
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0
      },
      photos: [...photosToKeep, ...newPhotos],
      sounds: [...soundsToKeep, ...newSounds],
      attributes: {
        coatColors: coatColorsArr,
        hairLength: hairLength || '',
        bodyType: bodyType || '',
        specialFeatures: specialFeatures || '',
        eyeColor: eyeColor || '',
        healthStatus: healthStatus || '',
        healthNote: healthNote || '',
        personalities: personalitiesArr,
        relationships: relationships || ''
      },
      notes: notes || ''
    }

    await catModel.updateByIdAdmin(id, catData)
    res.redirect(`/${managePath}/cats/${id}`)
  } catch (err) {
    console.error('更新猫咪失败:', err)
    res.redirect(`/${managePath}/cats/${req.params.id}?error=${encodeURIComponent('更新失败: ' + err.message)}`)
  }
})

module.exports = router
