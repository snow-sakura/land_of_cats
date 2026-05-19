const express = require('express')
const router = express.Router()
const catModel = require('../models/cat')

// 校验必填字段的辅助函数
function validateCreate(data) {
  const errors = []
  if (!data.nickname || !data.nickname.trim()) errors.push('猫咪昵称不能为空')
  if (!data.photos || data.photos.length === 0) errors.push('请至少添加一张照片')
  if (!data.attributes?.coatColors || data.attributes.coatColors.length === 0) errors.push('请选择毛色')
  if (!data.attributes?.personalities || data.attributes.personalities.length === 0) errors.push('请选择至少一个性格标签')
  if (!data.location?.name) errors.push('请选择遇见地点')
  return errors
}

// GET /api/cats — 获取当前用户的所有猫咪列表
router.get('/', async (req, res) => {
  try {
    const cats = await catModel.listByUser(req.openid)
    res.json({ success: true, data: cats })
  } catch (err) {
    console.error('获取猫咪列表失败:', err)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// GET /api/cats/:id — 获取单只猫咪详情
router.get('/:id', async (req, res) => {
  try {
    const cat = await catModel.getById(parseInt(req.params.id, 10), req.openid)
    if (!cat) {
      return res.status(404).json({ success: false, error: '猫咪档案不存在' })
    }
    res.json({ success: true, data: cat })
  } catch (err) {
    console.error('获取猫咪详情失败:', err)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// POST /api/cats — 创建猫咪档案
router.post('/', async (req, res) => {
  try {
    const errors = validateCreate(req.body)
    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: errors.join('; ') })
    }

    // 检查照片数量限制
    if (req.body.photos.length > 9) {
      return res.status(400).json({ success: false, error: '照片最多9张' })
    }

    const id = await catModel.create(req.body, req.openid)
    const cat = await catModel.getById(id, req.openid)
    res.status(201).json({ success: true, data: cat })
  } catch (err) {
    console.error('创建猫咪档案失败:', err)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// PUT /api/cats/:id — 更新猫咪档案
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const result = await catModel.update(id, req.openid, req.body)
    if (!result) {
      return res.status(404).json({ success: false, error: '猫咪档案不存在或无权操作' })
    }

    const cat = await catModel.getById(id, req.openid)
    res.json({ success: true, data: cat })
  } catch (err) {
    console.error('更新猫咪档案失败:', err)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

// DELETE /api/cats/:id — 删除猫咪档案（级联删除照片和音频）
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const deleted = await catModel.delete(id, req.openid)
    if (!deleted) {
      return res.status(404).json({ success: false, error: '猫咪档案不存在或无权操作' })
    }

    // 收集所有文件路径用于清理（现阶段保留物理文件，后续可扩展）
    const photoIds = deleted.photos.map(p => p.id).filter(Boolean)
    const soundIds = deleted.sounds.map(s => s.id).filter(Boolean)

    res.json({ success: true, data: { id, removedPhotos: photoIds.length, removedSounds: soundIds.length } })
  } catch (err) {
    console.error('删除猫咪档案失败:', err)
    res.status(500).json({ success: false, error: '服务器错误' })
  }
})

module.exports = router
